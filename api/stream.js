export default async function handler(req, res) {
  // Izinkan akses CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { title, ep } = req.query;
  if (!title || !ep) return res.status(400).json({ error: "Judul dan Episode wajib diisi" });

  // Header untuk menghindari blokir Cloudflare
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json'
  };

  // Daftar API publik (Zoro/HiAnime) yang sering update
  const MIRRORS = [
    "https://api-consumet-org-six.vercel.app",
    "https://consumet-api-nine.vercel.app",
    "https://consumet-api-zeta.vercel.app"
  ];

  // Fungsi bantuan untuk timeout (biar Vercel gak nge-hang 10 detik)
  const fetchWithTimeout = async (url, options = {}, timeout = 4000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };

  for (let base of MIRRORS) {
    try {
      console.log(`Mencoba server: ${base}`);
      
      // 1. Cari Anime berdasarkan Judul
      const searchRes = await fetchWithTimeout(`${base}/anime/zoro/${encodeURIComponent(title)}`, { headers });
      if (!searchRes.ok) continue;
      
      const searchData = await searchRes.json();
      if (!searchData.results || searchData.results.length === 0) continue;

      const animeId = searchData.results[0].id;

      // 2. Ambil List Episode
      const infoRes = await fetchWithTimeout(`${base}/anime/zoro/info?id=${animeId}`, { headers });
      const infoData = await infoRes.json();
      
      if (!infoData.episodes || infoData.episodes.length === 0) continue;

      // 3. Cari ID Episode yang cocok
      const episode = infoData.episodes.find(e => e.number == ep);
      if (!episode) continue;

      // 4. Ambil Link Video (.m3u8) & Subtitle
      const watchRes = await fetchWithTimeout(`${base}/anime/zoro/watch?episodeId=${episode.id}`, { headers });
      const watchData = await watchRes.json();

      if (watchData.sources && watchData.sources.length > 0) {
        console.log(`Berhasil dapet video dari: ${base}`);
        return res.status(200).json({
          sources: watchData.sources,
          subtitles: watchData.subtitles || []
        });
      }
    } catch (e) {
      console.log(`Server ${base} gagal/timeout: ${e.message}`);
    }
  }

  return res.status(500).json({ error: "Semua server API publik sedang sibuk atau down. Coba lagi beberapa saat lagi." });
}
