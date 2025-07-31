// api/steam/recent-games.js

const fetch = require('node-fetch'); // Эта библиотека будет автоматически установлена Vercel

// Главная функция-обработчик для Vercel Serverless Function
// api/steam/recent-games.js
// ... (остальной код до этого блока) ...

module.exports = async (req, res) => {
    // --- Настройка CORS заголовков ---
    // Определяем список разрешенных доменов
    const allowedOrigins = [
        'https://www.mettaneko.ru',
        'https://mettaneko.ru' // Добавьте здесь второй домен (без 'www')
        // Если у вас есть другие домены, добавьте их сюда же: 'https://ваш-другой-домен.ru'
    ];

    // Получаем домен, с которого пришел запрос (заголовок Origin)
    const origin = req.headers.origin;

    // Если домен, с которого пришел запрос, находится в списке разрешенных,
    // устанавливаем заголовок Access-Control-Allow-Origin именно на этот домен.
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        // Если домен не разрешен, мы не устанавливаем Access-Control-Allow-Origin.
        // Браузер сам заблокирует запрос из-за CORS-политики.
        // Вы можете добавить здесь логирование или другую обработку, если нужно.
        console.warn(`Request from unauthorized origin: ${origin}`);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); // Разрешаем методы GET и OPTIONS
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Разрешаем заголовок Content-Type
    // res.setHeader('Access-Control-Allow-Credentials', 'true'); // Если вы используете куки или HTTP-аутентификацию

    // Обработка CORS preflight запросов (OPTIONS-запросов от браузера)
    if (req.method === 'OPTIONS') {
        // Для OPTIONS-запросов также нужно установить allowedOrigin
        // Vercel автоматически обрабатывает это, но явная установка не помешает
        if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Access-Control-Max-Age', '86400'); // Кешировать preflight-ответ на 24 часа
        return res.status(200).send('OK');
    }

    // ... (остальной код прокси-сервера без изменений) ...
};
    // --- Получение API-ключей ---
    // Ключи будут доступны из переменных окружения Vercel (которые вы настроите на платформе).
    const STEAM_API_KEY = process.env.STEAM_API_KEY;
    const STEAM_ID_64 = process.env.STEAM_ID_64;

    // Проверяем, что ключи существуют
    if (!STEAM_API_KEY || !STEAM_ID_64) {
        console.error("Steam API Key or Steam ID 64 is not set in Vercel Environment Variables.");
        return res.status(500).json({ error: 'Server configuration error: API keys missing.' });
    }

    // --- Запрос к Steam API ---
    try {
        const steamApiUrl = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID_64}&format=json&count=1`;
        console.log(`Forwarding request to Steam API: ${steamApiUrl}`);

        const response = await fetch(steamApiUrl);

        // Если Steam API вернул ошибку, передаем ее дальше
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Steam API responded with status ${response.status}: ${errorText}`);
            return res.status(response.status).json({ error: `Steam API error: ${errorText}` });
        }

        // Парсим ответ от Steam API
        const data = await response.json();

        // Отправляем данные обратно на ваш фронтенд
        res.json(data);

    } catch (error) {
        // Обработка любых сетевых ошибок или других исключений
        console.error('Error fetching data from Steam API via proxy:', error);
        res.status(500).json({ error: 'Failed to fetch Steam data through proxy.' });
    }
};
