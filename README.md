# vibe-security-demo

**Beweis statt Behauptung: dieselbe App, einmal mit typischen "vibe-coded"-Sicherheitslücken gebaut, einmal sauber — mit Scripts, die den Unterschied automatisiert nachweisen.**

Der Anlass: "Vibe-gecodete" Apps landen immer öfter bei echten Sicherheitsaudits, weil niemand während des Bauens die Frage stellt *"was passiert, wenn ich diesen Request direkt umgehe?"*. Statt das nur zu behaupten, zeigt dieses Repo es an einem konkreten, laufenden Beispiel — Code zum Anschauen, Angriffe zum Selbst-Ausführen, Fixes zum Vergleichen.

## Was hier drinsteckt

Zwei funktional identische Next.js-Apps — **ClientPortal**, ein Mini-Buchungssystem für Freelancer/Coaches (Login, Session-Buchung, Rechnungen, Owner-Dashboard):

| Ordner | Was |
|---|---|
| [`secure/`](secure) | Sauber gebaute Referenzversion |
| [`vulnerable/`](vulnerable) | Identischer Funktionsumfang, aber mit 6 realistischen, absichtlich eingebauten Sicherheitslücken |
| [`exploits/`](exploits) | Ein Angriffs-Script pro Lücke — läuft gegen jede beliebige `BASE_URL` |
| [`VULNERABILITIES.md`](VULNERABILITIES.md) | Jede Lücke einzeln: OWASP-Kategorie, betroffene Datei, Exploit, Fix |

Beide Apps sehen exakt gleich aus und haben denselben Funktionsumfang — der einzige Unterschied liegt im Server-Code. Das ist der ganze Punkt: Sicherheit ist (fast) nie sichtbar in der UI, sie entscheidet sich ausschließlich darin, was der Server bei einer Anfrage tatsächlich prüft.

## Die 6 Lücken im Überblick

| # | Lücke | OWASP-Kategorie | Kurz erklärt |
|---|---|---|---|
| 1 | IDOR | A01 Broken Access Control | Fremde Buchung lesbar, indem man einfach eine andere ID einsetzt |
| 2 | Fehlende Rollenprüfung | A01 Broken Access Control | Admin-API prüft nur "eingeloggt?", nicht "welche Rolle?" |
| 3 | SQL Injection | A03 Injection | Suchfeld baut SQL per String-Concat statt parametrisierter Query |
| 4 | Secret-Exposure | A02 Cryptographic Failures | API-Key mit `NEXT_PUBLIC_`-Präfix landet im Client-JS-Bundle |
| 5 | Schwache Authentifizierung | A07 Identification & Auth Failures | Unsalted SHA-1 statt bcrypt, kein Rate-Limit auf Login |
| 6 | Preis-Manipulation | A04 Insecure Design | Server übernimmt clientseitig gesendeten Preis statt ihn selbst nachzuschlagen |

Details, Code-Referenzen und die konkrete Fix-Logik zu jeder einzelnen Lücke: [VULNERABILITIES.md](VULNERABILITIES.md).

## Selbst ausprobieren

Beide Apps laufen komplett lokal (SQLite, kein externer Server nötig).

**PowerShell** (Windows-Standardterminal — kennt kein `&&`, Befehle einzeln ausführen):

```powershell
cd secure
npm install
npm run seed
npm run dev -- -p 3000
```

```powershell
cd vulnerable
npm install
npm run seed
npm run dev -- -p 3001
```

**Bash / macOS / Linux:**

```bash
cd secure && npm install && npm run seed && npm run dev -- -p 3000
```

```bash
cd vulnerable && npm install && npm run seed && npm run dev -- -p 3001
```

Demo-Zugänge (identisch in beiden Apps):

- Owner: `owner@clientportal.demo` / `OwnerPass123!`
- Client: `client@clientportal.demo` / `ClientPass123!`

### Die Angriffe laufen lassen

```bash
node exploits/01-idor-bookings.mjs http://localhost:3001   # vulnerable
node exploits/01-idor-bookings.mjs http://localhost:3000   # secure
```

Jedes Script in `exploits/` funktioniert so gegen beide Ports. Beispiel-Output:

```
#1 IDOR — Attacker B reads Victim A's booking via GET /api/bookings/:id
  target: http://localhost:3001
  result: EXPLOIT SUCCEEDED  (leaked client=Victim A <...> price=9900)

#1 IDOR — Attacker B reads Victim A's booking via GET /api/bookings/:id
  target: http://localhost:3000
  result: blocked  (status=403 {"error":"Nicht erlaubt."})
```

Gleicher Angriff, gleicher Code — einmal erfolgreich, einmal blockiert. Genau dieser Kontrast ist der Beweis.

## Stack

Next.js 16 (App Router, Server Components) · Prisma 7 + SQLite (Driver Adapter) · bcrypt · Tailwind CSS · reines Node.js für die Exploit-Scripts (kein Framework, keine Dependencies)

## Warum das Ganze

Sicherheit lässt sich nicht durch "vorsichtiger sein" lösen — sie entsteht durch ein paar wiederkehrende, lernbare Prinzipien: der Server ist die einzige Instanz, die "darf das?" entscheiden darf; jede Prüfung muss serverseitig passieren, nie nur im Frontend; und die Grundfrage bei jedem Feature ist nicht "wie verstecke ich das besser", sondern "was passiert, wenn ein Angreifer alles außer dem eigentlichen Berechtigungsnachweis kennt — reicht das trotzdem nicht?". Dieses Repo macht genau das an sechs konkreten, nachvollziehbaren Beispielen sichtbar.
