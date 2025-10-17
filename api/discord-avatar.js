// Замени на свой ID пользователя
const USER_ID = '1066044494992113685'; 
// !!! Добавь свой Bot Token в переменные окружения Vercel как DISCORD_BOT_TOKEN !!!
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;

module.exports = async (req, res) => {
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
            throw new Error(`Discord API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const avatarHash = data.avatar;

        if (!avatarHash) {
            // Пользователь использует стандартный аватар Discord
            const defaultAvatarUrl = `https://cdn.discordapp.com/embed/avatars/${data.discriminator % 5}.png`;
            return res.json({ avatarUrl: defaultAvatarUrl });
        }

        const isAnimated = avatarHash.startsWith('a_');
        const format = isAnimated ? 'gif' : 'webp';
        
        const avatarUrl = `https://cdn.discordapp.com/avatars/${USER_ID}/${avatarHash}.${format}?size=256`;

        // Устанавливаем кеширование для браузера
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate'); // 5 минут кеша
        res.json({ avatarUrl });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Не удалось получить аватар Discord" });
    }
};