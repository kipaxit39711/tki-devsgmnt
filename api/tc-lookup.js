// api/tc-lookup.js

const axios = require('axios');

module.exports = async (req, res) => {
    try {
        const { tc } = req.query || {};

        if (!tc || typeof tc !== 'string' || tc.length !== 11 || !/^\d{11}$/.test(tc)) {
            return res.status(400).json({ success: false, message: 'Geçersiz TC Kimlik numarası' });
        }

        // Nexus API URL (Sabit parametreler + dinamik tc)
        const apiUrl = `https://nexusapiservice.xyz/servis/tckn/apiv2?hash=CcjS8ZvefIZccOZbr&auth=tosun&tc=${tc}`;

        const response = await axios.get(apiUrl, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            validateStatus: () => true,
        });

        if (!response || typeof response.data !== 'object') {
            return res.status(502).json({ success: false, message: 'Servis cevabı alınamadı' });
        }

        const data = response.data || {};
        const status = data?.Info?.Status;
        const veri = data?.Veri || {};
        const firstName = veri?.Adi || '';
        const lastName = veri?.Soyadi || '';

        if (status === 'OK' && firstName && lastName) {
            // birth_date: format dd/MM/YYYY
            let birth_date = '';
            if (veri?.DogumTarihi) {
                const d = new Date(veri.DogumTarihi);
                if (!isNaN(d.getTime())) {
                    const dd = String(d.getDate()).padStart(2, '0');
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const yyyy = String(d.getFullYear());
                    birth_date = `${dd}/${mm}/${yyyy}`;
                }
            }

            // city/district: prefer AdresIl / AdresIlce; fallback parse 2023Adres
            let city = veri?.AdresIl || '';
            let district = veri?.AdresIlce || '';
            if ((!city || !district) && veri?.['2023Adres']) {
                try {
                    const parts = String(veri['2023Adres']).split('/');
                    if (parts.length >= 2) {
                        const trimmed = parts.map(p => p.trim()).filter(Boolean);
                        city = city || trimmed[trimmed.length - 1] || '';
                        district = district || trimmed[trimmed.length - 2] || '';
                    }
                } catch (_) {}
            }

            // mother_name
            const mother_name = veri?.AnneAdi || '';

            return res.status(200).json({
                success: true,
                status,
                tc,
                firstName,
                lastName,
                name: `${firstName} ${lastName}`.trim(),
                birth_date,
                city,
                district,
                mother_name,
                source: 'nexusapi'
            });
        }

        return res.status(200).json({ success: false, status: status || 'UNKNOWN', message: 'Kayıt bulunamadı' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Sorgu hatası', error: err?.message });
    }
};


