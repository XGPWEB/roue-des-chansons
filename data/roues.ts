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
    // Ordre alterné vraies / fausses pour que les tranches se mélangent visuellement
    chansons: [
      { artiste: "Claude François", titre: "Alexandrie Alexandra", vraie: true },
      { artiste: "Joe Dassin", titre: "On ira", vraie: false },
      { artiste: "Gilbert Montagné", titre: "On va s'aimer", vraie: true },
      { artiste: "Daniel Guichard", titre: "Mon vieux", vraie: false },
      { artiste: "Louise Attaque", titre: "Je t'emmène au vent", vraie: true },
      { artiste: "Frankie Vincent", titre: "Fruit de la passion", vraie: false },
      { artiste: "Céline Dion", titre: "J'irai où tu iras", vraie: true },
      { artiste: "Lorie", titre: "Ta meilleure amie", vraie: false },
      // ⚠ À vérifier : « En feu » est un titre de Soprano, pas de Stromae
      { artiste: "Stromae", titre: "Je suis en feu", vraie: true },
      { artiste: "Pigloo", titre: "Papa Pingouin", vraie: false },
      { artiste: "Gims", titre: "Ciel", vraie: true },
      { artiste: "Lagaf'", titre: "La Zoubida", vraie: false },
    ],
  },
];

export function getRoue(slug: string) {
  return roues.find((r) => r.slug === slug);
}
