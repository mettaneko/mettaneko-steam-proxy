const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const ALLOWED_ORIGIN = 'https://www.mettaneko.ru';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (!DISCORD_TOKEN) {
        return res.status(500).json({ error: "DISCORD_BOT_TOKEN не установлен." });
    }
 
    const userId = req.query.user_id || '1505966421673377902';
 
    if (!/^\d{17,19}$/.test(userId)) {
        return res.status(400).json({ error: "Некорректный user_id" });
    }

    try {
        const userResponse = await fetch(`https://discord.com/api/v10/users/${userId}`, {
            headers: { 'Authorization': `Bot ${DISCORD_TOKEN}` },
        });

        if (!userResponse.ok) {
            const errorText = await userResponse.text();
            console.error("Discord API Error:", userResponse.status, errorText);
            throw new Error(`Discord API Error: ${userResponse.status}`);
        }

        const userData = await userResponse.json();
        const avatarHash = userData.avatar;
        let avatarUrl;

        if (avatarHash) {
            const isAnimated = avatarHash.startsWith('a_');
            const format = isAnimated ? 'gif' : 'png';
            avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${format}?size=256`;
        } else { 
            const defaultAvatarIndex = Number((BigInt(userId) >> 22n) % 6n);
            avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png?size=256`;
        }

        res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
        res.status(200).json({ avatarUrl });
    } catch (error) {
        console.error("Ошибка:", error.message);
        res.status(500).json({ error: "Не удалось получить аватар Discord." });
    }
};
