const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обрабатываем OPTIONS запрос для CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { artist, track } = req.query;

  if (!artist || !track) {
    return res.status(400).json({ error: 'Missing artist or track parameter' });
  }

    try {
    // 1. Сначала пробуем строгий поиск
    let searchUrl = `https://api.deezer.com/search?q=artist:"${encodeURIComponent(artist)}" track:"${encodeURIComponent(track)}"&limit=1`;
    let response = await fetch(searchUrl);
    let data = await response.json();
    let trackInfo = null;

    if (data.data && data.data.length > 0 && data.data[0].preview) {
        trackInfo = data.data[0];
    } else {
        // 2. Если не нашли, пробуем мягкий поиск
        const looseUrl = `https://api.deezer.com/search?q=${encodeURIComponent(artist + " " + track)}&limit=3`;
        response = await fetch(looseUrl);
        data = await response.json();
        
        // Ищем трек, где имя артиста хотя бы частично совпадает (чтобы избежать рандомных каверов)
        if (data.data && data.data.length > 0) {
            const artistLower = artist.toLowerCase();
            trackInfo = data.data.find(t => t.artist.name.toLowerCase().includes(artistLower) && t.preview);
            
            // Если всё равно нет точного совпадения по автору, берем первый попавшийся, 
            // ТОЛЬКО если название автора и трека достаточно похожи (защита от мусора)
            if (!trackInfo && data.data[0].preview) {
                 // В крайнем случае ничего не выдаем, чтобы не было "левых" треков
                 trackInfo = null;
            }
        }
    }
    
    if (trackInfo && trackInfo.preview) {
      console.log('Found track:', trackInfo.title, 'by', trackInfo.artist.name);
      res.json({
        success: true,
        preview: trackInfo.preview,
        title: trackInfo.title,
        artist: trackInfo.artist.name,
        duration: trackInfo.duration,
        album: trackInfo.album?.title || 'Unknown Album',
        cover: trackInfo.album?.cover_medium || trackInfo.album?.cover || null
      });
    } else {
      console.log('Track not found on Deezer');
      res.json({
        success: false,
        message: 'Track not found on Deezer or artist mismatch'
      });
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
