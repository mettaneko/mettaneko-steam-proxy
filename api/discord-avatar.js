const USER_ID = '1066044494992113685'; 
// !!! Добавь свой Bot Token в переменные окружения Vercel как DISCORD_BOT_TOKEN !!!
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;

module.exports = async (req, res) => {
    // ----------------------------------------------------
    // !!! НОВОЕ: УСТАНОВКА ЗАГОЛОВКОВ CORS !!!
    // ----------------------------------------------------
    // Устанавливаем заголовок, чтобы разрешить запрос с вашего домена.
    // Если нужно разрешить всем (менее безопасно, но просто), используйте '*'.
    // Если хотите быть точным, используйте ваш домен.
    res.setHeader('Access-Control-Allow-Origin', 'https://www.mettaneko.ru');
    // Или, чтобы разрешить запросы отовсюду:
    // res.setHeader('Access-Control-Allow-Origin', '*'); 
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Обработка запросов OPTIONS (предварительный запрос CORS)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    // ----------------------------------------------------

    if (!DISCORD_TOKEN) {
        return res.status(500).json({ error: "DISCORD_BOT_TOKEN не установлен" });
    }

    try {
        const discordApiUrl = `https://discord.com/api/v10/users/${USER_ID}`;
        const response = await fetch(discordApiUrl, {
            headers: {
                'Authorization': `Bot ${DISCORD_TOKEN}`,
            },
        });

        if (!response.ok) {
            // Обязательно установите CORS-заголовок и для ошибок!
            res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate'); 
            throw new Error(`Discord API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const avatarHash = data.avatar;

        // ... (остальной код для определения URL аватара) ...
        
        const avatarUrl = '...'; // Сюда будет ваш финальный URL
        
        // Устанавливаем кеширование для браузера
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate'); // 5 минут кеша
        res.json({ avatarUrl });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Не удалось получить аватар Discord" });
    }
};
