# vibe-security-demo

Zwei identisch aussehende Versionen derselben Mini-SaaS-App ("ClientPortal" —
Buchungssystem für Freelancer/Coaches):

- [`secure/`](secure) — sauber gebaute Referenzversion
- [`vulnerable/`](vulnerable) — dieselbe App mit 6 absichtlich eingebauten,
  realistischen Sicherheitslücken (siehe [VULNERABILITIES.md](VULNERABILITIES.md))
- [`exploits/`](exploits) — ein Node-Script pro Lücke, das den Angriff gegen
  eine `BASE_URL` fährt: erfolgreich gegen `vulnerable`, blockiert gegen `secure`

Beide Apps haben identischen Funktionsumfang (Login, Buchungen, Owner-Dashboard,
Avatar-Upload) und dieselbe UI — der einzige Unterschied liegt im Server-Code.

## Setup

Beide Apps sind eigenständige Next.js-Projekte mit lokaler SQLite-Datenbank,
kein externer Server nötig.

```bash
cd secure && npm install && npm run seed && npm run dev -- -p 3000
```

```bash
cd vulnerable && npm install && npm run seed && npm run dev -- -p 3001
```

Demo-Zugänge (beide Apps, gleiche Daten-Struktur):

- Owner: `owner@clientportal.demo` / `OwnerPass123!`
- Client: `client@clientportal.demo` / `ClientPass123!`

## Exploits laufen lassen

```bash
node exploits/01-idor-bookings.mjs http://localhost:3001          # vulnerable -> succeeds
node exploits/01-idor-bookings.mjs http://localhost:3000          # secure -> blocked
```

Jedes Script in `exploits/` lässt sich so gegen beide Ports laufen lassen.
Siehe [VULNERABILITIES.md](VULNERABILITIES.md) für die Erklärung jeder Lücke.

## Stack

Next.js 16 (App Router) · Prisma 7 + SQLite · bcrypt (secure) · Tailwind
