import Anthropic from "@anthropic-ai/sdk";

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Get API key from Vercel environment variable
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const base64Data = image.split(',')[1];
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64Data
            }
          },
          {
            type: 'text',
            text: 'Analyze this vinyl record cover. Provide ONLY a JSON response with: {"artist": "artist name", "album": "album name"}. If you cannot identify it clearly, use "Unknown" for that field.'
          }
        ]
      }]
    });

    let responseText = message.content[0].text;
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const vinylData = JSON.parse(responseText);
    
    return res.status(200).json(vinylData);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}