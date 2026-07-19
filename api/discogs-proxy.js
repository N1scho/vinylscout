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
      const parsed = parseInt(response.headers.get('Retry-After') || '', 10);
      const retryAfter = Number.isFinite(parsed) ? parsed : 60;
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
