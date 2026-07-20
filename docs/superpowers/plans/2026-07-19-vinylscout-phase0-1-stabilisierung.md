# VinylScout Phase 0+1 (Sicherung + Stabilisierung) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alle Kernfunktionen (Discogs-Suche/Preise, Kamera-Erkennung, Sammlung) laufen zuverlässig; API-Keys server-seitig; Storage mit Backup und Validierung.

**Architecture:** Alle Discogs-Aufrufe laufen über die Vercel-Function `api/discogs-proxy.js` (Server-Token aus Env). Die Kamera-Erkennung läuft über `api/analyze.js` mit `claude-opus-4-8` und strukturierter JSON-Ausgabe. Client-seitige Token-Verwaltung (secureStorage, Settings-Felder) entfällt vollständig. Die Sammlung bleibt in localStorage, bekommt aber einen Storage-Adapter mit rollierenden Backups und Validierung.

**Tech Stack:** React 19, Vite 7, Zustand 5, Zod 4, Vitest 4, Vercel Serverless Functions, `@anthropic-ai/sdk` (aktuellste Version).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-19-vinylscout-overhaul-design.md`
- Sammlungsdaten dürfen NIE verloren gehen. Storage-Migrationen nur additiv. Vor jedem Überschreiben von localStorage-Daten: Backup.
- Claude-Modell-ID exakt: `claude-opus-4-8` (nie mit Datumssuffix).
- Env-Variablen exakt: `DISCOGS_TOKEN`, `ANTHROPIC_API_KEY` (Vercel Dashboard + `.env.local`).
- `.env*`-Dateien nie committen (steht in `.gitignore`).
- Arbeit auf Branch `overhaul/phase-1`; nach jedem Task committen.
- Lokale Verifikation der `api/`-Functions nur via `vercel dev` (nicht `npm run dev`).
- Tests: `npx vitest run <datei>` für Einzeldateien, `npx vitest run` für alles.
- Bestehende, VOR diesem Plan fehlschlagende Tests werden in Task 1 dokumentiert und gelten nicht als Regression.

---

### Task 1: Phase 0 — Branch, Baseline, Doku archivieren, Version vereinheitlichen

**Files:**
- Modify: `package.json` (Version)
- Modify: `src/App.jsx:43` (APP_VERSION)
- Move: alle Root-`*.md` außer `README.md`/`CHANGELOG.md` sowie `SETUP_COMPLETE.txt` → `.archive/docs/`

**Interfaces:**
- Produces: Branch `overhaul/phase-1`; `package.json.version = "3.0.0"` als einzige Versionsquelle; App.jsx importiert `version` aus package.json.

- [ ] **Step 1: User-Backup bestätigen**

Vor Code-Änderungen: Nutzer exportiert Sammlung in der laufenden App (Settings → Export) und legt die JSON-Datei außerhalb des Projekts ab. Ohne Bestätigung nicht weitermachen.

- [ ] **Step 2: Branch anlegen**

```bash
cd "C:/Users/nikol/vinylscout"
git checkout -b overhaul/phase-1
```

- [ ] **Step 3: Baseline aufnehmen**

```bash
npx vitest run 2>&1 | tail -20
npm run build 2>&1 | tail -5
```

Ergebnis notieren. Fehlschlagende Tests sind Baseline (nicht in diesem Task fixen), Build muss grün sein.

- [ ] **Step 4: Doku-Ballast archivieren**

```bash
mkdir -p .archive/docs
for f in *.md; do
  case "$f" in README.md|CHANGELOG.md) ;; *) git mv "$f" .archive/docs/ ;; esac
done
git mv SETUP_COMPLETE.txt .archive/docs/
```

- [ ] **Step 5: Version vereinheitlichen**

In `package.json`: `"version": "3.0.0"`.

In `src/App.jsx` Zeile 42–43 ersetzen:

```javascript
// Alt:
// App Version
const APP_VERSION = '2.12.1';

// Neu:
import { version as APP_VERSION } from '../package.json';
```

Der Import muss zu den anderen Imports an den Dateianfang (vor `export default function App()`).

- [ ] **Step 6: Build prüfen**

Run: `npm run build`
Expected: erfolgreich, keine neuen Fehler.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: phase 0 - archive docs, unify version to 3.0.0

Baseline test status: <hier notierte Baseline eintragen>"
```

---

### Task 2: Typisierte Fehlerklassen

**Files:**
- Create: `src/utils/errors.js`
- Test: `src/utils/errors.test.js`

**Interfaces:**
- Produces: `AppError`, `NetworkError`, `RateLimitError(retryAfterSeconds)`, `ApiError(message, status, details)` — genutzt von Task 4 (discogsService) und UI-Fehleranzeige.

- [ ] **Step 1: Failing Test schreiben**

```javascript
// src/utils/errors.test.js
import { describe, it, expect } from 'vitest';
import { AppError, NetworkError, RateLimitError, ApiError } from './errors';

describe('error classes', () => {
  it('NetworkError is an AppError with correct name', () => {
    const err = new NetworkError('offline');
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('NetworkError');
    expect(err.message).toBe('offline');
  });

  it('RateLimitError carries retryAfter and default message', () => {
    const err = new RateLimitError(30);
    expect(err.retryAfter).toBe(30);
    expect(err.message).toContain('30');
    expect(new RateLimitError().retryAfter).toBe(60);
  });

  it('ApiError carries status and details', () => {
    const err = new ApiError('Discogs request failed', 502, 'upstream down');
    expect(err.status).toBe(502);
    expect(err.details).toBe('upstream down');
    expect(err.name).toBe('ApiError');
  });
});
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `npx vitest run src/utils/errors.test.js`
Expected: FAIL ("Failed to resolve import ./errors")

- [ ] **Step 3: Implementierung**

```javascript
// src/utils/errors.js
export class AppError extends Error {
  constructor(message) {
    super(message);
    this.name = new.target.name;
  }
}

export class NetworkError extends AppError {}

export class RateLimitError extends AppError {
  constructor(retryAfterSeconds = 60) {
    super(`Rate limit erreicht. Bitte in ${retryAfterSeconds} Sekunden erneut versuchen.`);
    this.retryAfter = retryAfterSeconds;
  }
}

export class ApiError extends AppError {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
```

- [ ] **Step 4: Test laufen lassen — muss grün sein**

Run: `npx vitest run src/utils/errors.test.js`
Expected: PASS (3 Tests)

- [ ] **Step 5: Commit**

```bash
git add src/utils/errors.js src/utils/errors.test.js
git commit -m "feat: add typed error classes for API layer"
```

---

### Task 3: Discogs-Proxy härten (api/discogs-proxy.js)

**Files:**
- Modify: `api/discogs-proxy.js` (komplett ersetzen)
- Test: `api/__tests__/discogs-proxy.test.js`

**Interfaces:**
- Consumes: `process.env.DISCOGS_TOKEN`
- Produces: `POST /api/discogs-proxy` mit Body `{endpoint: string, params?: object}`. Antworten: 200 = Discogs-JSON durchgereicht; 400 = ungültiger/nicht erlaubter Endpoint; 405 = falsche Methode; 429 = `{error, retryAfter: number}`; 5xx = `{error, details}`. Erlaubte Endpoints: `/database/search`, `/marketplace/stats/{id}`, `/releases/{id}`.

- [ ] **Step 1: Failing Tests schreiben**

```javascript
// api/__tests__/discogs-proxy.test.js
// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../discogs-proxy.js';

function createRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    end() { return this; },
  };
}

describe('discogs-proxy handler', () => {
  beforeEach(() => {
    vi.stubEnv('DISCOGS_TOKEN', 'test-token');
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('rejects non-POST', async () => {
    const res = createRes();
    await handler({ method: 'GET' }, res);
    expect(res.statusCode).toBe(405);
  });

  it('rejects endpoints outside the allowlist', async () => {
    const res = createRes();
    await handler(
      { method: 'POST', body: { endpoint: '/users/evil' } },
      res
    );
    expect(res.statusCode).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns 500 with details when DISCOGS_TOKEN missing', async () => {
    vi.stubEnv('DISCOGS_TOKEN', '');
    const res = createRes();
    await handler(
      { method: 'POST', body: { endpoint: '/database/search', params: { q: 'x' } } },
      res
    );
    expect(res.statusCode).toBe(500);
    expect(res.body.details).toContain('DISCOGS_TOKEN');
  });

  it('proxies an allowed search request with token header', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ results: [{ id: 1 }] }),
    });
    const res = createRes();
    await handler(
      { method: 'POST', body: { endpoint: '/database/search', params: { q: 'nirvana' } } },
      res
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.results).toHaveLength(1);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('https://api.discogs.com/database/search?q=nirvana');
    expect(opts.headers.Authorization).toBe('Discogs token=test-token');
  });

  it('passes through 429 with retryAfter', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: (h) => (h === 'Retry-After' ? '42' : null) },
      text: async () => 'rate limited',
    });
    const res = createRes();
    await handler(
      { method: 'POST', body: { endpoint: '/marketplace/stats/123' } },
      res
    );
    expect(res.statusCode).toBe(429);
    expect(res.body.retryAfter).toBe(42);
  });

  it('maps upstream errors to same status with details', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      headers: { get: () => null },
      text: async () => 'not found',
    });
    const res = createRes();
    await handler(
      { method: 'POST', body: { endpoint: '/releases/999' } },
      res
    );
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Discogs API request failed');
  });
});
```

- [ ] **Step 2: Tests laufen lassen — Allowlist-Tests müssen fehlschlagen**

Run: `npx vitest run api/__tests__/discogs-proxy.test.js`
Expected: FAIL (mindestens "rejects endpoints outside the allowlist" — alter Handler kennt keine Allowlist)

- [ ] **Step 3: Handler komplett ersetzen**

```javascript
// api/discogs-proxy.js
/**
 * Discogs API Proxy — einziger Weg vom Client zur Discogs-API.
 * Token bleibt server-seitig (DISCOGS_TOKEN Env-Variable).
 */

const ALLOWED_ENDPOINTS = [
  /^\/database\/search$/,
  /^\/marketplace\/stats\/\d+$/,
  /^\/releases\/\d+$/,
];

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { endpoint, params } = req.body || {};

  if (
    !endpoint ||
    typeof endpoint !== 'string' ||
    !ALLOWED_ENDPOINTS.some((re) => re.test(endpoint))
  ) {
    return res.status(400).json({ error: 'Endpoint not allowed', endpoint });
  }

  const token = process.env.DISCOGS_TOKEN;
  if (!token) {
    console.error('DISCOGS_TOKEN not configured');
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'DISCOGS_TOKEN not configured on server',
    });
  }

  let url = `https://api.discogs.com${endpoint}`;
  if (params && Object.keys(params).length > 0) {
    url += `?${new URLSearchParams(params).toString()}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Discogs token=${token}`,
        'User-Agent': 'VinylScout/3.0',
      },
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
      return res.status(429).json({ error: 'Rate limit exceeded', retryAfter });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Discogs API error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Discogs API request failed',
        status: response.status,
        details: errorText,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(502).json({
      error: 'Upstream request failed',
      details: error.message,
    });
  }
}
```

- [ ] **Step 4: Tests laufen lassen — alle grün**

Run: `npx vitest run api/__tests__/discogs-proxy.test.js`
Expected: PASS (6 Tests)

- [ ] **Step 5: Commit**

```bash
git add api/discogs-proxy.js api/__tests__/discogs-proxy.test.js
git commit -m "feat: harden discogs proxy with endpoint allowlist and structured errors"
```

---

### Task 4: discogsService als Proxy-Client neu schreiben

**Files:**
- Modify: `src/services/discogsService.js` (komplett ersetzen)
- Test: `src/services/discogsService.test.js` (neu)

**Interfaces:**
- Consumes: `NetworkError`, `RateLimitError`, `ApiError` aus `src/utils/errors.js` (Task 2); Proxy-Vertrag aus Task 3.
- Produces (von Task 5 genutzt — Signaturen OHNE token):
  - `searchDiscogs({isAdvanced, query, advancedSearch, page, perPage}) → Promise<{results, pagination}>`
  - `fetchPriceInfo(releaseId) → Promise<{value, currency, num_for_sale, stats} | null>`
  - `fetchVinylDetails(id) → Promise<object | null>`
  - `fetchMultiplePrices(items, onProgress?, batchSize?) → Promise<Record<id, price>>`
  - `waitForRateLimit() → Promise<void>`

- [ ] **Step 1: Failing Tests schreiben**

```javascript
// src/services/discogsService.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchDiscogs, fetchPriceInfo, fetchVinylDetails } from './discogsService';
import { RateLimitError, ApiError, NetworkError } from '../utils/errors';

describe('discogsService (proxy client)', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const okResponse = (payload) => ({
    ok: true,
    status: 200,
    json: async () => payload,
  });

  it('searchDiscogs posts query to the proxy', async () => {
    global.fetch.mockResolvedValue(
      okResponse({ results: [{ id: 1 }], pagination: { page: 1, pages: 2, items: 51 } })
    );

    const result = await searchDiscogs({ query: 'nirvana', page: 1, perPage: 50 });

    expect(result.results).toHaveLength(1);
    expect(result.pagination.pages).toBe(2);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/discogs-proxy');
    const body = JSON.parse(opts.body);
    expect(body.endpoint).toBe('/database/search');
    expect(body.params.q).toBe('nirvana');
    expect(body.params.type).toBe('release');
  });

  it('searchDiscogs builds advanced params', async () => {
    global.fetch.mockResolvedValue(okResponse({ results: [], pagination: {} }));

    await searchDiscogs({
      isAdvanced: true,
      advancedSearch: { artist: 'Miles Davis', year: '1959' },
    });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.params.artist).toBe('Miles Davis');
    expect(body.params.year).toBe('1959');
    expect(body.params.q).toBeUndefined();
  });

  it('searchDiscogs rejects empty input', async () => {
    await expect(searchDiscogs({ query: '   ' })).rejects.toThrow('Suchbegriff');
    await expect(
      searchDiscogs({ isAdvanced: true, advancedSearch: {} })
    ).rejects.toThrow();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('throws RateLimitError on 429', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Rate limit exceeded', retryAfter: 30 }),
    });
    await expect(searchDiscogs({ query: 'x' })).rejects.toBeInstanceOf(RateLimitError);
  });

  it('throws ApiError with server details on other errors', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server configuration error', details: 'DISCOGS_TOKEN not configured on server' }),
    });
    await expect(searchDiscogs({ query: 'x' })).rejects.toBeInstanceOf(ApiError);
  });

  it('throws NetworkError when fetch itself fails', async () => {
    global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(searchDiscogs({ query: 'x' })).rejects.toBeInstanceOf(NetworkError);
  });

  it('fetchPriceInfo returns null when no offers', async () => {
    global.fetch.mockResolvedValue(okResponse({ lowest_price: null, num_for_sale: 0 }));
    expect(await fetchPriceInfo(123)).toBeNull();
  });

  it('fetchPriceInfo maps price data', async () => {
    global.fetch.mockResolvedValue(
      okResponse({ lowest_price: { value: 25.5, currency: 'EUR' }, num_for_sale: 4 })
    );
    const price = await fetchPriceInfo(123);
    expect(price.value).toBe(25.5);
    expect(price.currency).toBe('EUR');
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.endpoint).toBe('/marketplace/stats/123');
  });

  it('fetchPriceInfo returns null on 404 instead of throwing', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Discogs API request failed', status: 404 }),
    });
    expect(await fetchPriceInfo(123)).toBeNull();
  });

  it('fetchVinylDetails requests the release endpoint', async () => {
    global.fetch.mockResolvedValue(okResponse({ id: 42, title: 'Kind of Blue' }));
    const details = await fetchVinylDetails(42);
    expect(details.title).toBe('Kind of Blue');
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.endpoint).toBe('/releases/42');
  });
});
```

- [ ] **Step 2: Tests laufen lassen — müssen fehlschlagen**

Run: `npx vitest run src/services/discogsService.test.js`
Expected: FAIL (alte Implementierung erwartet `token`, ruft api.discogs.com direkt)

- [ ] **Step 3: Service komplett ersetzen**

```javascript
// src/services/discogsService.js
/**
 * Discogs Service — dünner Client für api/discogs-proxy.js.
 * Kein Token im Client; Auth passiert server-seitig.
 */

import { NetworkError, RateLimitError, ApiError } from '../utils/errors';

const PROXY_URL = '/api/discogs-proxy';
const RATE_LIMIT_DELAY = 1100; // Discogs erlaubt 60 Requests/min

async function proxyRequest(endpoint, params = {}) {
  let response;
  try {
    response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint, params }),
    });
  } catch (error) {
    throw new NetworkError('Keine Verbindung zum Server. Bitte Internetverbindung prüfen.');
  }

  if (response.ok) {
    return response.json();
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 429) {
    throw new RateLimitError(data.retryAfter ?? 60);
  }
  throw new ApiError(
    data.error || `Anfrage fehlgeschlagen (HTTP ${response.status})`,
    response.status,
    data.details
  );
}

export const searchDiscogs = async ({
  isAdvanced = false,
  query = '',
  advancedSearch = {},
  page = 1,
  perPage = 50,
}) => {
  const params = { type: 'release', per_page: String(perPage), page: String(page) };

  if (isAdvanced) {
    if (advancedSearch.artist) params.artist = advancedSearch.artist;
    if (advancedSearch.album) params.release_title = advancedSearch.album;
    if (advancedSearch.year) params.year = advancedSearch.year;
    if (advancedSearch.label) params.label = advancedSearch.label;
    if (advancedSearch.genre) params.genre = advancedSearch.genre;

    const hasField = ['artist', 'release_title', 'year', 'label', 'genre']
      .some((key) => params[key]);
    if (!hasField) {
      throw new ApiError('Bitte mindestens ein Suchfeld ausfüllen', 400);
    }
  } else {
    if (!query.trim()) {
      throw new ApiError('Suchbegriff erforderlich', 400);
    }
    params.q = query;
  }

  const data = await proxyRequest('/database/search', params);
  return {
    results: data.results || [],
    pagination: {
      page: data.pagination?.page || page,
      pages: data.pagination?.pages || 1,
      items: data.pagination?.items || 0,
    },
  };
};

export const fetchPriceInfo = async (releaseId) => {
  try {
    const data = await proxyRequest(`/marketplace/stats/${releaseId}`);
    if (data.lowest_price && data.num_for_sale > 0) {
      return {
        value: data.lowest_price.value,
        currency: data.lowest_price.currency,
        num_for_sale: data.num_for_sale,
        stats: data,
      };
    }
    return null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null; // Release ohne Marketplace-Daten
    }
    throw error;
  }
};

export const fetchVinylDetails = async (id) => {
  return proxyRequest(`/releases/${id}`);
};

export const waitForRateLimit = () => {
  return new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
};

export const fetchMultiplePrices = async (items, onProgress = null, batchSize = 3) => {
  const allPrices = {};
  let batchPrices = {};
  const itemsToFetch = items.slice(0, Math.min(items.length, 50));

  for (let i = 0; i < itemsToFetch.length; i++) {
    const item = itemsToFetch[i];
    try {
      const priceData = await fetchPriceInfo(item.id);
      if (priceData) {
        batchPrices[item.id] = priceData;
        allPrices[item.id] = priceData;
        if (onProgress && ((i + 1) % batchSize === 0 || i === itemsToFetch.length - 1)) {
          onProgress(i + 1, itemsToFetch.length, { ...batchPrices });
          batchPrices = {};
        }
      }
    } catch (error) {
      console.error(`Preisabruf fehlgeschlagen für ${item.id}:`, error);
    }
    await waitForRateLimit();
  }

  return allPrices;
};
```

- [ ] **Step 4: Tests laufen lassen — alle grün**

Run: `npx vitest run src/services/discogsService.test.js`
Expected: PASS (10 Tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/discogsService.js src/services/discogsService.test.js
git commit -m "feat: route all discogs calls through server proxy, typed errors"
```

---

### Task 5: Discogs-Token aus Hooks und UI entfernen

**Files:**
- Modify: `src/hooks/useDiscogsSearch.js`
- Modify: `src/hooks/useDiscogsSearch.test.js` (komplett ersetzen)
- Modify: `src/App.jsx:89` und `src/App.jsx:570-577`
- Modify: `src/components/DetailModal/EnhancedDetailModal.jsx:30,52-71,870`

**Interfaces:**
- Consumes: `discogsService`-Signaturen aus Task 4.
- Produces: `useDiscogsSearch()` (ohne Parameter) mit unveränderter Rückgabe (`isLoading`, `resultPrices`, `refreshingPrices`, `priceChanges`, `performSearch`, `fetchAllPrices`, `refreshPrice`, `fetchDetails`, Setter). `EnhancedDetailModal` ohne `discogsToken`-Prop.

- [ ] **Step 1: useDiscogsSearch anpassen**

In `src/hooks/useDiscogsSearch.js`:
1. Signatur: `export const useDiscogsSearch = () => {` (Parameter `discogsToken` entfernen).
2. In `performSearch`: den Block `if (!discogsToken) { onError?.(...); return null; }` löschen; im `searchDiscogs`-Aufruf die Zeile `token: discogsToken,` löschen; Fehlertext im catch ändern zu `onError?.(err.message || 'Suche fehlgeschlagen.');`
3. In `fetchAllPrices`: `fetchPriceInfo(result.id, discogsToken)` → `fetchPriceInfo(result.id)`.
4. In `refreshPrice`: den Block `if (!discogsToken) { throw ... }` löschen; `fetchPriceInfo(itemId, discogsToken)` → `fetchPriceInfo(itemId)`.
5. In `fetchDetails`: `if (!discogsToken) return null;` löschen; `fetchVinylDetails(id, discogsToken)` → `fetchVinylDetails(id)`.
6. Alle `[discogsToken]`/`[discogsToken, resultPrices]`-Dependency-Arrays: `discogsToken` entfernen (`[]` bzw. `[resultPrices]`).

- [ ] **Step 2: useDiscogsSearch.test.js komplett ersetzen**

```javascript
// src/hooks/useDiscogsSearch.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDiscogsSearch } from './useDiscogsSearch';
import * as DiscogsService from '../services/discogsService';

vi.mock('../services/discogsService', () => ({
  searchDiscogs: vi.fn(),
  fetchPriceInfo: vi.fn(),
  fetchVinylDetails: vi.fn(),
  waitForRateLimit: vi.fn().mockResolvedValue(undefined),
}));

describe('useDiscogsSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('performSearch calls service without token and reports success', async () => {
    DiscogsService.searchDiscogs.mockResolvedValue({
      results: [{ id: 1 }],
      pagination: { page: 1, pages: 1, items: 1 },
    });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useDiscogsSearch());

    await act(async () => {
      await result.current.performSearch({ query: 'nirvana', onSuccess });
    });

    expect(DiscogsService.searchDiscogs).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'nirvana' })
    );
    expect(DiscogsService.searchDiscogs.mock.calls[0][0]).not.toHaveProperty('token');
    expect(onSuccess).toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('performSearch reports service error message via onError', async () => {
    DiscogsService.searchDiscogs.mockRejectedValue(new Error('Rate limit erreicht. Bitte in 30 Sekunden erneut versuchen.'));
    const onError = vi.fn();
    const { result } = renderHook(() => useDiscogsSearch());

    await act(async () => {
      await result.current.performSearch({ query: 'x', onError });
    });

    expect(onError).toHaveBeenCalledWith(expect.stringContaining('Rate limit'));
  });

  it('refreshPrice updates resultPrices', async () => {
    DiscogsService.fetchPriceInfo.mockResolvedValue({ value: 20, currency: 'EUR' });
    const { result } = renderHook(() => useDiscogsSearch());

    await act(async () => {
      await result.current.refreshPrice(7);
    });

    expect(result.current.resultPrices[7].value).toBe(20);
    expect(result.current.refreshingPrices[7]).toBe(false);
  });

  it('fetchDetails returns null on service error', async () => {
    DiscogsService.fetchVinylDetails.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useDiscogsSearch());

    let details;
    await act(async () => {
      details = await result.current.fetchDetails(5);
    });
    expect(details).toBeNull();
  });
});
```

- [ ] **Step 3: Tests laufen lassen**

Run: `npx vitest run src/hooks/useDiscogsSearch.test.js`
Expected: PASS (4 Tests)

- [ ] **Step 4: App.jsx anpassen**

Zeile 89: `const discogsApi = useDiscogsSearch(settings.discogsToken);` → `const discogsApi = useDiscogsSearch();`

Im `<EnhancedDetailModal .../>`-Aufruf (Zeile ~569–577): die Zeile `discogsToken={settings.discogsToken}` löschen.

- [ ] **Step 5: EnhancedDetailModal anpassen**

In `src/components/DetailModal/EnhancedDetailModal.jsx`:
1. Prop `discogsToken,` aus der Destrukturierung (Zeile ~30) löschen.
2. Guard Zeile ~52: `if (!selectedResult || !discogsToken) return;` → `if (!selectedResult) return;`
3. Aufrufe: `fetchVinylDetails(selectedResult.id, discogsToken)` → `fetchVinylDetails(selectedResult.id)`; `fetchPriceInfo(selectedResult.id, discogsToken)` → `fetchPriceInfo(selectedResult.id)`.
4. Dependency-Array Zeile ~71: `[selectedResult, discogsToken]` → `[selectedResult]`.
5. PropTypes Zeile ~870: `discogsToken: PropTypes.string.isRequired,` löschen.

- [ ] **Step 6: Alle Tests + Build**

Run: `npx vitest run && npm run build`
Expected: keine NEUEN Fehler gegenüber Baseline aus Task 1; Build grün. (`src/views/SearchView/SearchView.test.jsx` prüfen: falls er `discogsToken` mockt, Mock entsprechend entfernen.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: remove client-side discogs token from hooks and UI"
```

---

### Task 6: Kamera-Kette reparieren (api/analyze.js + Client)

**Files:**
- Modify: `package.json` (SDK-Update)
- Modify: `api/analyze.js` (komplett ersetzen)
- Modify: `src/utils/cameraHelpers.js:77-130`
- Modify: `src/App.jsx:255-284,383-394`
- Test: `api/__tests__/analyze.test.js`

**Interfaces:**
- Consumes: `process.env.ANTHROPIC_API_KEY`
- Produces: `POST /api/analyze` mit Body `{image: <base64 string>}` → 200 `{artist: string, album: string}`; 400/413 bei ungültigem Bild; 500 `{error, details}`. Client: `captureAndAnalyzeVinyl(videoRef, canvasRef) → Promise<{artist, album}>` (kein apiKey-Parameter mehr).

- [ ] **Step 1: SDK aktualisieren**

```bash
npm install @anthropic-ai/sdk@latest
```

Expected: Version ≥ 0.70 in package.json (Minimum für `output_config`).

- [ ] **Step 2: Failing Tests schreiben**

```javascript
// api/__tests__/analyze.test.js
// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const createMock = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class Anthropic {
    constructor() {
      this.messages = { create: createMock };
    }
  },
}));

import handler from '../analyze.js';

function createRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    end() { return this; },
  };
}

describe('analyze handler', () => {
  beforeEach(() => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    createMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects non-POST', async () => {
    const res = createRes();
    await handler({ method: 'GET' }, res);
    expect(res.statusCode).toBe(405);
  });

  it('returns 500 when ANTHROPIC_API_KEY missing', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const res = createRes();
    await handler({ method: 'POST', body: { image: 'aGVsbG8=' } }, res);
    expect(res.statusCode).toBe(500);
    expect(res.body.details).toContain('ANTHROPIC_API_KEY');
  });

  it('rejects missing image', async () => {
    const res = createRes();
    await handler({ method: 'POST', body: {} }, res);
    expect(res.statusCode).toBe(400);
  });

  it('rejects oversized image', async () => {
    const res = createRes();
    await handler({ method: 'POST', body: { image: 'A'.repeat(6 * 1024 * 1024) } }, res);
    expect(res.statusCode).toBe(413);
  });

  it('returns parsed artist/album from structured output', async () => {
    createMock.mockResolvedValue({
      content: [{ type: 'text', text: '{"artist":"Nirvana","album":"Nevermind"}' }],
    });
    const res = createRes();
    await handler({ method: 'POST', body: { image: 'aGVsbG8=' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ artist: 'Nirvana', album: 'Nevermind' });
    const params = createMock.mock.calls[0][0];
    expect(params.model).toBe('claude-opus-4-8');
    expect(params.output_config.format.type).toBe('json_schema');
  });

  it('maps SDK errors to their status', async () => {
    const err = new Error('overloaded');
    err.status = 529;
    createMock.mockRejectedValue(err);
    const res = createRes();
    await handler({ method: 'POST', body: { image: 'aGVsbG8=' } }, res);
    expect(res.statusCode).toBe(529);
  });
});
```

- [ ] **Step 3: Tests laufen lassen — müssen fehlschlagen**

Run: `npx vitest run api/__tests__/analyze.test.js`
Expected: FAIL (alter Handler verlangt `apiKey` im Body, kein `output_config`)

- [ ] **Step 4: analyze.js komplett ersetzen**

```javascript
// api/analyze.js
import Anthropic from '@anthropic-ai/sdk';

const MAX_IMAGE_CHARS = 5 * 1024 * 1024; // ~3,7 MB Bilddaten als base64

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not configured');
    return res.status(500).json({
      error: 'Server configuration error',
      details: 'ANTHROPIC_API_KEY not configured on server',
    });
  }

  const { image } = req.body || {};
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'No image provided' });
  }
  if (image.length > MAX_IMAGE_CHARS) {
    return res.status(413).json({ error: 'Image too large' });
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 256,
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              artist: { type: 'string' },
              album: { type: 'string' },
            },
            required: ['artist', 'album'],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: image },
            },
            {
              type: 'text',
              text: 'Identify this vinyl record cover. Return the artist name and album name. If a field cannot be identified clearly, use "Unknown" for it.',
            },
          ],
        },
      ],
    });

    const text = message.content.find((b) => b.type === 'text')?.text ?? '{}';
    const vinylData = JSON.parse(text);
    return res.status(200).json(vinylData);
  } catch (error) {
    console.error('Analyze error:', error);
    const status = typeof error?.status === 'number' ? error.status : 500;
    return res.status(status).json({
      error: 'Vinyl analysis failed',
      details: error.message,
    });
  }
}
```

- [ ] **Step 5: Tests laufen lassen — alle grün**

Run: `npx vitest run api/__tests__/analyze.test.js`
Expected: PASS (6 Tests)

- [ ] **Step 6: cameraHelpers anpassen**

In `src/utils/cameraHelpers.js` die Funktionen `analyzeVinylCover` und `captureAndAnalyzeVinyl` ersetzen:

```javascript
/**
 * Analyze vinyl cover image via server-side API (key stays on server)
 *
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<{artist: string, album: string}>}
 */
export const analyzeVinylCover = async (base64Image) => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
  }

  const data = await response.json();

  if ((!data.artist || data.artist === 'Unknown') && (!data.album || data.album === 'Unknown')) {
    throw new Error('Album nicht erkannt. Bitte mit besserem Licht erneut versuchen.');
  }

  return { artist: data.artist, album: data.album };
};

export const captureAndAnalyzeVinyl = async (videoElement, canvasElement) => {
  const base64Image = captureImageFromVideo(videoElement, canvasElement, 0.8);
  return analyzeVinylCover(base64Image);
};
```

- [ ] **Step 7: App.jsx Kamera-Fluss fixen (der eigentliche `searchTerms`-Bug)**

`captureAndAnalyze` (Zeile ~256–284) ersetzen durch:

```javascript
  const captureAndAnalyze = async () => {
    camera.setIsAnalyzing(true);
    try {
      const result = await captureAndAnalyzeVinyl(camera.videoRef, camera.canvasRef);

      const parts = [result.artist, result.album].filter((p) => p && p !== 'Unknown');
      if (parts.length > 0) {
        const query = parts.join(' ');
        search.setSearchQuery(query);
        await searchDiscogs(false, query, 1);
        handleViewChange('search');
      } else {
        ui.showToast('Vinyl nicht erkannt. Bitte erneut versuchen.', 'error');
      }
    } catch (error) {
      console.error('Camera analysis failed:', error);
      ui.showToast(error.message || 'Analyse fehlgeschlagen', 'error');
    } finally {
      camera.setIsAnalyzing(false);
    }
  };
```

In `renderCameraView` (Zeile ~383–394) den Anthropic-Token-Check löschen:

```javascript
  const renderCameraView = () => {
    const handleCapture = () => {
      if (!camera.isCameraActive) {
        ui.showToast('Kamera ist nicht aktiv. Bitte Kamerazugriff erlauben.', 'error');
        return;
      }
      captureAndAnalyze();
    };
    // ... Rest unverändert
```

- [ ] **Step 8: Alle Tests + Build**

Run: `npx vitest run && npm run build`
Expected: keine neuen Fehler gegenüber Baseline; Build grün.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "fix: camera recognition chain - server-side key, structured output, searchTerms bug"
```

---

### Task 7: Token-Verwaltung vollständig entfernen

**Files:**
- Delete: `src/services/secureStorage.js`, `src/hooks/useSettings.js`, `src/utils/storage.js`
- Modify: `src/services/storageService.js` (Token-Funktionen raus)
- Modify: `src/stores/settingsStore.js` (Tokens raus + Legacy-Cleanup)
- Modify: `src/views/SettingsView/SettingsView.jsx` (Token-Felder raus)
- Modify: `src/App.jsx` (migrateExistingTokens + Token-Props raus)
- Modify: `src/schemas/vinylSchemas.js:65-67` (SettingsSchema)

**Interfaces:**
- Consumes: nichts Neues.
- Produces: `useSettingsStore` OHNE `discogsToken`/`anthropicToken`/`showDiscogsToken`/`showAnthropicToken` und deren Setter. `SettingsView` OHNE die 8 Token-Props.

- [ ] **Step 1: settingsStore ersetzen**

`src/stores/settingsStore.js` — Änderungen:
1. State-Felder `discogsToken`, `anthropicToken`, `showDiscogsToken`, `showAnthropicToken` löschen.
2. Actions `setDiscogsToken`, `setAnthropicToken`, `setShowDiscogsToken`, `setShowAnthropicToken` löschen.
3. `partialize`: `discogsToken`/`anthropicToken`-Zeilen löschen.
4. Persist-Optionen um Migration ergänzen und vor der Store-Erzeugung Legacy-Keys räumen:

```javascript
// Direkt nach den Imports, vor create():
const cleanupLegacyTokenKeys = () => {
  try {
    ['discogsToken', 'anthropicApiKey', 'anthropicToken'].forEach((k) =>
      localStorage.removeItem(k)
    );
    Object.keys(localStorage)
      .filter((k) => k.startsWith('sec_'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* localStorage nicht verfügbar (SSR/Test) */
  }
};
cleanupLegacyTokenKeys();
```

```javascript
// Persist-Optionen (zweites Argument von persist()):
      {
        name: 'vinyl-settings-storage',
        version: 1,
        migrate: (persistedState) => {
          if (!persistedState) return persistedState;
          const { discogsToken, anthropicToken, ...rest } = persistedState;
          return rest;
        },
        partialize: (state) => ({
          theme: state.theme,
          customColors: state.customColors,
          selectedShops: state.selectedShops,
        }),
      }
```

- [ ] **Step 2: SettingsView entschlacken**

In `src/views/SettingsView/SettingsView.jsx`:
1. Props löschen: `discogsToken`, `onDiscogsTokenChange`, `showDiscogsToken`, `onToggleShowDiscogsToken`, `anthropicToken`, `onAnthropicTokenChange`, `showAnthropicToken`, `onToggleShowAnthropicToken` (Zeilen 21–29).
2. Die beiden JSX-Blöcke `{/* Discogs Token */}` (Zeilen ~90–145) und `{/* Anthropic Token */}` (Zeilen ~147–202) komplett löschen.
3. Import `Eye, EyeOff` aus `lucide-react` löschen, falls nirgends sonst in der Datei genutzt (per Suche prüfen).

- [ ] **Step 3: App.jsx bereinigen**

1. Zeile 19 löschen: `import { migrateExistingTokens } from './services/secureStorage';`
2. Den kompletten `useEffect` mit `migrateExistingTokens()` (Zeilen ~46–54) löschen.
3. In `renderSettingsView` (Zeilen ~479–502) die 8 Token-Props löschen:
   `discogsToken`, `onDiscogsTokenChange`, `showDiscogsToken`, `onToggleShowDiscogsToken`, `anthropicToken`, `onAnthropicTokenChange`, `showAnthropicToken`, `onToggleShowAnthropicToken`.

- [ ] **Step 4: storageService bereinigen**

In `src/services/storageService.js`:
1. Zeile 10 löschen: `import { SecureStorage } from './secureStorage';`
2. Aus `STORAGE_KEYS`: `DISCOGS_TOKEN`- und `ANTHROPIC_TOKEN`-Einträge löschen.
3. Funktionen komplett löschen: `saveDiscogsToken`, `loadDiscogsToken`, `saveAnthropicToken`, `loadAnthropicToken`, `needsV1Migration`, `migrateFromV1`.

- [ ] **Step 5: Dateien löschen + Schema anpassen**

```bash
git rm src/services/secureStorage.js src/hooks/useSettings.js src/utils/storage.js
```

(`useSettings.js` und `utils/storage.js` werden nirgends importiert — vorher verifizieren: `grep -rn "hooks/useSettings\|utils/storage" src/` muss leer sein. `utils/storage.js` ist das tote Duplikat von `storageService.js` aus Spec 2.4.)

In `src/schemas/vinylSchemas.js` aus `SettingsSchema` die Zeilen `discogsToken: z.string().optional(),` und `anthropicToken: z.string().optional(),` löschen.

- [ ] **Step 6: Verwaiste Referenzen finden**

```bash
grep -rn "discogsToken\|anthropicToken\|SecureStorage\|secureStorage\|migrateExistingTokens" src/ api/ --include="*.js" --include="*.jsx" | grep -v ".test."
```

Expected: keine Treffer mehr (außer ggf. Kommentare — auch löschen). Testdateien mit Treffern anpassen (Mocks entfernen).

- [ ] **Step 7: Alle Tests + Build**

Run: `npx vitest run && npm run build`
Expected: keine neuen Fehler gegenüber Baseline; Build grün.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: remove all client-side API token handling"
```

---

### Task 8: Storage-Härtung für die Sammlung (Backup + Validierung + Quota)

**Files:**
- Create: `src/services/collectionStorage.js`
- Test: `src/services/collectionStorage.test.js`
- Modify: `src/stores/collectionStore.js` (Storage-Adapter einhängen)

**Interfaces:**
- Consumes: nichts aus anderen Tasks.
- Produces: `backupStorage` (Objekt mit `getItem(name)`, `setItem(name, value)`, `removeItem(name)`) — kompatibel zu zustand `createJSONStorage`. Backup-Keys: `vinyl-collection-backup-1..3`.

- [ ] **Step 1: Failing Tests schreiben**

```javascript
// src/services/collectionStorage.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { backupStorage, BACKUP_PREFIX, MAX_BACKUPS } from './collectionStorage';

const KEY = 'vinyl-collection-storage';
const validState = (n) =>
  JSON.stringify({ state: { collection: [{ id: n, title: `Album ${n}` }] }, version: 0 });

describe('backupStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('setItem writes value and rotates previous value into backup-1', () => {
    backupStorage.setItem(KEY, validState(1));
    backupStorage.setItem(KEY, validState(2));

    expect(backupStorage.getItem(KEY)).toBe(validState(2));
    expect(localStorage.getItem(`${BACKUP_PREFIX}1`)).toBe(validState(1));
  });

  it('keeps at most MAX_BACKUPS backups', () => {
    for (let i = 1; i <= MAX_BACKUPS + 3; i++) {
      backupStorage.setItem(KEY, validState(i));
    }
    expect(localStorage.getItem(`${BACKUP_PREFIX}${MAX_BACKUPS}`)).not.toBeNull();
    expect(localStorage.getItem(`${BACKUP_PREFIX}${MAX_BACKUPS + 1}`)).toBeNull();
  });

  it('getItem falls back to newest valid backup when current value is corrupt', () => {
    backupStorage.setItem(KEY, validState(1));
    backupStorage.setItem(KEY, validState(2));
    localStorage.setItem(KEY, '{not valid json');

    expect(backupStorage.getItem(KEY)).toBe(validState(2));
  });

  it('getItem falls back when current value has wrong shape', () => {
    backupStorage.setItem(KEY, validState(1));
    backupStorage.setItem(KEY, validState(2));
    localStorage.setItem(KEY, JSON.stringify({ state: { collection: 'kaputt' } }));

    expect(backupStorage.getItem(KEY)).toBe(validState(2));
  });

  it('getItem returns null when nothing stored', () => {
    expect(backupStorage.getItem(KEY)).toBeNull();
  });
});
```

- [ ] **Step 2: Tests laufen lassen — müssen fehlschlagen**

Run: `npx vitest run src/services/collectionStorage.test.js`
Expected: FAIL ("Failed to resolve import ./collectionStorage")

- [ ] **Step 3: Implementierung**

```javascript
// src/services/collectionStorage.js
/**
 * Storage-Adapter für den Collection-Store:
 * - rollierende Backups (letzte MAX_BACKUPS Stände)
 * - Struktur-Validierung beim Laden mit Fallback auf Backups
 * - QuotaExceeded-Handling
 *
 * Bewusst NUR Struktur-Validierung (kein striktes Item-Schema):
 * ein einzelnes ungewöhnliches Feld darf nie zum Verlust der
 * ganzen Sammlung führen.
 */
import { z } from 'zod';

export const BACKUP_PREFIX = 'vinyl-collection-backup-';
export const MAX_BACKUPS = 3;

const PersistedShape = z.object({
  state: z.object({ collection: z.array(z.unknown()) }).passthrough(),
}).passthrough();

function isValidPersistedValue(raw) {
  try {
    return PersistedShape.safeParse(JSON.parse(raw)).success;
  } catch {
    return false;
  }
}

function rotateBackups(previousValue) {
  try {
    for (let i = MAX_BACKUPS - 1; i >= 1; i--) {
      const older = localStorage.getItem(`${BACKUP_PREFIX}${i}`);
      if (older !== null) {
        localStorage.setItem(`${BACKUP_PREFIX}${i + 1}`, older);
      }
    }
    if (previousValue !== null) {
      localStorage.setItem(`${BACKUP_PREFIX}1`, previousValue);
    }
    localStorage.removeItem(`${BACKUP_PREFIX}${MAX_BACKUPS + 1}`);
  } catch {
    /* Backups sind best effort — dürfen das Speichern nie verhindern */
  }
}

export const backupStorage = {
  getItem: (name) => {
    const candidates = [localStorage.getItem(name)];
    for (let i = 1; i <= MAX_BACKUPS; i++) {
      candidates.push(localStorage.getItem(`${BACKUP_PREFIX}${i}`));
    }
    for (const candidate of candidates) {
      if (candidate !== null && isValidPersistedValue(candidate)) {
        return candidate;
      }
    }
    return null;
  },

  setItem: (name, value) => {
    rotateBackups(localStorage.getItem(name));
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      if (error && error.name === 'QuotaExceededError') {
        // Ältestes Backup opfern, dann erneut versuchen
        localStorage.removeItem(`${BACKUP_PREFIX}${MAX_BACKUPS}`);
        localStorage.setItem(name, value);
      } else {
        throw error;
      }
    }
  },

  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};
```

- [ ] **Step 4: Tests laufen lassen — alle grün**

Run: `npx vitest run src/services/collectionStorage.test.js`
Expected: PASS (5 Tests)

- [ ] **Step 5: Adapter in collectionStore einhängen**

In `src/stores/collectionStore.js`:

```javascript
// Import ergänzen:
import { createJSONStorage } from 'zustand/middleware';
import { backupStorage } from '../services/collectionStorage';
```

In den Persist-Optionen (`{ name: 'vinyl-collection-storage', partialize: ... }`) ergänzen:

```javascript
      {
        name: 'vinyl-collection-storage',
        storage: createJSONStorage(() => backupStorage),
        partialize: (state) => ({
          collection: state.collection,
          sortBy: state.sortBy,
          collectionView: state.collectionView
        })
      }
```

- [ ] **Step 6: Store-Tests + Build**

Run: `npx vitest run src/stores/__tests__/collectionStore.test.js && npm run build`
Expected: keine neuen Fehler gegenüber Baseline; Build grün.

- [ ] **Step 7: Commit**

```bash
git add src/services/collectionStorage.js src/services/collectionStorage.test.js src/stores/collectionStore.js
git commit -m "feat: rolling backups + validation + quota handling for collection storage"
```

---

### Task 9: PWA-Cache, .env.example, README

**Files:**
- Modify: `vite.config.js:50-61` (Discogs-API-Cache-Regel entfernen)
- Modify: `.env.example` (komplett ersetzen)
- Modify: `README.md` (komplett ersetzen)

**Interfaces:**
- Produces: keine Code-Schnittstellen; Doku + Konfiguration.

- [ ] **Step 1: Stale-Cache-Regel entfernen**

In `vite.config.js` im `workbox.runtimeCaching`-Array den kompletten Eintrag mit `urlPattern: /^https:\/\/api\.discogs\.com\/.*/i` löschen (Zeilen ~50–61). Begründung: Discogs läuft jetzt über POST auf `/api/discogs-proxy` (nicht cachebar); die alte NetworkFirst-Regel würde nur veraltete Antworten der Direktaufrufe servieren. Der `i.discogs.com`-Bilder-Cache bleibt.

- [ ] **Step 2: .env.example ersetzen**

```bash
# .env.example — Kopie als .env.local anlegen und Werte eintragen.
# .env.local wird NIE committet.

# Discogs Personal Access Token (https://www.discogs.com/settings/developers)
DISCOGS_TOKEN=

# Anthropic API Key (https://platform.claude.com/) — für Kamera-Erkennung
ANTHROPIC_API_KEY=
```

- [ ] **Step 3: README ersetzen**

```markdown
# VinylScout

Vinyl-Sammlung verwalten: Discogs-Suche mit Marktpreisen, KI-Cover-Erkennung
per Kamera, Sammlungs-Statistiken. React-PWA, deployt auf Vercel.

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
```

- [ ] **Step 4: Build prüfen**

Run: `npm run build`
Expected: grün.

- [ ] **Step 5: Commit**

```bash
git add vite.config.js .env.example README.md
git commit -m "chore: drop stale discogs SW cache rule, document server-side env setup"
```

---

### Task 10: Endabnahme, Deployment-Vorbereitung, Merge

**Files:**
- Keine Code-Änderungen (nur Verifikation und Git).

**Interfaces:**
- Consumes: alles aus Task 1–9.

- [ ] **Step 1: Kompletter Testlauf + Lint + Build**

```bash
npx vitest run
npm run lint
npm run build
```

Expected: keine neuen Test-Fehler gegenüber der Task-1-Baseline; Lint ohne neue Fehler; Build grün.

- [ ] **Step 2: Nutzer-Aktionen einholen (blockierend)**

Der Nutzer muss:
1. Im Vercel-Dashboard (Project → Settings → Environment Variables) `DISCOGS_TOKEN` und `ANTHROPIC_API_KEY` für Production + Preview + Development anlegen.
2. Lokal: `cp .env.example .env.local` und beide Werte eintragen (Datei-Inhalt niemals in den Chat/Logs zeigen).
3. `vercel login` + `vercel link` ausführen, falls noch nicht geschehen.

- [ ] **Step 3: Lokaler Smoke-Test mit `vercel dev`**

```bash
vercel dev
```

Checkliste (im Browser):
- Suche "Nirvana Nevermind" liefert Ergebnisse; Preise erscheinen nach und nach.
- Detail-Modal öffnet mit Details + Preis.
- Kamera-View: Foto eines Album-Covers → landet in der Suche mit erkanntem Artist/Album.
- Platte zur Sammlung hinzufügen → Seite neu laden → Platte noch da.
- Settings: keine Token-Felder mehr sichtbar; Theme-Wechsel funktioniert.
- Export → Datei löschen aus Sammlung → Import → Platte wieder da.
- DevTools → Application → localStorage: `vinyl-collection-backup-1` existiert nach einer Änderung; keine `sec_*`-Keys mehr.

- [ ] **Step 4: Merge und Push (nur nach Nutzer-Freigabe)**

```bash
git checkout master
git merge --no-ff overhaul/phase-1 -m "feat: phase 1 - stabilize core (proxy, camera, storage, server-side keys)"
git push origin master
```

- [ ] **Step 5: Production-Smoke-Test**

Nach Vercel-Deployment dieselbe Checkliste aus Step 3 auf der Production-URL durchgehen. WICHTIG: Beim ersten Öffnen prüfen, dass die bestehende Sammlung noch vollständig da ist (Migration ist rein additiv — Collection-Key wird nicht umbenannt).

- [ ] **Step 6: Abschluss dokumentieren**

`CHANGELOG.md` um Eintrag `## 3.0.0` ergänzen (Stichpunkte: Discogs über Server-Proxy, Kamera-Erkennung repariert, API-Keys server-seitig, Storage-Backups). Commit + Push.
