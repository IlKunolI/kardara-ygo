// api/card.js - Proxy MINIMO per YGOPRODeck
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const query = url.searchParams.get('q');

  if (!id && !query) {
    return new Response(JSON.stringify({ error: 'Missing id or query' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Costruiamo URL SENZA parametri extra che potrebbero rompere
    let apiUrl = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?';
    if (id) {
      apiUrl += `id=${id}`;
    } else {
      apiUrl += `fname=${encodeURIComponent(query)}`;
    }

    console.log('🔍 Fetching:', apiUrl); // Log per debug su Vercel

    const response = await fetch(apiUrl);
    const text = await response.text(); // Leggiamo come testo prima
    
    console.log('📦 Status:', response.status);
    console.log('📦 Response preview:', text.substring(0, 200));

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Not found', status: response.status }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const json = JSON.parse(text);
    
    if (!json.data || !Array.isArray(json.data) || json.data.length === 0) {
      return new Response(JSON.stringify({ error: 'No cards found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const card = json.data[0];
    
    // Restituiamo solo i campi essenziali
    return new Response(JSON.stringify({
      id: String(card.id),
      name: card.name,
      image: card.card_images?.[0]?.image_url || null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
    return new Response(JSON.stringify({ error: 'Server error', details: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}