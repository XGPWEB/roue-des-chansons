/* Vidéos karaoké YouTube. idYoutube() sert aussi côté navigateur ; chercherKaraoke() est appelée
   uniquement côté serveur (clé YOUTUBE_API_KEY, jamais envoyée au navigateur). */

export type Video = { id: string; titre: string; chaine: string };

/** ID d'une vidéo depuis un lien YouTube (watch, youtu.be, embed, shorts, live), sinon null */
export function idYoutube(lien?: string): string | null {
  if (!lien?.trim()) return null;
  try {
    const u = new URL(lien.trim());
    const hote = u.hostname.replace(/^(www\.|m\.|music\.)/, "");
    let id: string | null = null;
    if (hote === "youtu.be") id = u.pathname.slice(1);
    else if (hote === "youtube.com" || hote === "youtube-nocookie.com")
      id = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] ?? null;
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

const UN_MOIS = 60 * 60 * 24 * 30;

const decoder = (s: string) =>
  s.replace(/&(#39|quot|amp|lt|gt);/g, (_, e) => ({ "#39": "'", quot: '"', amp: "&", lt: "<", gt: ">" })[e as string] ?? _);

/** Jusqu'à 5 vidéos karaoké intégrables. Lève "cle-absente" si YOUTUBE_API_KEY n'est pas définie. */
export async function chercherKaraoke(artiste: string, titre: string): Promise<Video[]> {
  const cle = process.env.YOUTUBE_API_KEY?.trim();
  if (!cle) throw new Error("cle-absente");
  const p = new URLSearchParams({
    part: "snippet",
    type: "video",
    videoEmbeddable: "true", // seulement les vidéos qui acceptent d'être lues hors de YouTube
    videoSyndicated: "true",
    maxResults: "10",
    regionCode: "FR",
    relevanceLanguage: "fr",
    q: `${artiste} ${titre} karaoké`,
    key: cle,
  });
  // Mise en cache un mois : le quota gratuit est d'environ 100 recherches par jour
  const r = await fetch(`https://www.googleapis.com/youtube/v3/search?${p}`, { next: { revalidate: UN_MOIS } });
  if (!r.ok) throw new Error(`youtube-${r.status}`);
  const j = (await r.json()) as { items?: { id: { videoId?: string }; snippet: { title: string; channelTitle: string } }[] };
  // Les vraies versions karaoké d'abord, puis les versions avec paroles, puis le reste (ordre YouTube conservé)
  const rang = (t: string) => (/karaok/i.test(t) ? 0 : /paroles|lyrics/i.test(t) ? 1 : 2);
  return (j.items ?? [])
    .filter((i) => i.id.videoId)
    .map((i) => ({ id: i.id.videoId!, titre: decoder(i.snippet.title), chaine: decoder(i.snippet.channelTitle) }))
    .sort((a, b) => rang(a.titre) - rang(b.titre))
    .slice(0, 5);
}
