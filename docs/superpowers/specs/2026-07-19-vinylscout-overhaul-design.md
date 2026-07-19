# VinylScout Überarbeitung — Design-Spezifikation

**Datum:** 2026-07-19
**Status:** Freigegeben (Design-Gespräch), wartet auf Spec-Review
**Ansatz:** A — Stabilisieren, dann erweitern (kein Neubau)

## 1. Ausgangslage & Ziel

VinylScout (React 19 + Vite 7 PWA, Vercel-Deployment) funktioniert nicht zuverlässig. Betroffen sind alle drei Kernbereiche: Discogs-Suche/Preise, Kamera-Erkennung, Sammlung/Daten. Die App wird ausschließlich über das Vercel-Deployment genutzt. Die Sammlung enthält echte Daten — Datenverlust ist inakzeptabel.

**Ziel:** Alle bestehenden Funktionen (Suche, Kamera, Sammlung, Stats, Settings) laufen zuverlässig. Danach zwei neue Features: Barcode-Scan und Wantlist. Sammlungsdaten bleiben zu jedem Zeitpunkt erhalten.

### Bereits identifizierte Root Causes

1. **Kamera-Erkennung kann nie funktionieren:** `api/analyze.js` liefert `{artist, album}`, aber `App.jsx` (Zeile ~270) prüft `result.searchTerms` — existiert nie, daher immer "Could not identify vinyl", selbst bei korrekter Erkennung.
2. **Discogs-Proxy hängt in der Luft:** `src/services/discogsService.js` ruft `api.discogs.com` direkt aus dem Browser auf, inkl. verbotenem `User-Agent`-Header. `api/discogs-proxy.js` existiert, wird aber nie benutzt und erwartet einen Server-Env-Token, den das Frontend nicht kennt. Fehler werden als generisches "Search failed" verschluckt.
3. **Token-Chaos:** Settings speichern User-Tokens verschlüsselt im Browser (`secureStorage`), Proxy erwartet Server-Env-Token — zwei konkurrierende Auth-Wege.
4. **Fragile Kamera-API:** `analyze.js` nutzt veraltetes Modell (`claude-sonnet-4-20250514`), parst die Antwort mit nacktem `JSON.parse` auf regex-bereinigtem Text, und reicht den Anthropic-Key vom Client durch.
5. **Versions-Wildwuchs:** package.json sagt 2.5.0, App.jsx sagt 2.12.1, Services sagen 2.8.0.

## 2. Architektur-Entscheidungen

### 2.1 Ein API-Weg statt zwei

Alle Discogs-Aufrufe laufen durch `api/discogs-proxy.js`. `discogsService.js` wird dünner Client des Proxys (POST an `/api/discogs-proxy` mit `{endpoint, params}`).

Vorteile: kein CORS/User-Agent-Problem im Browser, zentrales Rate-Limit- und Retry-Handling, echte Fehlermeldungen. Der Proxy behält seine bestehende Schnittstelle, bekommt aber Retry-Logik (bei 429 mit `Retry-After`) und differenzierte Fehlerobjekte.

### 2.2 API-Keys server-seitig

- `DISCOGS_TOKEN` und `ANTHROPIC_API_KEY` als Vercel-Umgebungsvariablen (Production) und in `.env.local` (lokal via `vercel dev`).
- Settings-View verliert die Token-Eingabefelder; `secureStorage.js` (Browser-Verschlüsselung via crypto-js) entfällt vollständig, inkl. Token-Migrationscode in App.jsx.
- Konsequenz: App funktioniert nur mit dem eigenen Vercel-Deployment. Einzelnutzer-Szenario — akzeptiert. Falls später Fremdnutzer eigene Keys brauchen, wird Token-Eingabe als Fallback nachgerüstet.

### 2.3 Kamera-Kette reparieren

- Interface-Bug fixen: einheitlicher Rückgabewert `{artist, album}`; App baut daraus den Suchstring (statt des nicht existierenden `searchTerms`).
- `api/analyze.js` härten:
  - Modell: `claude-opus-4-8` (aktuell; Modell-ID exakt so).
  - Strukturierte JSON-Ausgabe via `output_config.format` (json_schema) statt Text-Parsing — garantiert valides `{artist, album}`.
  - `@anthropic-ai/sdk` auf aktuelle Version heben (^0.67.0 ist zu alt für `output_config`).
  - Key aus `process.env.ANTHROPIC_API_KEY` statt vom Client.
  - Bildvalidierung (Größe, Format) vor dem API-Call.

### 2.4 Storage robust

Sammlung bleibt in localStorage. Härtung:

- Zod-Schema (existiert teilweise in `src/schemas/vinylSchemas.js`) validiert bei jedem Laden und Speichern.
- Versioniertes Schema mit Migrationsfunktionen (`schemaVersion`-Feld). Migrationen nur additiv, nie destruktiv.
- Automatisches rollierendes Backup: letzte 3 Speicherstände unter separatem localStorage-Key; Wiederherstellungspfad bei Validierungsfehler statt stillem Datenverlust.
- Quota-Fehler (`QuotaExceededError`) abgefangen mit Nutzer-Hinweis.
- Duplikate `src/utils/storage.js` vs. `src/services/storageService.js` werden zu einem Modul konsolidiert.

### 2.5 Fehlerbehandlung einheitlich

- Zentraler Error-Handler (`src/utils/errorHandler.js` ausbauen): typisierte Fehler (z. B. `RateLimitError`, `NetworkError`, `ValidationError`).
- API-Schichten werfen typisierte Fehler; UI zeigt konkrete Meldung + Toast.
- Kein stilles `return null` mehr (aktuell z. B. in `fetchPriceInfo`).

## 3. Optimierung (Phase 2)

### Performance

- **React Query** (installiert, ungenutzt) für Suche und Preise: Caching, Request-Deduplizierung, Hintergrund-Refresh.
- **Virtualisierung** der Sammlungsliste mit `@tanstack/react-virtual` (installiert, ungenutzt).
- **Preis-Updates:** Fortschrittsanzeige ("34/120"), pausier-/abbrechbar, Einträge mit Preis jünger als 24 h werden übersprungen.

### Aufräumen

- App.jsx (618 Zeilen): Preis-Update-Logik in eigenen Hook, Ziel unter 200 Zeilen.
- Duplikate entfernen: `DetailModal` vs. `EnhancedDetailModal` (Enhanced bleibt), `storage.js` vs. `storageService.js`, `dev-dist/`.
- Eine Versionsnummer, Quelle: package.json.
- ~30 Doku-MD-Dateien im Root nach `.archive/`; README bekommt echten Inhalt.

### Tests

Bestehende Tests reparieren/anpassen; neue Tests für Proxy-Client, Storage-Migrationen/Backup, Kamera-Kette. Jede Phase endet mit grünem `npm test` und `npm run build`.

## 4. Neue Features (Phase 3)

### Barcode-Scan

- Kamera-View bekommt Umschalter: Cover-Foto (KI) / Barcode.
- Nativ per Browser-`BarcodeDetector`-API; Fallback für iOS/Safari: `@zxing/browser`.
- Barcode geht direkt an Discogs-Suche (`barcode=`-Parameter) — exakter Treffer, keine Anthropic-Kosten.

### Wantlist

- Eigener Tab in der Navigation, eigener Zustand-Store (`wantlistStore`), gleiche Storage-Absicherung wie Sammlung (Zod + Backup + Migration).
- "Merken"-Button in Suchergebnissen neben "Zur Sammlung".
- Preisbeobachtung: beim App-Start Preise der Wantlist prüfen (rate-limitiert über Proxy), Preisverlauf pro Eintrag, Badge bei Preisrückgang, optionaler Zielpreis.
- Ein Klick verschiebt Wantlist-Eintrag in die Sammlung.

## 5. Datensicherheit & Verifikation

### Phase 0 — Sicherung (vor jeder Code-Änderung)

1. Sammlung als JSON exportieren, Kopie außerhalb des Projekts.
2. Uncommittete Änderungen sichten und committen; Arbeit auf Feature-Branch.
3. Doku-Ballast nach `.archive/` verschieben.

### Verifikationsregeln (jede Phase)

- `npm test` + `npm run build` grün.
- Lokal mit `vercel dev` (damit `api/`-Functions laufen); `DISCOGS_TOKEN` + `ANTHROPIC_API_KEY` in `.env.local`.
- Smoke-Checkliste: Suche liefert Ergebnisse + Preise; Kamera erkennt Testcover; Sammlung übersteht Reload; Import/Export-Roundtrip verlustfrei.
- Deployment: erst Vercel-Preview testen, dann Production.

### Eiserne Regeln

- Keine Änderung an Storage-Code ohne automatisches Backup im Code selbst.
- Migrationen nur additiv, nie destruktiv.
- Jede Phase einzeln committet und deploybar.

## 6. Phasenplan

| Phase | Inhalt | App lauffähig danach |
|---|---|---|
| 0 | Backup, Git-Stand sauber, Doku archiviert | ja (unverändert) |
| 1 | Proxy-Umbau, Kamera-Fix, Storage-Härtung, Keys server-seitig, Fehlerbehandlung | ja — Kernfunktionen zuverlässig |
| 2 | React Query, Virtualisierung, App.jsx schlank, Duplikate weg, Tests grün | ja — schneller, wartbar |
| 3 | Barcode-Scan + Wantlist | ja — voller Umfang |

## 7. Voraussetzungen (Nutzer)

- Discogs-Token + Anthropic-Key ins Vercel-Dashboard (Environment Variables) eintragen.
- Dieselben Keys in lokale `.env.local` (wird beim Setup angeleitet, Datei bleibt un-committet).
- Vercel CLI lokal eingeloggt (`vercel login`) für `vercel dev`.

## 8. Explizit außerhalb des Scopes

- Kompletter Neubau / TypeScript-Migration.
- Cloud-Sync / Multi-Device (localStorage bleibt einzige Quelle).
- Discogs-Sammlungs-Sync.
- Multi-User-Betrieb mit eigenen API-Keys (Fallback nur bei Bedarf später).
