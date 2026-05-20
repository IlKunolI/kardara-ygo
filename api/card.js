// api/card.js - Proxy YGOPRODeck con misc=yes (corretto)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q, limit } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }

    // ✅ misc=yes è il valore corretto per includere i prezzi
    const apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(q)}&misc=yes`;

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const data = await response.json();

    if (!response.ok || !data.data?.length) {
      return res.status(404).json({ 
        error: 'Not found', 
        details: data.error || 'No cards found'
      });
    }

    const maxResults = parseInt(limit) || 50;
    const cards = data.data.slice(0, maxResults);
    
    const formattedCards = cards.map(card => {
      // Estrai il prezzo CardMarket dall'array card_prices
      const cardmarket = card.card_prices?.find(p => p.cardmarket_price);
      const price = cardmarket?.cardmarket_price || '0';
      
      return {
        id: String(card.id),
        name: card.name,
        image: card.card_images?.[0]?.image_url,
        type: card.type,
        race: card.race,
        atk: card.atk,
        def: card.def,
        level: card.level,
        price_eur: price,
        sets: card.card_sets?.map(set => ({
          set_name: set.set_name,
          set_code: set.set_code,
          set_rarity: set.set_rarity,
          set_price: set.set_price
        })) || [],
        set_code: card.card_sets?.[0]?.set_code || 'N/A',
        rarity: card.rarity
      };
    });

    return res.status(200).json({
      total: data.data.length,
      cards: formattedCards
    });

  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}