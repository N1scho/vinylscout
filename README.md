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

## Discover Mode

Browse ~2000 vinyl albums from 80 genres with cover images. Select genres, swipe through gallery, add to wishlist.

**Features:**
- Genre multi-select (Select All / Clear All)
- Album gallery with swipe, arrow keys, spacebar navigation
- Wishlist toggle (♡/♥ heart icon)
- Wishlist filter in Collection view

**Data Source:**
- Excel files in `C:\Users\nikol\Desktop\Claude\Genre Lists`
- Parsed at build time: `npm run build`
- Stored in localStorage + Zustand discoverStore

**Navigation:**
- Discover tab in bottom navigation
- Swipe left/right or use arrow keys to browse
- Spacebar for next album
- Click heart to add/remove from wishlist
