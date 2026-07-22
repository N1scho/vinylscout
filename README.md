# VinylScout

Vinyl-Sammlung verwalten: Discogs-Suche mit Marktpreisen, KI-Cover-Erkennung
per Kamera, Sammlungs-Statistiken. React-PWA, deployt auf Vercel.

**Current Version:** 3.1.1  
**Status:** ✅ Phase 1 (stabilization) + Phase 2 (data management) complete

## Entwicklung

Voraussetzungen: Node 20+, Vercel CLI (`npm i -g vercel`), einmalig `vercel login` + `vercel link`.

```bash
npm install
cp .env.example .env         # Keys eintragen (DISCOGS_TOKEN, ANTHROPIC_API_KEY)
vercel dev                   # startet Vite Frontend UND api/-Functions gemeinsam
```

**⚠️ WICHTIG:** Nutze **`vercel dev`**, NICHT `npm run dev`!
- `npm run dev` = nur Frontend (Suche zeigt "No price data")
- `vercel dev` = Frontend + Backend zusammen (Preise laden korrekt)
- `.env` Datei (nicht `.local`) wird von `vercel dev` geladen
- `.env` wird von Git ignoriert (Secrets sind sicher)

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
