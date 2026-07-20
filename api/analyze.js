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
      max_tokens: 80,
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
