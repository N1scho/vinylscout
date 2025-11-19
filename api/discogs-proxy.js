/**
 * Discogs API Proxy
 *
 * SECURITY: This proxy keeps API tokens server-side only.
 * Never expose tokens to the client!
 */

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { endpoint, params } = req.body;

    // Validate input
    if (!endpoint || typeof endpoint !== 'string') {
      return res.status(400).json({ error: 'Invalid endpoint' });
    }

    // Get token from environment (server-side only)
    const token = process.env.DISCOGS_TOKEN;

    if (!token) {
      console.error('DISCOGS_TOKEN not configured');
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Discogs API token not configured on server'
      });
    }

    // Build URL
    let url = `https://api.discogs.com${endpoint}`;

    // Add query parameters if provided
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }

    // Make request to Discogs API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Discogs token=${token}`,
        'User-Agent': 'VinylScout/2.5.0'
      }
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '60';
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: parseInt(retryAfter)
      });
    }

    // Handle errors
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Discogs API error:', response.status, errorData);
      return res.status(response.status).json({
        error: 'Discogs API request failed',
        status: response.status,
        details: errorData
      });
    }

    // Return successful response
    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
