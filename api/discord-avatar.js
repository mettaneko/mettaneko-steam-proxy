const USER_ID = '1066044494992113685'; 
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const ALLOWED_ORIGIN = 'https://www.mettaneko.ru'; 

module.exports = async (req, res) => {
    // ----------------------------------------------------
    // УСТАНОВКА ЗАГОЛОВКОВ CORS
    // ----------------------------------------------------
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    // ----------------------------------------------------

    if (!DISCORD_TOKEN) {
        return res.status(500).json({ error: "DISCORD_BOT_TOKEN не установлен. Проверьте настройки Vercel." });
    }

    try {
        // 1. Получение данных пользователя из Discord API
        const discordApiUrl = `https://discord.com/api/v10/users/${USER_ID}`;
        const userResponse = await fetch(discordApiUrl, {
            headers: { 'Authorization': `Bot ${DISCORD_TOKEN}` },
        });

        if (!userResponse.ok) {
             // Возвращаем ошибку от Discord, чтобы понять причину (например, 401 Unauthorized)
             const errorText = await userResponse.text();
             console.error("Discord API Error:", userResponse.status, errorText);
            throw new Error(`Discord API Error: ${userResponse.status}`);
        }

        const userData = await userResponse.json();
        const avatarHash = userData.avatar;
        
        let avatarUrl;

        if (avatarHash) {
            const isAnimated = avatarHash.startsWith('a_');
            const format = isAnimated ? 'gif' : 'png'; // Просим PNG для статических, GIF для анимированных
            
            // 2. Создание прямой ссылки на CDN Discord
            avatarUrl = `https://cdn.discordapp.com/avatars/${USER_ID}/${avatarHash}.${format}?size=256`;
        } else {
            // 3. Стандартный аватар Discord (он всегда PNG)
            const defaultAvatarIndex = userData.discriminator % 5;
            avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png?size=256`;
        }
        
        // 4. Устанавливаем кеширование и возвращаем ссылку в формате JSON
        res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate'); 
        res.status(200).json({ avatarUrl: avatarUrl });
        
    } catch (error) {
        console.error("Критическая ошибка в Serverless Function:", error.message);
        // Убедимся, что возвращаем JSON при ошибке
        res.status(500).json({ error: "Не удалось получить аватар Discord. Проверьте лог Vercel." });
    }
};
