import type { RoueConfig } from "./types";

/**
 * Toutes les roues de l'application.
 * Pour en ajouter une : copier un bloc, changer le slug, puis git push.
 * Elle sera disponible sur /<slug>.
 */
export const roues: RoueConfig[] = [
  {
    slug: "chansons",
    titre: "La Roue des Chansons",
    lancement: { artiste: "Grégoire", titre: "Toi + Moi" },
    chansons: [
      { artiste: "Claude François", titre: "Alexandrie Alexandra" },
      { artiste: "Joe Dassin", titre: "On ira" },
      { artiste: "Gilbert Montagné", titre: "On va s'aimer" },
      { artiste: "Daniel Guichard", titre: "Mon vieux" },
      { artiste: "Louise Attaque", titre: "Je t'emmène au vent" },
      { artiste: "Francky Vincent", titre: "Fruit de la passion" },
      { artiste: "Céline Dion", titre: "J'irai où tu iras" },
      { artiste: "Lorie", titre: "Ta meilleure amie" },
      { artiste: "Stromae", titre: "Papaoutai" },
      { artiste: "Pigloo", titre: "Papa Pingouin" },
      { artiste: "Gims", titre: "Ciel" },
      { artiste: "Lagaf'", titre: "La Zoubida" },
    ],
  },
];

export function getRoue(slug: string) {
  return roues.find((r) => r.slug === slug);
}
