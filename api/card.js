// api/card.js - Proxy YGOPRODeck + CardMarket Prices (Edge Runtime)
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const url = new URL(req.url);
  const query = url.searchParams.get('q');

  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing search query' }), { status: 400 });
  }

  try {
    // YGOPRODeck API con prezzi CardMarket inclusi
    const apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(query)}&misc=cardmarket_prices`;
    
    const response = await fetch(apiUrl);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Not found', details: 'Carta non trovata. Prova il nome in INGLESE.' }), { status: 404 });
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      return new Response(JSON.stringify({ error: 'Not found', details: 'Nessun risultato. Usa il nome inglese (es. Blue-Eyes White Dragon)' }), { status: 404 });
    }

    // Prendiamo la carta più rilevante (prima della lista)
    const card = data.data[0];
    const prices = card.cardmarket_prices || {};
    
    // Prezzo medio di vendita in EUR (il più affidabile per l'Italia)
    const price = prices.average_sell_price || prices.trend_price || prices.lowest_price || 0;

    return new Response(JSON.stringify({
      id: card.id.toString(),
      name: card.name,
      image: card.card_images?.[0]?.image_url || '',
      type: card.type || 'N/A',
      race: card.race || 'N/A',
      atk: card.atk ?? '-',
      def: card.def ?? '-',
      level: card.level ?? card.linkval ?? '-',
      rarity: card.rarity || 'N/A',
      set: card.card_sets?.[0]?.set_name || 'N/A',
      price: parseFloat(price).toFixed(2),
      currency: 'EUR',
      link: `https://www.cardmarket.com/en/YuGiOh/Products/Search?searchString=${encodeURIComponent(card.name)}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), { status: 500 });
  }
}