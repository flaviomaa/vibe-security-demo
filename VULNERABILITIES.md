# Die 6 Schwachstellen

Jede Lücke existiert nur in [`vulnerable/`](vulnerable) und ist in
[`secure/`](secure) an derselben Stelle sauber gefixt. Zum Nachvollziehen:
`diff -ru secure/src vulnerable/src` (oder die einzelnen Dateien unten direkt
vergleichen).

---

## #1 — Broken Access Control (IDOR)

**OWASP:** A01:2021 – Broken Access Control

**Datei:** [`vulnerable/src/app/api/bookings/[id]/route.ts`](vulnerable/src/app/api/bookings/[id]/route.ts)
vs. [`secure/src/app/api/bookings/[id]/route.ts`](secure/src/app/api/bookings/[id]/route.ts)

**Lücke:** `GET /api/bookings/:id` prüft nur, ob überhaupt jemand eingeloggt
ist — nicht, ob die Buchung dieser Person gehört. Jede eingeloggte Person
kann jede Buchung jeder anderen Person lesen (Name, E-Mail, Preis, Termin),
indem sie einfach eine andere ID einsetzt.

**Exploit:** `node exploits/01-idor-bookings.mjs <BASE_URL>`

**Fix (secure):** Nach dem Laden der Buchung wird geprüft, ob
`booking.userId === session.sub` (oder die Rolle `OWNER` ist). Kein Zugriff,
kein Match, kein Zugriff — der Server ist die einzige Instanz, die diese
Regel durchsetzt.

---

## #2 — Broken Access Control (fehlende Rollenprüfung / Privilege Escalation)

**OWASP:** A01:2021 – Broken Access Control

**Dateien:** `vulnerable/src/app/api/admin/{bookings,search}/route.ts`,
`vulnerable/src/app/api/admin/invoices/[id]/route.ts`

**Lücke:** Der "Admin"-Link in der Navigation wird nur für die Rolle
`OWNER` angezeigt (`components/Nav.tsx`) — das ist reine UI-Kosmetik. Die
API-Endpunkte selbst prüfen nur `getSession()` (eingeloggt?), nicht die
Rolle. Jeder normale `CLIENT`-Account kann `/api/admin/bookings` direkt
aufrufen und sieht die Daten aller Kunden.

**Exploit:** `node exploits/02-broken-authz-admin-api.mjs <BASE_URL>`

**Fix (secure):** `lib/session.ts` exportiert `requireOwner()`, das zuerst
Login und danach explizit `session.role === "OWNER"` prüft. Jede
Admin-Route ruft diese eine Funktion als ersten Schritt auf — die Regel
lebt an einer Stelle, nicht verstreut in der UI.

---

## #3 — SQL Injection

**OWASP:** A03:2021 – Injection

**Datei:** [`vulnerable/src/app/api/admin/search/route.ts`](vulnerable/src/app/api/admin/search/route.ts)

**Lücke:** Die Kundensuche baut das SQL per String-Concatenation und führt
es mit `prisma.$queryRawUnsafe(sql)` aus. Der Suchbegriff landet
ungefiltert im Query-String. Payload `x' OR '1'='1' -- ` macht die
WHERE-Klausel immer wahr und kommentiert den Rest weg → alle User-Zeilen
(inkl. Rolle) werden zurückgegeben, unabhängig vom Suchbegriff.

**Exploit:** `node exploits/03-sql-injection-search.mjs <BASE_URL>`

**Fix (secure):** Gleiche Grundidee (raw SQL für eine `LIKE`-Suche), aber
mit `prisma.$queryRaw` als **Tagged Template**: der Suchbegriff wird als
gebundener Parameter übergeben, nie als Teil des SQL-Strings. Rohes SQL ist
also nicht per se das Problem — String-Concatenation ist es.

---

## #4 — Secret-Exposure im Client-Bundle

**OWASP:** A02:2021 – Cryptographic Failures / Sensitive Data Exposure

**Dateien:** `vulnerable/.env` (`NEXT_PUBLIC_NOTIFY_API_KEY`),
[`vulnerable/src/components/ResendButton.tsx`](vulnerable/src/components/ResendButton.tsx)

**Lücke:** Das Feature "Bestätigung erneut senden" ruft die (simulierte)
E-Mail-API direkt aus dem Browser auf und braucht dafür einen API-Key. Der
Key liegt als `NEXT_PUBLIC_NOTIFY_API_KEY` in `.env` — jede `NEXT_PUBLIC_`-
Variable wird von Next.js zur Build-Zeit fest in das Client-JS-Bundle
eingebacken. Der Key steht damit im Klartext in einer `.js`-Datei, die
jede:r ohne Login herunterladen kann.

**Exploit:** `node exploits/04-exposed-secret.mjs <BASE_URL>` (lädt die
Dashboard-Bundles, sucht den Key-Präfix, missbraucht den gefundenen Key
danach gegen die Mail-API)

**Fix (secure):** Derselbe Key heißt `NOTIFY_API_KEY` (kein
`NEXT_PUBLIC_`-Präfix) und wird ausschließlich in einer Server Action
(`app/dashboard/actions.ts`) gelesen — Server-only Code landet nie im
Client-Bundle. Der Browser sieht den Key nie.

---

## #5 — Schwache Authentifizierung

**OWASP:** A07:2021 – Identification and Authentication Failures

**Datei:** [`vulnerable/src/lib/auth.ts`](vulnerable/src/lib/auth.ts),
[`vulnerable/src/app/api/auth/login/route.ts`](vulnerable/src/app/api/auth/login/route.ts)

**Lücke:** Zwei Probleme zusammen:

1. Passwörter werden mit ungesalzenem SHA-1 gehasht (`createHash("sha1")`).
   Kein Salt heißt: identische Passwörter → identischer Hash. SHA-1 ist
   für Passwort-Hashing viel zu schnell — Rainbow-Table- oder
   Brute-Force-Angriffe auf einen geleakten Datenbank-Dump sind billig.
2. Der Login-Endpoint hat kein Rate-Limiting. Beliebig viele
   Passwort-Versuche pro Sekunde sind möglich, kein Lockout, kein 429.

**Exploit:** `node exploits/05-brute-force-login.mjs <BASE_URL>` (20
Login-Versuche in einer Sekunde, keiner wird geblockt)

**Fix (secure):** `bcrypt` mit 12 Runden (Salt pro Hash eingebaut,
absichtlich langsam) statt SHA-1, plus ein einfacher In-Memory-Rate-Limiter
(`lib/rate-limit.ts`), der nach 5 Fehlversuchen pro IP+E-Mail-Kombination
innerhalb einer Minute mit `429` antwortet.

---

## #6 — Business-Logic-Fehler: Preis-Manipulation

**OWASP:** A04:2021 – Insecure Design (Broken Business Logic)

**Datei:** [`vulnerable/src/app/api/bookings/route.ts`](vulnerable/src/app/api/bookings/route.ts)

**Lücke:** Beim Anlegen einer Buchung wird `priceCents` direkt aus dem
Request-Body übernommen und so in DB und Rechnung gespeichert. Die UI
schickt zwar immer den korrekten Katalogpreis mit — aber nichts hindert
einen direkten API-Call daran, `priceCents: 1` statt `24900` zu senden.

**Exploit:** `node exploits/06-price-tampering.mjs <BASE_URL>` (bucht den
teuersten Workshop für 1 Cent)

**Fix (secure):** Der Preis wird nie aus dem Request gelesen. Stattdessen
lädt der Server den `SessionType` anhand der mitgeschickten ID aus der DB
und verwendet dessen `priceCents` — der einzige Preis, der je entsteht, ist
der, den der Server selbst im Katalog nachschlägt.
