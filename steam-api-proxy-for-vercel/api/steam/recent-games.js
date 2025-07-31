// api/steam/recent-games.js

// Обратите внимание: поскольку вы не устанавливаете Node.js локально,
// require('dotenv').config() не будет работать локально,
// но это не проблема, потому что Vercel будет использовать свои переменные окружения.
const fetch = require('node-fetch'); // Эта библиотека будет автоматически установлена Vercel

// Главная функция-обработчик для Vercel Serverless Function
module.exports = async (req, res) => {
    // --- Настройка CORS заголовков ---
    // ОЧЕНЬ ВАЖНО: Замените 'https://www.mettaneko.ru' на ТОЧНЫЙ домен вашего сайта на GitHub Pages.
    const allowedOrigin = 'https://www.mettaneko.ru'; // Или 'https://mettaneko.ru'

    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); // Разрешаем методы GET и OPTIONS
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Разрешаем заголовок Content-Type

    // Обработка CORS preflight запросов (OPTIONS-запросов от браузера)
    if (req.method === 'OPTIONS') {
        return res.status(200).send('OK');
    }

    // --- Получение API-ключей ---
    // Ключи будут доступны из переменных окружения Vercel (которые вы настроите позже).
    const STEAM_API_KEY = process.env.STEAM_API_KEY;
    const STEAM_ID_64 = process.env.STEAM_ID_64;

    // Проверяем, что ключи существуют
    if (!STEAM_API_KEY || !STEAM_ID_64) {
        console.error("Steam API Key or Steam ID 64 is not set.");
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