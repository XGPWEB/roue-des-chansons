import { slugify } from "./utils";

/* Recherche de chansons et de photos d'artistes via l'API publique Deezer (sans clé).
   Appelée uniquement côté serveur : l'API Deezer n'autorise pas les appels depuis le navigateur. */

const API = "https://api.deezer.com";
const UNE_SEMAINE = 60 * 60 * 24 * 7;

type Artiste = { name: string; picture_big?: string; picture_medium?: string };
type Piste = { title: string; artist: Artiste };

async function appel<T>(chemin: string, q: string): Promise<T[]> {
  try {
    const r = await fetch(`${API}${chemin}?limit=15&q=${encodeURIComponent(q)}`, { next: { revalidate: UNE_SEMAINE } });
    if (!r.ok) return [];
    const j = (await r.json()) as { data?: T[] };
    return j.data ?? [];
  } catch {
    return [];
  }
}

const photo = (a?: Artiste) => {
  const url = a?.picture_big || a?.picture_medium;
  // Deezer renvoie une image grise générique (chemin "/artist//") quand l'artiste n'a pas de photo
  return url && !url.includes("/artist//") ? url : null;
};

/** Même artiste ? « GIMS » = « Gims », « Gregoire » = « Grégoire », « Vincent Lagaf' » ⊃ « Lagaf' » */
const memeArtiste = (a: string, b: string) => {
  const x = slugify(a), y = slugify(b);
  return !!x && !!y && (x === y || x.includes(y) || y.includes(x));
};

export async function photoArtiste(artiste: string, titre = ""): Promise<string | null> {
  // 1. par la chanson (évite les homonymes), en ne gardant qu'un résultat du bon artiste
  if (titre) {
    const pistes = await appel<Piste>("/search", `${artiste} ${titre}`);
    const p = pistes.find((p) => memeArtiste(p.artist.name, artiste) && photo(p.artist));
    if (p) return photo(p.artist);
  }
  // 2. par le nom seul
  const artistes = await appel<Artiste>("/search/artist", artiste);
  return photo(artistes.find((a) => memeArtiste(a.name, artiste) && photo(a)));
}

export type Suggestion = { artiste: string; titre: string; photo: string | null };

export async function rechercherChansons(q: string): Promise<Suggestion[]> {
  const vues = new Set<string>();
  const res: Suggestion[] = [];
  for (const p of await appel<Piste>("/search", q)) {
    const k = slugify(`${p.artist.name} ${p.title}`);
    if (vues.has(k)) continue;
    vues.add(k);
    res.push({ artiste: p.artist.name, titre: p.title, photo: photo(p.artist) });
  }
  return res.slice(0, 10);
}
