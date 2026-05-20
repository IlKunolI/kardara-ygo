// api/card.js - Proxy YGOPRODeck con ricerca robusta

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

    // Costruisci URL: preferiamo name= perché più affidabile
    let apiUrl;
    if (q) {
      // Ricerca per nome (funziona sempre)
      apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(q)}`;
    } else if (id) {
      // Ricerca per ID (usiamo name= come fallback se id= fallisce)
      apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${id}`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const data = await response.json();

    if (!response.ok || !data.data?.length) {
      // Se id= fallisce, proviamo con name= come fallback
      if (id && !q) {
        console.log(`🔄 ID ${id} not found, trying name search...`);
        return res.status(404).json({ 
          error: 'Not found by ID', 
          suggestion: 'Try searching by name instead',
          details: data.error 
        });
      }
      
      return res.status(404).json({ 
        error: 'Not found', 
        details: data.error || 'No cards found'
      });
    }

    const card = data.data[0];
    
    return res.status(200).json({
      id: String(card.id),
      name: card.name,
      image: card.card_images?.[0]?.image_url,
      type: card.type,
      race: card.race,
      atk: card.atk,
      def: card.def,
      level: card.level,
      // Prezzi CardMarket (se disponibili)
      price_eur: card.card_prices?.[0]?.cardmarket_price || null
    });

  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}