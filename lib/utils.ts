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

export const photoUrl = (c: Pick<Chanson, "artiste" | "photo">) =>
  c.photo ?? `/photos/${slugify(c.artiste)}.jpg`;

export const karaokeUrl = (c: Pick<Chanson, "artiste" | "titre" | "karaoke">) =>
  c.karaoke?.trim() ||
  "https://www.youtube.com/results?search_query=" +
    encodeURIComponent(`${c.artiste} ${c.titre} karaoké`);
