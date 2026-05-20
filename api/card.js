// api/card.js - Versione SUPER SEMPLICE
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const url = new URL(req.url);
  const query = url.searchParams.get('q');
  const id = url.searchParams.get('id');

  // Se manca sia q che id, errore
  if (!query && !id) {
    return new Response(JSON.stringify({ error: 'Missing search query' }), { status: 400 });
  }

  try {
    // Costruiamo l'URL per YGOPRODeck
    let apiUrl;
    if (id) {
      // Ricerca per ID (precisa al 100%)
      apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${id}&misc=cardmarket_prices`;
    } else {
      // Ricerca per nome
      apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(query)}&misc=cardmarket_prices`;
    }

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Not found', details: 'Card not found in database' }), { status: 404 });
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      return new Response(JSON.stringify({ error: 'Not found', details: 'No results' }), { status: 404 });
    }

    const card = data.data[0];
    const prices = card.cardmarket_prices || {};
    const price = prices.average_sell_price || prices.trend_price || prices.lowest_price || 0;

    return new Response(JSON.stringify({
      id: card.id.toString(),
      name: card.name,
      image: card.card_images?.[0]?.image_url || '',
      price: parseFloat(price).toFixed(2),
      currency: 'EUR'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error', details: error.message }), { status: 500 });
  }
}