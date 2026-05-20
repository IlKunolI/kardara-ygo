// api/card.js - Proxy con headers browser-like completi

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, q } = req.query;
    
    if (!id && !q) {
      return res.status(400).json({ error: 'Missing id or query' });
    }

    // Costruisci URL
    let apiUrl;
    if (id) {
      apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${id}`;
    } else {
      apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(q)}`;
    }

    // ✅ HEADERS COMPLETI CHE MIMANO UN BROWSER REALE
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9,it;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      // Disabilita cache di Vercel per evitare risposte stale
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.data?.length) {
      return res.status(404).json({ 
        error: 'Not found', 
        details: data.error || 'No cards found',
        status: response.status
      });
    }

    const card = data.data[0];
    
    return res.status(200).json({
      id: String(card.id),
      name: card.name,
      image: card.card_images?.[0]?.image_url,
      type: card.type,
      atk: card.atk,
      def: card.def,
      level: card.level,
      race: card.race
    });

  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}