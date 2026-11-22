import { ANIME } from '@consumet/extensions';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { title, ep } = req.query;
  if (!title || !ep) return res.status(400).json({ error: "Judul dan Episode wajib diisi" });

  try {
    // Inisialisasi provider Gogoanime
    const gogoanime = new ANIME.Gogoanime();
    
    // 1. Cari anime berdasarkan judul
    const searchResults = await gogoanime.search(title);
    if (!searchResults.results || searchResults.results.length === 0) {
      return res.status(404).json({ error: "Anime tidak ditemukan di database." });
    }
    
    // Ambil hasil paling relevan
    const animeId = searchResults.results[0].id;
    
    // 2. Ambil info anime (termasuk daftar episode)
    const animeInfo = await gogoanime.fetchAnimeInfo(animeId);
    
    // 3. Cari ID episode yang cocok
    const episode = animeInfo.episodes.find(e => e.number == ep);
    if (!episode) {
      return res.status(404).json({ error: `Episode ${ep} tidak ditemukan.` });
    }

    // 4. Ambil link video (.m3u8) dan subtitle
    const watchData = await gogoanime.fetchEpisodeSources(episode.id);
    
    return res.status(200).json({
      sources: watchData.sources,
      subtitles: watchData.subtitles || []
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Gagal mengambil stream. Server sumber mungkin sedang down." });
  }
}
