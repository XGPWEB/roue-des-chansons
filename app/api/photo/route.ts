import { photoArtiste } from "@/lib/deezer";

/** /api/photo?artiste=Stromae&titre=Papaoutai → redirection vers la photo de l'artiste (404 si introuvable) */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const artiste = p.get("artiste")?.trim().slice(0, 120);
  if (!artiste) return new Response("Paramètre « artiste » manquant", { status: 400 });
  const url = await photoArtiste(artiste, p.get("titre")?.trim().slice(0, 160) ?? "");
  if (!url) return new Response(null, { status: 404, headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
  return new Response(null, {
    status: 302,
    headers: { Location: url, "Cache-Control": "public, max-age=86400, s-maxage=604800" },
  });
}
