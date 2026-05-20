// api/card.js - Proxy YGOPRODeck con User-Agent
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
    let apiUrl = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?';
    if (id) {
      apiUrl += `id=${id}`;
    } else {
      apiUrl += `fname=${encodeURIComponent(query)}`;
    }

    // ✅ AGGIUNGIAMO L'HEADER USER-AGENT (fondamentale!)
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'KardaraApp/1.0 (https://kardara.app)'
      }
    });
    
    const text = await response.text();

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
    
    return new Response(JSON.stringify({
      id: String(card.id),
      name: card.name,
      image: card.card_images?.[0]?.image_url || null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', details: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}