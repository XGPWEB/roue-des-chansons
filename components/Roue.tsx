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
/** Largeur d'une tranche par rapport à sa hauteur */
const RATIO = 6.5;

type Resultat = { chanson: Chanson; type: "tirage" | "lancement" };
/** triche = l'animateur peut choisir la prochaine chanson ; sinon tirage vraiment au hasard.
 *  retirer = ne pas répéter les chansons déjà tirées ; masque = header masqué pendant la partie */
type Prefs = { triche: boolean; retirer: boolean; tirees: number[]; masque: boolean };

export default function Roue({ roue }: { roue: RoueConfig }) {
  const cle = `roue:${roue.slug}`;
  const cleListe = `${cle}:liste`;

  /* ---- liste de chansons : celle du site, ou celle modifiée dans ce navigateur ---- */
  const [perso, setPerso] = useState<Liste | null>(null);
  const [editeur, setEditeur] = useState(false);
  const [karaoke, setKaraoke] = useState<Chanson | null>(null);
  const chansons = perso?.chansons ?? roue.chansons;
  const lancementCh = perso ? perso.lancement : roue.lancement;
  const N = chansons.length;
  const STEP = 360 / N;

  const [prefs, setPrefs] = useState<Prefs>({ triche: false, retirer: false, tirees: [], masque: false });
  const [menu, setMenu] = useState(false);
  /** Mode triche : index de la chanson qui sortira au prochain tirage (null = hasard). Jamais affiché sur la roue. */
  const [forcee, setForcee] = useState<number | null>(null);
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
  const saisie = useRef({ texte: "", timer: undefined as ReturnType<typeof setTimeout> | undefined });

  /* ---- préférences locales (ne pas répéter, chansons déjà tirées, header masqué) ---- */
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(cle) ?? "null");
      if (s) setPrefs((p) => ({ ...p, triche: !!s.triche, retirer: !!s.retirer, tirees: Array.isArray(s.tirees) ? s.tirees : [], masque: !!s.masque }));
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

  const afficherToast = useCallback((m: string, duree = 2600) => {
    setToast(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), duree);
  }, []);

  const enregistrerListe = (l: Liste | null) => {
    try {
      if (l) localStorage.setItem(cleListe, JSON.stringify(l));
      else localStorage.removeItem(cleListe);
    } catch {
      afficherToast("Impossible d'enregistrer dans ce navigateur (navigation privée ?)");
    }
    setPerso(l);
    setForcee(null);
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
    // La roue occupe tout l'écran disponible : hauteur d'une tranche (H) calculée pour que
    // cadre + bouton + header tiennent en hauteur, et que la roue (largeur = H × RATIO) tienne en largeur.
    const dimensionner = () => {
      const t = Math.tan(Math.PI / N); // hauteur du tambour = H / t
      const { clientWidth: largeur, clientHeight: hauteur } = document.documentElement;
      const parHauteur = (hauteur - 226) / (1 / t + 0.4);
      const parLargeur = (largeur * 0.94 - 70) / RATIO;
      setH(Math.round(Math.max(48, Math.min(260, parHauteur, parLargeur))));
    };
    dimensionner();
    addEventListener("resize", dimensionner);
    return () => removeEventListener("resize", dimensionner);
  }, [N]);
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

  const celebrer = useCallback(() => {
    fanfare();
    if (canvas.current) confettis(canvas.current, COULEURS);
  }, []);

  const tourner = useCallback(() => {
    if (enCours) return;
    audio();
    setMenu(false);
    const candidats = chansons.map((_, i) => i).filter((i) => !(prefs.retirer && prefs.tirees.includes(i)));
    const triche = prefs.triche && forcee !== null && forcee < N ? forcee : null;
    if (triche === null && !candidats.length) {
      afficherToast("Toutes les chansons ont été tirées : ⚙ Animateur → « Tout remettre en jeu »");
      return;
    }
    // Mode triche : la roue tourne exactement comme d'habitude, elle s'arrête simplement sur la chanson choisie
    const cible = triche ?? candidats[Math.floor(Math.random() * candidats.length)];
    setForcee(null);
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
        if (prefs.retirer && !prefs.tirees.includes(cible)) majPrefs((p) => ({ ...p, tirees: [...p.tirees, cible] }));
        setResultat({ chanson: chansons[cible], type: "tirage" });
        celebrer();
      }, 350);
    };
    requestAnimationFrame(frame);
  }, [enCours, chansons, N, prefs, forcee, STEP, dessiner, majPrefs, celebrer, afficherToast]);

  const lancement = () => {
    if (!lancementCh) return;
    audio();
    setMenu(false);
    setResultat({ chanson: lancementCh, type: "lancement" });
    celebrer();
  };

  const pleinEcran = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      afficherToast("Plein écran indisponible dans ce navigateur");
    }
  };

  const basculerMasque = useCallback(() => {
    setMenu(false);
    if (!prefs.masque) afficherToast("Menu masqué. Pour le retrouver : souris en haut de l'écran, ou touche A", 4000);
    majPrefs((p) => ({ ...p, masque: !p.masque }));
  }, [prefs.masque, majPrefs, afficherToast]);

  /* ---- clavier ----
     Espace = tourner / fermer · Échap = fermer · A = masquer / afficher le menu
     Chiffres = mode triche : taper le numéro d'une chanson (1 à N) avant Espace, 0 = retour au hasard. Rien ne s'affiche. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null;
      if (editeur || karaoke || cible?.closest("input, textarea, select, [contenteditable]")) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) {
        if (!prefs.triche) return; // mode « vraiment au hasard » : les chiffres ne font rien
        const s = saisie.current;
        clearTimeout(s.timer);
        s.texte += e.key;
        if (Number(s.texte) > N) s.texte = e.key; // ex. « 15 » sur 12 chansons : on garde « 5 »
        const n = Number(s.texte);
        setForcee(n >= 1 && n <= N ? n - 1 : null);
        s.timer = setTimeout(() => (s.texte = ""), 1200);
        return;
      }
      if (e.code === "KeyA") basculerMasque();
      if (e.code === "Space") {
        e.preventDefault();
        if (resultat) setResultat(null);
        else tourner();
      }
      if (e.key === "Escape") {
        setResultat(null);
        setMenu(false);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [resultat, tourner, editeur, karaoke, basculerMasque, N, prefs.triche]);

  const nbTirees = prefs.tirees.filter((i) => i < N).length;

  return (
    <div className="ecran" style={{ ["--H" as string]: `${H}px`, ["--R" as string]: `${R}px`, ["--W" as string]: `${Math.round(H * RATIO)}px` }}>
      <header className={prefs.masque ? "masque" : ""}>
        <h1>🎵 {roue.titre}</h1>
        <div className="hd-actions">
          <button className="btn hd-plein" onClick={pleinEcran}>
            ⛶ Plein écran
          </button>
          <div className="menu-ancre">
            <button
              className={`btn admin-toggle ${menu ? "on" : ""}`}
              onClick={() => setMenu((m) => !m)}
              aria-expanded={menu}
              aria-haspopup="menu"
              title="Réglages de l'animateur"
            >
              ⚙{prefs.masque ? "" : " Animateur"}
            </button>
            {menu && (
              <>
                <div className="menu-fond" onClick={() => setMenu(false)} />
                <div className="menu" aria-label="Réglages de l'animateur">
                  <section>
                    <h3>Mode de tirage</h3>
                    <div className="menu-modes" role="radiogroup" aria-label="Mode de tirage">
                      <button
                        role="radio"
                        aria-checked={!prefs.triche}
                        className={!prefs.triche ? "on" : ""}
                        onClick={() => {
                          setForcee(null);
                          majPrefs((p) => ({ ...p, triche: false }));
                        }}
                      >
                        🎲 Vraiment au hasard
                      </button>
                      <button
                        role="radio"
                        aria-checked={prefs.triche}
                        className={prefs.triche ? "on" : ""}
                        onClick={() => majPrefs((p) => ({ ...p, triche: true }))}
                      >
                        🎯 Triche
                      </button>
                    </div>
                    {prefs.triche && (
                      <>
                        <h3 className="menu-sous-titre">Prochaine chanson à sortir</h3>
                        <div className="menu-liste">
                          <button className={forcee === null ? "on" : ""} onClick={() => setForcee(null)}>
                            <span className="num">🎲</span> Au hasard pour ce tour
                          </button>
                          {chansons.map((c, i) => (
                            <button
                              key={i}
                              className={forcee === i ? "on" : ""}
                              onClick={() => {
                                setForcee(i);
                                setMenu(false);
                              }}
                            >
                              <span className="num">{i + 1}</span>
                              <span className="menu-nom">
                                {c.titre} <small>{c.artiste}</small>
                              </span>
                            </button>
                          ))}
                        </div>
                        <p className="menu-astuce">
                          Sans ouvrir ce menu : tapez le numéro au clavier, puis Espace. 0 = au hasard. Rien ne s&apos;affiche à l&apos;écran,
                          et le choix ne vaut que pour un tirage.
                        </p>
                      </>
                    )}
                  </section>

                  <section>
                    <label className="menu-interrupteur">
                      <input
                        type="checkbox"
                        checked={prefs.retirer}
                        onChange={() => majPrefs((p) => ({ ...p, retirer: !p.retirer }))}
                      />
                      <span>
                        Ne pas répéter les chansons
                        <small>Une chanson tirée devient grise et ne ressort plus.</small>
                      </span>
                    </label>
                    {(prefs.retirer || nbTirees > 0) && (
                      <div className="menu-ligne">
                        <span>
                          {nbTirees}/{N} déjà tirée{nbTirees > 1 ? "s" : ""}
                        </span>
                        <button
                          className="btn petit"
                          disabled={!nbTirees}
                          onClick={() => {
                            majPrefs((p) => ({ ...p, tirees: [] }));
                            afficherToast("Toutes les chansons sont remises en jeu");
                          }}
                        >
                          ↺ Tout remettre en jeu
                        </button>
                      </div>
                    )}
                  </section>

                  <section className="menu-actions">
                    {lancementCh && (
                      <button className="btn" onClick={lancement} title="Pour démarrer la soirée, sans tourner la roue">
                        🎤 Chanson d&apos;ouverture : {lancementCh.titre}
                      </button>
                    )}
                    <button
                      className="btn"
                      onClick={() => {
                        setMenu(false);
                        setEditeur(true);
                      }}
                    >
                      ✏️ Modifier les chansons{perso ? " (liste perso)" : ""}
                    </button>
                    <button className="btn" onClick={basculerMasque}>
                      {prefs.masque ? "👁 Réafficher le menu en permanence" : "🙈 Masquer le menu pendant la partie"} <kbd>A</kbd>
                    </button>
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
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
