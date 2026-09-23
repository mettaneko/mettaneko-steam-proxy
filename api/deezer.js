const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { artist, track } = req.query;
  if (!artist || !track) return res.status(400).json({ error: 'Missing artist or track parameter' });

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
        
        if (data.data && data.data.length > 0) {
            const artistLower = artist.toLowerCase();
            // Защита от мусора: проверяем, что имя артиста хотя бы частично совпадает
            trackInfo = data.data.find(t => t.artist.name.toLowerCase().includes(artistLower) && t.preview);
        }
    }
    
    if (trackInfo && trackInfo.preview) {
      res.json({
        success: true,
        preview: trackInfo.preview,
        title: trackInfo.title,
        artist: trackInfo.artist.name
      });
    } else {
      res.json({ success: false, message: 'Track not found on Deezer or artist mismatch' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
