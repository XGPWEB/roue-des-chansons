import type { Chanson } from "@/data/types";

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const initiales = (s: string) =>
  s
    .replace(/[^\p{L}\s-]/gu, "")
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

/** Photo choisie (champ `photo`) sinon photo de l'artiste trouvée sur Deezer (voir app/api/photo) */
export const photoUrl = (c: Pick<Chanson, "artiste" | "titre" | "photo">) =>
  c.photo?.trim() ||
  `/api/photo?artiste=${encodeURIComponent(c.artiste)}&titre=${encodeURIComponent(c.titre)}`;
