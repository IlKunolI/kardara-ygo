// api/card.js - Proxy YGOPRODeck per Vercel Node.js Runtime

export default async function handler(req, res) {
  // Abilita CORS per sicurezza
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Gestisci preflight CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo GET supportato
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, q } = req.query;
    
    if (!id && !q) {
      return res.status(400).json({ error: 'Missing id or query parameter' });
    }

    // Costruisci URL per YGOPRODeck
    let apiUrl = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?';
    if (id) {
      apiUrl += `id=${id}`;
    } else {
      apiUrl += `fname=${encodeURIComponent(q)}`;
    }

    console.log('🔍 Fetching:', apiUrl);

    // Fetch con headers completi (fondamentale per YGOPRODeck)
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
      console.log('❌ Not found:', data.error || 'No data');
      return res.status(404).json({ error: 'Not found', details: data.error || 'No cards found' });
    }

    const card = data.data[0];
    
    console.log('✅ Found:', card.name);

    // Risposta di successo con Vercel Node.js style
    return res.status(200).json({
      id: String(card.id),
      name: card.name,
      image: card.card_images?.[0]?.image_url || null,
      type: card.type,
      atk: card.atk,
      def: card.def
    });

  } catch (err) {
    console.error('❌ Server error:', err.message);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}