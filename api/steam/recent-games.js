import fetch from 'node-fetch'; // Убедитесь, что node-fetch установлен (в package.json)

// Steam API Key и Steam ID 64 теперь берутся из переменных окружения Vercel
const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_ID_64 = process.env.STEAM_ID_64;

// Разрешенные домены для CORS
const allowedOrigins = [
    'https://www.mettaneko.ru',
    'https://mettaneko.ru',
    // Добавьте другие домены, если ваш сайт доступен по другим URL
];

export default async function (request, response) {
    // Установка CORS заголовков
    const origin = request.headers.get('origin');
    if (allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    // Обработка предварительных запросов OPTIONS (для CORS)
    if (request.method === 'OPTIONS') {
        return response.status(200).send('OK');
    }

    if (request.method !== 'GET') {
        return response.status(405).send('Method Not Allowed');
    }

    // Проверка, что ключи и ID установлены
    if (!STEAM_API_KEY || !STEAM_ID_64) {
        console.error('Environment variables STEAM_API_KEY or STEAM_ID_64 are not set.');
        return response.status(500).json({ error: 'Steam API Key or Steam ID 64 not configured on server.' });
    }

    try {
        // Использование GetOwnedGames для получения всех игр
        const steamApiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID_64}&format=json&include_appinfo=true&include_played_free_games=true`;

        const apiResponse = await fetch(steamApiUrl);

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error(`Steam API Error: ${apiResponse.status} - ${errorText}`);
            return response.status(apiResponse.status).json({ error: `Steam API responded with status ${apiResponse.status}`, details: errorText });
        }

        const data = await apiResponse.json();

        if (data && data.response && data.response.games && data.response.games.length > 0) {
            // Сортируем игры по rtime_last_played (Unix-таймштамп последнего запуска) в порядке убывания
            const sortedGames = data.response.games.sort((a, b) => b.rtime_last_played - a.rtime_last_played);

            const latestGame = sortedGames[0]; // Самая последняя игра

            // Формируем объект ответа с нужными полями
            // Заметьте: playtime_2weeks больше не доступен, теперь используем playtime_forever
            const result = {
                response: {
                    games: [
                        {
                            appid: latestGame.appid,
                            name: latestGame.name,
                            playtime_forever: latestGame.playtime_forever, // Общее время в минутах
                            rtime_last_played: latestGame.rtime_last_played, // Таймштамп последнего запуска
                            // Steam CDN URL для обложки игры:
                            img_url: `https://cdn.akamai.steamstatic.com/steam/apps/${latestGame.appid}/header.jpg`,
                            // Вы можете также использовать latestGame.img_icon_url и latestGame.img_logo_url
                        }
                    ]
                }
            };

            return response.status(200).json(result);
        } else {
            return response.status(200).json({ response: { games: [] } }); // Нет данных об играх
        }

    } catch (error) {
        console.error('Error fetching Steam data:', error);
        return response.status(500).json({ error: 'Failed to fetch data from Steam API.', details: error.message });
    }
}
