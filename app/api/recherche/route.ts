import { rechercherChansons } from "@/lib/deezer";

/** /api/recherche?q=papaoutai → [{ artiste, titre, photo }] (10 au plus) */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 120);
  if (!q || q.length < 2) return Response.json([]);
  return Response.json(await rechercherChansons(q), {
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
