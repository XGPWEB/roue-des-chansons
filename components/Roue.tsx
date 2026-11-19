"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Chanson, RoueConfig } from "@/data/types";
import { audio, confettis, fanfare, tick } from "@/lib/effets";
import { photoUrl } from "@/lib/utils";
import { Avatar } from "./Avatar";
import Editeur, { listeValide, type Liste } from "./Editeur";
import Karaoke from "./Karaoke";

const COULEURS = ["#d62839", "#f5c542", "#1e63d6", "#8e2bd1", "#12a150", "#ff7a1a"];
const CLAIRES = new Set(["#f5c542"]);

type Resultat = { chanson: Omit<Chanson, "vraie"> & { vraie?: boolean }; type: "tirage" | "lancement" };
type Prefs = { animateur: boolean; retirer: boolean; tirees: number[]; admin: boolean };

export default function Roue({ roue }: { roue: RoueConfig }) {
  const cle = `roue:${roue.slug}`;
  const cleListe = `${cle}:liste`;

  /* ---- liste de chansons : celle du site, ou celle modifiée dans ce navigateur ---- */
  const [perso, setPerso] = useState<Liste | null>(null);
  const [editeur, setEditeur] = useState(false);
  const [karaoke, setKaraoke] = useState<Resultat["chanson"] | null>(null);
  const chansons = perso?.chansons ?? roue.chansons;
  const lancementCh = perso ? perso.lancement : roue.lancement;
  const N = chansons.length;
  const STEP = 360 / N;

  const [prefs, setPrefs] = useState<Prefs>({ animateur: false, retirer: false, tirees: [], admin: true });
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [H, setH] = useState(92);
  const [ampoules, setAmpoules] = useState<{ x: number; y: number }[]>([]);

  const R = H / 2 / Math.tan(Math.PI / N);
  const rot = useRef(0);
  const tambour = useRef<HTMLDivElement>(null);
  const faces = useRef<(HTMLDivElement | null)[]>([]);
  const cadre = useRef<HTMLDivElement>(null);
  const zoneAmpoules = useRef<HTMLDivElement>(null);
  const flecheG = useRef<HTMLDivElement>(null);
  const flecheD = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  /* ---- préférences locales (mode animateur, chansons déjà tirées) ---- */
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(cle) ?? "null");
      if (s) setPrefs((p) => ({ ...p, ...s }));
    } catch {}
    try {
      setPerso(listeValide(JSON.parse(localStorage.getItem(cleListe) ?? "null")));
    } catch {}
  }, [cle, cleListe]);
  const majPrefs = useCallback(
    (f: (p: Prefs) => Prefs) =>
      setPrefs((p) => {
        const n = f(p);
        try {
          localStorage.setItem(cle, JSON.stringify(n));
        } catch {}
        return n;
      }),
    [cle],
  );

  const afficherToast = useCallback((m: string) => {
    setToast(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const enregistrerListe = (l: Liste | null) => {
    try {
      if (l) localStorage.setItem(cleListe, JSON.stringify(l));
      else localStorage.removeItem(cleListe);
    } catch {
      afficherToast("Impossible d'enregistrer dans ce navigateur (navigation privée ?)");
    }
    setPerso(l);
    rot.current = 0; // le nombre de tranches a pu changer : on repart d'une tranche bien alignée
    majPrefs((p) => ({ ...p, tirees: [] }));
    setEditeur(false);
    afficherToast(l ? `Liste enregistrée : ${l.chansons.length} chansons` : "Liste initiale du site rétablie");
  };

  /* ---- rendu 3D (impératif, 60 i/s pendant la rotation) ---- */
  const dessiner = useCallback(() => {
    if (tambour.current) tambour.current.style.transform = `translateZ(${-R}px) rotateX(${rot.current}deg)`;
    faces.current.forEach((f, i) => {
      if (!f) return;
      const a = ((((rot.current - i * STEP) % 360) + 540) % 360) - 180;
      const k = Math.max(0, Math.cos((a * Math.PI) / 180));
      f.style.filter = `brightness(${(0.25 + 0.75 * k).toFixed(3)})`;
    });
  }, [R, STEP]);
  useLayoutEffect(dessiner, [dessiner]);

  /* ---- taille responsive + ampoules du cadre ---- */
  useEffect(() => {
    const dimensionner = () => setH(Math.round(Math.max(52, Math.min(96, innerHeight * 0.105))));
    dimensionner();
    addEventListener("resize", dimensionner);
    return () => removeEventListener("resize", dimensionner);
  }, []);
  useEffect(() => {
    const el = zoneAmpoules.current;
    if (!el) return;
    const placer = () => {
      const w = el.clientWidth, h = el.clientHeight, per = 2 * (w + h), n = Math.round(per / 34);
      setAmpoules(
        Array.from({ length: n }, (_, k) => {
          const d = (k * per) / n;
          if (d < w) return { x: d, y: 0 };
          if (d < w + h) return { x: w, y: d - w };
          if (d < 2 * w + h) return { x: w - (d - w - h), y: h };
          return { x: 0, y: h - (d - 2 * w - h) };
        }),
      );
    };
    const ro = new ResizeObserver(placer);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ---- tirage ---- */
  const coup = () => {
    for (const r of [flecheG, flecheD]) {
      r.current?.classList.add("kick");
      setTimeout(() => r.current?.classList.remove("kick"), 60);
    }
  };

  const celebrer = useCallback((joyeuse: boolean) => {
    fanfare(joyeuse);
    if (canvas.current) confettis(canvas.current, COULEURS);
  }, []);

  const tourner = useCallback(() => {
    if (enCours) return;
    audio();
    const candidats = chansons.map((_, i) => i).filter((i) => !(prefs.retirer && prefs.tirees.includes(i)));
    if (!candidats.length) {
      afficherToast("Toutes les chansons ont été tirées — « Remettre en jeu »");
      return;
    }
    const cible = candidats[Math.floor(Math.random() * candidats.length)];
    const depart = rot.current;
    let fin = Math.ceil(depart / 360) * 360 + cible * STEP;
    while (fin <= depart) fin += 360;
    fin += 360 * (4 + Math.floor(Math.random() * 3));
    const duree = 5200 + Math.random() * 1800;
    const t0 = performance.now();
    const ease = (x: number) => 1 - Math.pow(1 - x, 4);
    let cran = Math.floor((depart + STEP / 2) / STEP);

    setEnCours(true);
    const frame = (now: number) => {
      const p = Math.min(1, (now - t0) / duree);
      rot.current = depart + (fin - depart) * ease(p);
      const c = Math.floor((rot.current + STEP / 2) / STEP);
      if (c !== cran) {
        cran = c;
        tick();
        coup();
      }
      dessiner();
      if (p < 1) return void requestAnimationFrame(frame);
      rot.current = fin % 360;
      dessiner();
      setEnCours(false);
      setTimeout(() => {
        const ch = chansons[cible];
        if (prefs.retirer && !prefs.tirees.includes(cible)) majPrefs((p) => ({ ...p, tirees: [...p.tirees, cible] }));
        setResultat({ chanson: ch, type: "tirage" });
        celebrer(prefs.animateur ? ch.vraie : true);
      }, 350);
    };
    requestAnimationFrame(frame);
  }, [enCours, chansons, prefs, STEP, dessiner, majPrefs, celebrer, afficherToast]);

  const lancement = () => {
    if (!lancementCh) return;
    audio();
    setResultat({ chanson: lancementCh, type: "lancement" });
    celebrer(true);
  };

  const pleinEcran = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      afficherToast("Plein écran indisponible dans ce navigateur");
    }
  };

  const basculerAdmin = useCallback(() => majPrefs((p) => ({ ...p, admin: !p.admin })), [majPrefs]);

  /* ---- clavier : Espace = tourner / fermer, Échap = fermer, A = afficher / masquer l'admin ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null;
      if (editeur || karaoke || cible?.closest("input, textarea, select, [contenteditable]")) return;
      if (e.code === "KeyA" && !e.ctrlKey && !e.metaKey && !e.altKey) basculerAdmin();
      if (e.code === "Space") {
        e.preventDefault();
        if (resultat) setResultat(null);
        else tourner();
      }
      if (e.key === "Escape") setResultat(null);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [resultat, tourner, editeur, karaoke, basculerAdmin]);

  return (
    <div className="ecran" style={{ ["--H" as string]: `${H}px`, ["--R" as string]: `${R}px` }}>
      <header>
        <h1>🎵 {roue.titre}</h1>
        {lancementCh && (
          <button className="btn launch" onClick={lancement} title="Chanson de lancement">
            🎤 Lancement
          </button>
        )}
        <button className="btn" onClick={pleinEcran}>
          ⛶ Plein écran
        </button>
        {prefs.admin && (
          <div className="admin" aria-label="Réglages de l'animateur">
            <button
              className={`btn ${prefs.animateur ? "on" : ""}`}
              onClick={() => majPrefs((p) => ({ ...p, animateur: !p.animateur }))}
              title="Affiche ★ sur les vraies possibilités (à couper pendant la projection)"
            >
              👁 Mode animateur
            </button>
            <button
              className={`btn ${prefs.retirer ? "on" : ""}`}
              onClick={() => majPrefs((p) => ({ ...p, retirer: !p.retirer }))}
              title="Une chanson tirée est grisée et ne peut plus sortir"
            >
              ⛔ Retirer les tirées
            </button>
            <button
              className="btn"
              onClick={() => {
                majPrefs((p) => ({ ...p, tirees: [] }));
                afficherToast("Toutes les chansons sont remises en jeu");
              }}
            >
              ↺ Remettre en jeu
            </button>
            <button className="btn" onClick={() => setEditeur(true)} title="Choisir les chansons, ou tout refaire">
              ✏️ Chansons{perso ? " •" : ""}
            </button>
          </div>
        )}
        <button
          className={`btn admin-toggle ${prefs.admin ? "" : "discret"}`}
          onClick={basculerAdmin}
          title={prefs.admin ? "Masquer les réglages pendant la partie (touche A)" : "Afficher les réglages (touche A)"}
          aria-label={prefs.admin ? "Masquer les réglages" : "Afficher les réglages"}
          aria-expanded={prefs.admin}
        >
          {prefs.admin ? "⚙ Masquer" : "⚙"}
        </button>
      </header>

      <main>
        <div className={`frame ${enCours ? "spinning" : ""}`} ref={cadre}>
          <div className="bulbs" ref={zoneAmpoules}>
            {ampoules.map((b, k) => (
              <i key={k} className={`bulb ${k % 2 ? "alt" : "alt2"}`} style={{ left: b.x, top: b.y }} />
            ))}
          </div>
          <div className="window">
            <div
              className="drum"
              ref={tambour}
              onClick={tourner}
              style={{ transform: `translateZ(${-R}px) rotateX(0deg)` }}
            >
              {chansons.map((c, i) => {
                const coul = COULEURS[i % COULEURS.length];
                const sortie = prefs.tirees.includes(i);
                return (
                  <div
                    key={i}
                    ref={(el) => {
                      faces.current[i] = el;
                    }}
                    className={`face ${CLAIRES.has(coul) ? "dark" : ""} ${sortie ? "out" : ""}`}
                    style={{ ["--c" as string]: coul, transform: `rotateX(${-i * STEP}deg) translateZ(${R}px)` }}
                  >
                    <div className="ph" style={{ background: CLAIRES.has(coul) ? "#a77d00" : "rgba(0,0,0,.35)" }}>
                      <Avatar c={c} key={photoUrl(c)} />
                    </div>
                    <div className="tx">
                      <div className="ar">{c.artiste}</div>
                      <div className="ti">{c.titre}</div>
                    </div>
                    {prefs.animateur && c.vraie && <span className="star">★</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="selband" />
          <div className="ptr l" ref={flecheG} />
          <div className="ptr r" ref={flecheD} />
        </div>
        <button className="spin" onClick={tourner} disabled={enCours}>
          TOURNER !
        </button>
        <div className="hint">Barre d&apos;espace ou clic sur la roue pour lancer</div>
      </main>

      {resultat && (
        <div className="modal" onClick={(e) => e.target === e.currentTarget && setResultat(null)}>
          <div className="card">
            <div className="pre">{resultat.type === "lancement" ? "🎤 Pour commencer…" : "La roue a choisi…"}</div>
            <div className="ph">
              <Avatar c={resultat.chanson} key={photoUrl(resultat.chanson)} />
            </div>
            <div className="ar">{resultat.chanson.artiste}</div>
            <div className="ti">{resultat.chanson.titre}</div>
            {resultat.type === "tirage" && prefs.animateur && (
              <div className={`badge ${resultat.chanson.vraie ? "ok" : "ko"}`}>
                {resultat.chanson.vraie ? "✅ Vraie possibilité" : "❌ Fausse piste"}
              </div>
            )}
            <div className="row">
              <button
                className="btn kara"
                onClick={() => {
                  setKaraoke(resultat.chanson);
                  setResultat(null);
                }}
              >
                🎤 Lancer le karaoké
              </button>
              <button className="btn" onClick={() => setResultat(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {editeur && (
        <Editeur
          actuelle={{ chansons, lancement: lancementCh }}
          initiale={{ chansons: roue.chansons, lancement: roue.lancement }}
          personnalisee={!!perso}
          onEnregistrer={enregistrerListe}
          onFermer={() => setEditeur(false)}
        />
      )}

      {karaoke && <Karaoke chanson={karaoke} onFermer={() => setKaraoke(null)} />}

      {toast && <div className="toast">{toast}</div>}
      <canvas ref={canvas} className="confetti" />
    </div>
  );
}
