// Импорт библиотеки sharp
const sharp = require('sharp');
// Импорт fetch, если он еще не глобально доступен (для Vercel это обычно не нужно)
// const fetch = require('node-fetch'); 

// Замени на свой ID пользователя
const USER_ID = '1066044494992113685'; 
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
// Ваш домен для CORS
const ALLOWED_ORIGIN = 'https://www.mettaneko.ru'; 

module.exports = async (req, res) => {
    // ----------------------------------------------------
    // УСТАНОВКА ЗАГОЛОВКОВ CORS (для разрешения запроса с вашего сайта)
    // ----------------------------------------------------
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    // ----------------------------------------------------

    if (!DISCORD_TOKEN) {
        return res.status(500).json({ error: "DISCORD_BOT_TOKEN не установлен" });
    }

    try {
        // 1. Получение данных пользователя из Discord API для получения хеша аватара
        const discordApiUrl = `https://discord.com/api/v10/users/${USER_ID}`;
        const userResponse = await fetch(discordApiUrl, {
            headers: { 'Authorization': `Bot ${DISCORD_TOKEN}` },
        });

        if (!userResponse.ok) {
            throw new Error(`Discord API Error: ${userResponse.status} ${userResponse.statusText}`);
        }

        const userData = await userResponse.json();
        const avatarHash = userData.avatar;
        
        // 2. Определение формата и создание URL для CDN Discord
        let avatarCdnUrl;
        if (!avatarHash) {
            // Пользователь использует стандартный аватар (он и так PNG)
            const defaultAvatarIndex = userData.discriminator % 5;
            avatarCdnUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png?size=256`;
        } else {
            // Запрашиваем WebP или GIF, чтобы потом конвертировать в PNG
            const format = avatarHash.startsWith('a_') ? 'gif' : 'webp';
            avatarCdnUrl = `https://cdn.discordapp.com/avatars/${USER_ID}/${avatarHash}.${format}?size=256`;
        }
        
        // 3. Скачивание самого изображения
        const imageResponse = await fetch(avatarCdnUrl);
        if (!imageResponse.ok) {
            throw new Error('Failed to fetch avatar image from Discord CDN');
        }

        const imageBuffer = await imageResponse.buffer(); // Получаем данные изображения в виде буфера

        // 4. Конвертация изображения в PNG с помощью sharp
        const pngBuffer = await sharp(imageBuffer)
            .png({ 
                quality: 100,
                compressionLevel: 9 
            }) // Настройка конвертации в PNG
            .toBuffer();

        // 5. Отправка PNG-изображения в ответ
        res.setHeader('Content-Type', 'image/png');
        // Устанавливаем кеширование (например, 1 час)
        res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate'); 
        res.status(200).send(pngBuffer);
        
    } catch (error) {
        console.error(error);
        res.setHeader('Content-Type', 'application/json'); // Возвращаем JSON при ошибке
        res.status(500).json({ error: "Не удалось получить и конвертировать аватар Discord." });
    }
};
