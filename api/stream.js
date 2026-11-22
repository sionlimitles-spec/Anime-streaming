export default async function handler(req, res) {
  // Izinkan akses dari frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { title, ep } = req.query;

  if (!title || !ep) {
    return res.status(400).json({ error: "Parameter 'title' dan 'ep' wajib diisi" });
  }

  // Daftar mirror API Consumet (Zoro/HiAnime) yang aktif
  const MIRRORS = [
    "https://api-consumet-org-six.vercel.app",
    "https://consumet-api-zeta.vercel.app",
    "https://consumet-api.vercel.app"
  ];

  for (let base of MIRRORS) {
    try {
      // 1. Cari anime berdasarkan judul
      const searchRes = await fetch(`${base}/anime/zoro/${encodeURIComponent(title)}`);
      if (!searchRes.ok) continue; // Kalau mirror ini mati, coba mirror selanjutnya
      
      const searchData = await searchRes.json();
      if (!searchData.results || searchData.results.length === 0) continue;

      const animeId = searchData.results[0].id;

      // 2. Ambil daftar episode
      const infoRes = await fetch(`${base}/anime/zoro/info?id=${animeId}`);
      const infoData = await infoRes.json();
      
      if (!infoData.episodes || infoData.episodes.length === 0) continue;

      // 3. Cari ID episode yang cocok (misal user minta eps 1)
      const episode = infoData.episodes.find(e => e.number == ep);
      if (!episode) continue;

      // 4. Ambil link stream (.m3u8) dan subtitle
      const watchRes = await fetch(`${base}/anime/zoro/watch?episodeId=${episode.id}`);
      const watchData = await watchRes.json();

      if (watchData.sources && watchData.sources.length > 0) {
        return res.status(200).json({
          sources: watchData.sources,
          subtitles: watchData.subtitles || []
        });
      }
    } catch (e) {
      // Kalau error, diam saja dan lanjut coba mirror berikutnya
      console.log(`Mirror ${base} gagal:`, e.message);
    }
  }

  // Jika semua mirror gagal
  return res.status(500).json({ error: "Semua server stream sedang down. Coba lagi nanti atau gunakan VPN." });
}
