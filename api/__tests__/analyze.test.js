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

  it('returns parsed vinyl details from structured output', async () => {
    createMock.mockResolvedValue({
      content: [{ type: 'text', text: '{"artist":"Nirvana","album":"Nevermind","year":"1991","genre":"Grunge","labelAndCatalog":"DGC DGC-24425","format":"vinyl"}' }],
    });
    const res = createRes();
    await handler({ method: 'POST', body: { image: 'aGVsbG8=' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.artist).toBe('Nirvana');
    expect(res.body.album).toBe('Nevermind');
    const params = createMock.mock.calls[0][0];
    expect(params.model).toBe('claude-opus-4-8');
    expect(params.max_tokens).toBe(200);
    expect(params.output_config.format.type).toBe('json_schema');
    expect(params.output_config.format.schema.properties).toEqual({
      artist: { type: 'string' },
      album: { type: 'string' },
      year: { type: 'string' },
      genre: { type: 'string' },
      labelAndCatalog: { type: 'string' },
      format: { type: 'string' },
    });
    expect(params.output_config.format.schema.required).toEqual(['artist', 'album']);
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
