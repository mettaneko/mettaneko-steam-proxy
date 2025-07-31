import fetch from 'node-fetch';

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_ID_64 = process.env.STEAM_ID_64;

const allowedOrigins = [
    'https://www.mettaneko.ru',
    'https://mettaneko.ru',
];

// !!! ИСПРАВЛЕНО: Функция должна быть асинхронной (async) !!!
export default async function (request, response) {
    // !!! ИСПРАВЛЕНО: Заголовки нужно получать через . или [] !!!
    const origin = request.headers.origin; // Используем request.headers.origin вместо request.headers.get('origin')

    if (allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        return response.status(200).send('OK');
    }

    if (request.method !== 'GET') {
        return response.status(405).send('Method Not Allowed');
    }

    if (!STEAM_API_KEY || !STEAM_ID_64) {
        console.error('Environment variables STEAM_API_KEY or STEAM_ID_64 are not set.');
        return response.status(500).json({ error: 'Steam API Key or Steam ID 64 not configured on server.' });
    }

    try {
        const steamApiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID_64}&format=json&include_appinfo=true&include_played_free_games=true`;

        const apiResponse = await fetch(steamApiUrl); // Теперь await будет работать, так как функция async

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error(`Steam API Error: ${apiResponse.status} - ${errorText}`);
            return response.status(apiResponse.status).json({ error: `Steam API responded with status ${apiResponse.status}`, details: errorText });
        }

        const data = await apiResponse.json();

        if (data && data.response && data.response.games && data.response.games.length > 0) {
            const sortedGames = data.response.games.sort((a, b) => b.rtime_last_played - a.rtime_last_played);
            const latestGame = sortedGames[0];

            const result = {
                response: {
                    games: [
                        {
                            appid: latestGame.appid,
                            name: latestGame.name,
                            playtime_forever: latestGame.playtime_forever,
                            rtime_last_played: latestGame.rtime_last_played,
                            img_icon_url: latestGame.img_icon_url,
                            img_logo_url: latestGame.img_logo_url,
                            img_url: `https://cdn.akamai.steamstatic.com/steam/apps/${latestGame.appid}/header.jpg`,
                        }
                    ]
                }
            };

            return response.status(200).json(result);
        } else {
            return response.status(200).json({ response: { games: [] } });
        }

    } catch (error) {
        console.error('Error fetching Steam data:', error);
        return response.status(500).json({ error: 'Failed to fetch data from Steam API.', details: error.message });
    }
}
