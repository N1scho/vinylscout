# VinylScout

Vinyl-Sammlung verwalten: Discogs-Suche mit Marktpreisen, KI-Cover-Erkennung
per Kamera, Sammlungs-Statistiken. React-PWA, deployt auf Vercel.

**Current Version:** 3.1.1  
**Status:** ✅ Phase 1 (stabilization) + Phase 2 (data management) complete

## Entwicklung

Voraussetzungen: Node 20+, Vercel CLI (`npm i -g vercel`), einmalig `vercel login` + `vercel link`.

```bash
npm install
cp .env.example .env.local   # Keys eintragen (DISCOGS_TOKEN, ANTHROPIC_API_KEY)
vercel dev                   # startet Vite UND die api/-Functions
```

Wichtig: `npm run dev` startet nur das Frontend — Suche und Kamera-Erkennung
brauchen die Serverless Functions und funktionieren nur unter `vercel dev`.

## Tests & Build

```bash
npx vitest run    # Tests
npm run lint      # ESLint
npm run build     # Produktions-Build
```

## Deployment

Push auf `master` → Vercel baut automatisch. Die Env-Variablen `DISCOGS_TOKEN`
und `ANTHROPIC_API_KEY` müssen im Vercel-Dashboard gesetzt sein
(Project → Settings → Environment Variables).

## Architektur

- `src/` — React-App (Zustand-Stores, Views, Services)
- `api/discogs-proxy.js` — einziger Weg zur Discogs-API (Server-Token)
- `api/analyze.js` — Cover-Erkennung via Claude (Server-Key)
- Sammlung liegt in localStorage mit rollierenden Backups
  (`vinyl-collection-backup-1..3`)
