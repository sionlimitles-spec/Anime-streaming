// api/stream.js
export default async function handler(req, res) {
  // Izinkan akses dari mana saja (CORS)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id, ep } = req.query;
  if (!id || !ep) {
    return res.status(400).json({ error: 'Parameter id (MAL ID) dan ep (Episode) wajib diisi' });
  }

  try {
    // Di sini kita menggunakan API publik (mirip Consumet) sebagai jembatan.
    // Karena scraping langsung dari MegaPlay/Gogoanime butuh bypass Cloudflare yang rumit.
    // API ini mengembalikan data stream & subtitle langsung.
    
    // Kita gunakan API Zoro/Anify/Consumet yang masih aktif sebagai contoh.
    // Menggunakan endpoint Gogoanime via Consumet yang di-proxy oleh Vercel
    const response = await fetch(`https://api.consumet.org/anime/gogoanime/watch/${id}-episode-${ep}`);
    
    if (!response.ok) {
      throw new Error('Gagal mengambil data dari server sumber');
    }
    
    const data = await response.json();
    
    // Kirim data sources dan subtitles ke Frontend
    return res.status(200).json({
      sources: data.sources || [],
      subtitles: data.subtitles || []
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
