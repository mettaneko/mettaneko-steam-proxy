export default async function handler(req, res) {
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
    const searchUrl = `https://api.deezer.com/search?q=artist:"${encodeURIComponent(artist)}" track:"${encodeURIComponent(track)}"&limit=1`;
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.data && data.data.length > 0 && data.data[0].preview) {
      const trackInfo = data.data[0];
      res.json({
        success: true,
        preview: trackInfo.preview,
        title: trackInfo.title,
        artist: trackInfo.artist.name,
        duration: trackInfo.duration
      });
    } else {
      res.json({
        success: false,
        message: 'Track not found on Deezer'
      });
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
