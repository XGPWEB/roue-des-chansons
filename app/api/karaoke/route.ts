import { chercherKaraoke } from "@/lib/youtube";

/** /api/karaoke?artiste=Stromae&titre=Papaoutai → { videos: [{ id, titre, chaine }] } ou { erreur } */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const artiste = p.get("artiste")?.trim().slice(0, 120);
  const titre = p.get("titre")?.trim().slice(0, 160);
  if (!artiste || !titre) return Response.json({ erreur: "parametres" }, { status: 400 });
  try {
    const videos = await chercherKaraoke(artiste, titre);
    return Response.json({ videos }, { headers: { "Cache-Control": "public, max-age=86400, s-maxage=2592000" } });
  } catch (e) {
    const erreur = e instanceof Error ? e.message : "inconnue";
    if (erreur !== "cle-absente") console.error("[karaoke]", erreur);
    return Response.json({ erreur, videos: [] }, { status: erreur === "cle-absente" ? 503 : 502 });
  }
}
