import type { RoueConfig, RoueSource } from "@/data/types";
import { slugify } from "./utils";

/**
 * Les « vraies » chansons ne sont pas dans le dépôt (public) : elles viennent de la
 * variable d'environnement VRAIES_CHANSONS, lue côté serveur au moment du build.
 *
 * Format (JSON) : { "<slug de la roue>": ["Artiste - Titre", ...] }
 * La comparaison ignore accents, majuscules et ponctuation.
 */
const cle = (artiste: string, titre: string) => slugify(`${artiste} ${titre}`);

let cache: Record<string, Set<string>> | null = null;

function lireVraies(): Record<string, Set<string>> {
  if (cache) return cache;
  const brut = process.env.VRAIES_CHANSONS?.trim();
  if (!brut) {
    console.warn("[roue] VRAIES_CHANSONS absente : toutes les chansons seront des fausses pistes.");
    return (cache = {});
  }
  let json: unknown;
  try {
    json = JSON.parse(brut);
  } catch {
    throw new Error("[roue] VRAIES_CHANSONS n'est pas un JSON valide.");
  }
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new Error('[roue] VRAIES_CHANSONS doit être un objet : { "slug": ["Artiste - Titre", …] }');
  }
  cache = {};
  for (const [slug, liste] of Object.entries(json)) {
    if (!Array.isArray(liste)) throw new Error(`[roue] VRAIES_CHANSONS["${slug}"] doit être une liste.`);
    cache[slug] = new Set(liste.map((s) => slugify(String(s))));
  }
  return cache;
}

export function avecVraies(roue: RoueSource): RoueConfig {
  const vraies = lireVraies()[roue.slug] ?? new Set<string>();
  const chansons = roue.chansons.map((c) => ({ ...c, vraie: vraies.has(cle(c.artiste, c.titre)) }));
  const trouvees = new Set(roue.chansons.map((c) => cle(c.artiste, c.titre)));
  for (const v of vraies) {
    if (!trouvees.has(v)) console.warn(`[roue] VRAIES_CHANSONS["${roue.slug}"] : « ${v} » ne correspond à aucune chanson.`);
  }
  return { ...roue, chansons };
}
