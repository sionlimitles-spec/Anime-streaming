import { ANIME } from '@consumet/extensions';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { title, ep } = req.query;
  if (!title || !ep) return res.status(400).json({ error: "Judul dan Episode wajib diisi" });

  // Daftar provider (server sumber) yang akan dicoba satu per satu
  const providers = [
    new ANIME.Zoro(),        // 1. Zoro (Paling stabil saat ini)
    new ANIME.Gogoanime(),   // 2. Gogoanime
    new ANIME.AnimePahe()    // 3. AnimePahe (Cadangan)
  ];

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    try {
      console.log(`[Mencoba server ${i + 1}]: ${provider.name}`);
      
      // 1. Cari Anime
      const searchResults = await provider.search(title);
      if (!searchResults.results || searchResults.results.length === 0) {
        console.log(`[${provider.name}] Anime tidak ditemukan, lanjut server berikutnya.`);
        continue;
      }

      const animeId = searchResults.results[0].id;
      
      // 2. Ambil Info & List Episode
      const animeInfo = await provider.fetchAnimeInfo(animeId);
      const episode = animeInfo.episodes.find(e => e.number == ep);
      
      if (!episode) {
        console.log(`[${provider.name}] Episode ${ep} tidak ditemukan.`);
        continue;
      }

      // 3. Ambil Link Video
      const watchData = await provider.fetchEpisodeSources(episode.id);
      
      if (watchData.sources && watchData.sources.length > 0) {
        console.log(`[${provider.name}] SUKSES dapat link video!`);
        return res.status(200).json({
          sources: watchData.sources,
          subtitles: watchData.subtitles || []
        });
      }
    } catch (error) {
      console.log(`[${provider.name}] Gagal/Timeout: ${error.message}`);
    }
  }

  // Jika ketiga server gagal semua
  return res.status(500).json({ error: "Semua server sumber sedang down atau diblokir. Coba lagi nanti." });
}
