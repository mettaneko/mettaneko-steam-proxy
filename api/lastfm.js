const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { user, api_key, limit } = req.query;

    if (!user || !api_key) {
        return res.status(400).json({ error: 'Missing user or api_key' });
    }

    try {
        const lastFmUrl = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${user}&api_key=${api_key}&format=json&limit=${limit || 1}`;
        const response = await fetch(lastFmUrl);
        
        if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({ error: `Last.fm API Error: ${errText}` });
        }
        
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Last.fm proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch from Last.fm' });
    }
};
