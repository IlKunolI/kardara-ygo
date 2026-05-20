// api/card.js - DEBUG VERSION

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Metodo 1: Prova a leggere i parametri in 3 modi diversi
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const id = req.query?.id || url.searchParams.get('id');
    const q = req.query?.q || url.searchParams.get('q');
    
    console.log('🔍 DEBUG - req.query:', req.query);
    console.log('🔍 DEBUG - url.searchParams:', Object.fromEntries(url.searchParams));
    console.log('🔍 DEBUG - extracted id:', id, 'q:', q);

    if (!id && !q) {
      return res.status(400).json({ error: 'Missing id or query' });
    }

    // Costruisci URL ESATTAMENTE come nel browser
    let apiUrl;
    if (id) {
      apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${id}`;
    } else {
      apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(q)}`;
    }
    
    console.log('🌐 Fetching URL:', apiUrl);

    // Fetch SENZA headers personalizzati (proviamo il minimo indispensabile)
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        // Solo User-Agent minimale
        'User-Agent': 'KardaraBot/1.0'
      }
    });

    console.log('📡 Response status:', response.status);
    
    const rawText = await response.text();
    console.log('📦 Raw response (first 300 chars):', rawText.substring(0, 300));

    // Prova a parsare
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error('❌ JSON parse error:', e.message);
      return res.status(500).json({ error: 'Invalid JSON from YGOPRODeck', raw: rawText.substring(0, 200) });
    }

    if (!response.ok || !data.data?.length) {
      console.log('❌ YGOPRODeck returned error or empty data');
      return res.status(404).json({ 
        error: 'Not found', 
        ygoprodeck_error: data.error,
        raw_preview: rawText.substring(0, 200)
      });
    }

    const card = data.data[0];
    console.log('✅ Success! Card:', card.name);
    
    return res.status(200).json({
      id: String(card.id),
      name: card.name,
      image: card.card_images?.[0]?.image_url,
      atk: card.atk,
      def: card.def
    });

  } catch (err) {
    console.error('💥 CATCH ERROR:', err.message, err.stack);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}