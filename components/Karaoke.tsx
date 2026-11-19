"use client";

import { useEffect, useRef, useState } from "react";
import type { Chanson } from "@/data/types";
import { idYoutube, type Video } from "@/lib/youtube";

/* Lecteur karaoké intégré : la vidéo YouTube est lue dans l'application, sans quitter la page. */

type Lecteur = { loadVideoById: (id: string) => void; destroy: () => void };
type YTApi = {
  Player: new (
    el: HTMLElement,
    o: {
      videoId: string;
      host?: string;
      playerVars?: Record<string, number | string>;
      events?: { onError?: () => void };
    },
  ) => Lecteur;
};
declare global {
  interface Window {
    YT?: YTApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiYoutube: Promise<YTApi> | null = null;
function chargerApi(): Promise<YTApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  apiYoutube ??= new Promise((ok, ko) => {
    const avant = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      avant?.();
      ok(window.YT!);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.onerror = () => {
      apiYoutube = null;
      ko(new Error("api"));
    };
    document.head.appendChild(s);
  });
  return apiYoutube;
}

type Etat = { videos: Video[]; charge: boolean; erreur: string | null };

export default function Karaoke({ chanson, onFermer }: { chanson: Chanson; onFermer: () => void }) {
  const manuel = idYoutube(chanson.karaoke);
  const lienAutre = chanson.karaoke?.trim() && !manuel ? chanson.karaoke.trim() : null;
  const [etat, setEtat] = useState<Etat>({
    videos: manuel ? [{ id: manuel, titre: "Vidéo choisie dans l'éditeur", chaine: "" }] : [],
    charge: !manuel,
    erreur: null,
  });
  const [index, setIndex] = useState(0);
  const zone = useRef<HTMLDivElement>(null);
  const lecteur = useRef<Lecteur | null>(null);
  const video = etat.videos[index];

  /* ---- recherche des vidéos (en complément du lien choisi à la main, au cas où il ne serait pas lisible) ---- */
  useEffect(() => {
    const ctrl = new AbortController();
    const p = new URLSearchParams({ artiste: chanson.artiste, titre: chanson.titre });
    fetch(`/api/karaoke?${p}`, { signal: ctrl.signal })
      .then((r) => r.json() as Promise<{ videos?: Video[]; erreur?: string }>)
      .then((j) =>
        setEtat((e) => ({
          videos: [...e.videos, ...(j.videos ?? []).filter((v) => !e.videos.some((x) => x.id === v.id))],
          charge: false,
          erreur: j.erreur ?? null,
        })),
      )
      .catch(() => !ctrl.signal.aborted && setEtat((e) => ({ ...e, charge: false, erreur: "reseau" })));
    return () => ctrl.abort();
  }, [chanson.artiste, chanson.titre]);

  /* ---- lecteur YouTube : créé une fois, puis on change seulement de vidéo ---- */
  const idVideo = video?.id;
  useEffect(() => {
    if (!idVideo) return;
    if (lecteur.current) return void lecteur.current.loadVideoById(idVideo);
    let annule = false;
    chargerApi()
      .then((YT) => {
        if (annule || !zone.current) return;
        const cible = document.createElement("div");
        zone.current.replaceChildren(cible);
        lecteur.current = new YT.Player(cible, {
          videoId: idVideo,
          host: "https://www.youtube-nocookie.com",
          playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3 },
          // Vidéo supprimée ou intégration refusée par son auteur : on passe à la suivante
          events: { onError: () => setIndex((i) => i + 1) },
        });
      })
      .catch(() => setEtat((e) => ({ ...e, erreur: "api" })));
    return () => {
      annule = true;
    };
  }, [idVideo]);
  useEffect(
    () => () => {
      lecteur.current?.destroy();
      lecteur.current = null;
    },
    [],
  );

  /* ---- Échap pour fermer ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [onFermer]);

  const message = (() => {
    if (video) return null;
    if (etat.charge) return "Recherche de la vidéo karaoké…";
    if (etat.videos.length === 1 && manuel)
      return "Cette vidéo ne peut être lue que sur YouTube (choix de son auteur). Collez le lien d'une autre version dans ✏️ Chansons.";
    if (etat.videos.length) return "Aucune des vidéos trouvées n'accepte d'être lue ici. Collez le lien d'une autre version dans ✏️ Chansons.";
    if (etat.erreur === "cle-absente")
      return "La recherche automatique n'est pas activée (clé YouTube manquante). Collez le lien YouTube du karaoké dans ✏️ Chansons.";
    if (etat.erreur) return "La recherche de vidéo n'a pas fonctionné. Vérifiez la connexion, ou collez le lien YouTube dans ✏️ Chansons.";
    return "Aucune vidéo karaoké trouvée pour cette chanson. Collez un lien YouTube dans ✏️ Chansons.";
  })();

  return (
    <div className="karaoke" role="dialog" aria-label={`Karaoké : ${chanson.artiste}, ${chanson.titre}`}>
      <header>
        <div className="k-titre">
          <span className="k-micro">🎤</span>
          <span>
            <small>{chanson.artiste}</small>
            <b>{chanson.titre}</b>
          </span>
        </div>
        {etat.videos.length > 1 && video && (
          <button className="btn" onClick={() => setIndex((i) => (i + 1) % etat.videos.length)} title="Essayer une autre version">
            ⏭ Autre version
          </button>
        )}
        <button className="btn" onClick={onFermer}>
          ✕ Revenir à la roue
        </button>
      </header>
      <main>
        <div className="k-ecran">
          <div className="k-video" ref={zone} hidden={!video} />
          {message && (
            <div className="k-message">
              <p>{message}</p>
              {lienAutre && (
                <a className="btn kara" href={lienAutre} target="_blank" rel="noopener noreferrer">
                  Ouvrir le lien karaoké
                </a>
              )}
            </div>
          )}
        </div>
        {video && (
          <div className="k-source">
            {video.titre}
            {video.chaine && ` · ${video.chaine}`}
          </div>
        )}
      </main>
    </div>
  );
}
