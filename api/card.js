// api/card.js - Proxy YGOPRODeck (Node.js Runtime)

export default async function handler(req, res) {
  // Supporta sia Edge che Node.js style
  const url = new URL(req.url, `https://${req.headers.host}`);
  const id = url.searchParams.get('id');
  const query = url.searchParams.get('q');

  if (!id && !query) {
    return new Response(JSON.stringify({ error: 'Missing id or query' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    let apiUrl = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?';
    if (id) {
      apiUrl += `id=${id}`;
    } else {
      apiUrl += `fname=${encodeURIComponent(query)}`;
    }

    // Fetch con headers completi
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      // Cache disabilitata per test
      cache: 'no-store'
    });
    
    const data = await response.json();

    if (!response.ok || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Not found', 
        details: data.error || 'No cards found' 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const card = data.data[0];
    
    return new Response(JSON.stringify({
      id: String(card.id),
      name: card.name,
      image: card.card_images?.[0]?.image_url || null,
      type: card.type,
      atk: card.atk,
      def: card.def
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', details: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}