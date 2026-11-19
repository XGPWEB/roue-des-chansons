"use client";

import { useEffect, useRef, useState } from "react";
import type { Chanson } from "@/data/types";
import { photoUrl } from "@/lib/utils";
import { Avatar } from "./Avatar";

export type Liste = { lancement?: Chanson; chansons: Chanson[] };

type Ligne = Chanson & { id: number };
type Suggestion = { artiste: string; titre: string; photo: string | null };

export const MIN_CHANSONS = 3;
const CONSEILLE = 6;

let compteur = 0;
const ligne = (c: Partial<Chanson> = {}): Ligne => ({ id: ++compteur, artiste: "", titre: "", ...c });

/** Nettoie une chanson (champs vides retirés) */
const propre = ({ artiste, titre, photo, karaoke }: Chanson): Chanson => ({
  artiste: artiste.trim(),
  titre: titre.trim(),
  ...(photo?.trim() ? { photo: photo.trim() } : {}),
  ...(karaoke?.trim() ? { karaoke: karaoke.trim() } : {}),
});

/** Vérifie une liste importée ou relue du navigateur */
export function listeValide(x: unknown): Liste | null {
  if (!x || typeof x !== "object") return null;
  const o = x as { chansons?: unknown; lancement?: unknown };
  if (!Array.isArray(o.chansons)) return null;
  const chansons = o.chansons
    .filter((c): c is Chanson => !!c && typeof c.artiste === "string" && typeof c.titre === "string")
    .map(propre);
  if (chansons.length < MIN_CHANSONS) return null;
  const l = o.lancement as Chanson | undefined;
  const lancement = l && typeof l.artiste === "string" && typeof l.titre === "string" && l.titre.trim() ? l : undefined;
  return { chansons, ...(lancement ? { lancement: propre(lancement) } : {}) };
}

export default function Editeur({
  actuelle,
  initiale,
  personnalisee,
  onEnregistrer,
  onFermer,
}: {
  actuelle: Liste;
  initiale: Liste;
  personnalisee: boolean;
  onEnregistrer: (l: Liste | null) => void;
  onFermer: () => void;
}) {
  const [lignes, setLignes] = useState<Ligne[]>(() => actuelle.chansons.map((c) => ligne(c)));
  const [lancement, setLancement] = useState<Chanson>(actuelle.lancement ?? { artiste: "", titre: "" });
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recherche, setRecherche] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const fichier = useRef<HTMLInputElement>(null);

  /* ---- recherche Deezer (via /api/recherche), avec un petit délai pendant la frappe ---- */
  useEffect(() => {
    const t = q.trim();
    if (t.length < 2) {
      setSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setRecherche(true);
      try {
        const r = await fetch(`/api/recherche?q=${encodeURIComponent(t)}`, { signal: ctrl.signal });
        setSuggestions(r.ok ? await r.json() : []);
      } catch {
        /* recherche annulée ou hors ligne */
      } finally {
        if (!ctrl.signal.aborted) setRecherche(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  const maj = (id: number, champ: Partial<Chanson>) => setLignes((ls) => ls.map((l) => (l.id === id ? { ...l, ...champ } : l)));
  const deplacer = (i: number, d: -1 | 1) =>
    setLignes((ls) => {
      const j = i + d;
      if (j < 0 || j >= ls.length) return ls;
      const n = [...ls];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  const ajouter = (s: Suggestion) =>
    setLignes((ls) => [...ls, ligne({ artiste: s.artiste, titre: s.titre, ...(s.photo ? { photo: s.photo } : {}) })]);
  const melanger = () =>
    setLignes((ls) => {
      const n = [...ls];
      for (let i = n.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [n[i], n[j]] = [n[j], n[i]];
      }
      return n;
    });

  const remplies = lignes.filter((l) => l.artiste.trim() && l.titre.trim());
  const incompletes = lignes.length - remplies.length;

  const enregistrer = () => {
    if (incompletes) return setErreur(`${incompletes} ligne(s) sans artiste ou sans titre : complétez-les ou supprimez-les.`);
    if (remplies.length < MIN_CHANSONS) return setErreur(`Il faut au moins ${MIN_CHANSONS} chansons pour faire tourner la roue.`);
    const lanc = lancement.titre.trim() ? propre(lancement) : undefined;
    onEnregistrer({ chansons: remplies.map(propre), ...(lanc ? { lancement: lanc } : {}) });
  };

  const exporter = () => {
    const l = { chansons: lignes.map(propre), lancement };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(l, null, 2)], { type: "application/json" }));
    a.download = "roue-chansons.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importer = async (f?: File) => {
    if (!f) return;
    try {
      const l = listeValide(JSON.parse(await f.text()));
      if (!l) throw new Error();
      setLignes(l.chansons.map((c) => ligne(c)));
      setLancement(l.lancement ?? { artiste: "", titre: "" });
      setErreur(null);
    } catch {
      setErreur("Fichier non reconnu : il faut un export de la roue (.json).");
    }
  };

  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onFermer()}>
      <div className="editeur" role="dialog" aria-label="Modifier les chansons">
        <div className="ed-tete">
          <h2>✏️ Chansons de la roue</h2>
          <button className="btn" onClick={onFermer} aria-label="Fermer">
            ✕
          </button>
        </div>

        <div className="ed-corps">
          <section>
            <label className="ed-label" htmlFor="ed-q">
              Rechercher une chanson
            </label>
            <input
              id="ed-q"
              className="champ"
              placeholder="Artiste ou titre… (ex. « Stromae », « Les lacs du Connemara »)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
            {(recherche || suggestions.length > 0 || q.trim().length >= 2) && (
              <ul className="ed-sugg">
                {recherche && !suggestions.length && <li className="ed-vide">Recherche…</li>}
                {!recherche && !suggestions.length && <li className="ed-vide">Aucun résultat</li>}
                {suggestions.map((s) => (
                  <li key={`${s.artiste}|${s.titre}`}>
                    <span className="ph mini">
                      <Avatar c={{ artiste: s.artiste, titre: s.titre, photo: s.photo ?? undefined }} key={s.photo ?? s.artiste} />
                    </span>
                    <span className="ed-nom">
                      <b>{s.titre}</b>
                      <small>{s.artiste}</small>
                    </span>
                    <button className="btn petit" onClick={() => ajouter(s)}>
                      + Ajouter
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="ed-label">
              Tranches de la roue{" "}
              <span className={remplies.length < CONSEILLE ? "ed-alerte" : "ed-info"}>
                {remplies.length} chanson(s)
                {remplies.length < CONSEILLE && ` · ${CONSEILLE} ou plus conseillées`}
              </span>
            </div>
            {lignes.length === 0 && <p className="ed-vide">Liste vide : ajoutez des chansons avec la recherche ou « + Ligne vide ».</p>}
            <ol className="ed-liste">
              {lignes.map((l, i) => (
                <li key={l.id}>
                  <span className="ed-num" title="Numéro à taper au clavier pour forcer le tirage">
                    {i + 1}
                  </span>
                  <span className="ph mini">
                    <Avatar c={l} key={photoUrl(l)} />
                  </span>
                  <input className="champ" placeholder="Artiste" value={l.artiste} onChange={(e) => maj(l.id, { artiste: e.target.value })} />
                  <input className="champ" placeholder="Titre" value={l.titre} onChange={(e) => maj(l.id, { titre: e.target.value })} />
                  <span className="ed-actions">
                    <button className="btn petit" onClick={() => deplacer(i, -1)} disabled={i === 0} aria-label="Monter">
                      ↑
                    </button>
                    <button className="btn petit" onClick={() => deplacer(i, 1)} disabled={i === lignes.length - 1} aria-label="Descendre">
                      ↓
                    </button>
                    <button className="btn petit" onClick={() => setLignes((ls) => ls.filter((x) => x.id !== l.id))} aria-label="Supprimer">
                      🗑
                    </button>
                  </span>
                  <details className="ed-plus">
                    <summary>Photo et lien karaoké</summary>
                    <input
                      className="champ"
                      placeholder="URL de la photo (vide = photo trouvée automatiquement)"
                      value={l.photo ?? ""}
                      onChange={(e) => maj(l.id, { photo: e.target.value })}
                    />
                    <input
                      className="champ"
                      placeholder="Lien YouTube du karaoké (vide = vidéo trouvée automatiquement)"
                      value={l.karaoke ?? ""}
                      onChange={(e) => maj(l.id, { karaoke: e.target.value })}
                    />
                  </details>
                </li>
              ))}
            </ol>
            <div className="row gauche">
              <button className="btn" onClick={() => setLignes((ls) => [...ls, ligne()])}>
                + Ligne vide
              </button>
              <button className="btn" onClick={melanger} disabled={lignes.length < 2}>
                🔀 Mélanger
              </button>
            </div>
          </section>

          <section>
            <div className="ed-label">Chanson de lancement (bouton « 🎤 Lancement », facultatif)</div>
            <div className="ed-lancement">
              <input
                className="champ"
                placeholder="Artiste"
                value={lancement.artiste}
                onChange={(e) => setLancement((l) => ({ ...l, artiste: e.target.value }))}
              />
              <input
                className="champ"
                placeholder="Titre (vide = pas de bouton Lancement)"
                value={lancement.titre}
                onChange={(e) => setLancement((l) => ({ ...l, titre: e.target.value }))}
              />
            </div>
          </section>

          <section>
            <div className="ed-label">Repartir de…</div>
            <div className="row gauche">
              <button
                className="btn"
                onClick={() => {
                  setLignes(initiale.chansons.map((c) => ligne(c)));
                  setLancement(initiale.lancement ?? { artiste: "", titre: "" });
                }}
              >
                ↺ La liste initiale
              </button>
              <button
                className="btn"
                onClick={() => {
                  if (!lignes.length || confirm("Vider toute la liste pour repartir de zéro ?")) {
                    setLignes([]);
                    setLancement({ artiste: "", titre: "" });
                  }
                }}
              >
                🧹 Zéro (tout refaire)
              </button>
              <button className="btn" onClick={exporter}>
                ⬇ Exporter
              </button>
              <button className="btn" onClick={() => fichier.current?.click()}>
                ⬆ Importer
              </button>
              <input ref={fichier} type="file" accept="application/json,.json" hidden onChange={(e) => importer(e.target.files?.[0])} />
            </div>
            <p className="ed-note">
              La liste est enregistrée dans ce navigateur uniquement. Pour la soirée sur un autre ordinateur : Exporter ici, puis Importer
              là-bas.
            </p>
          </section>
        </div>

        <div className="ed-pied">
          {erreur && <span className="ed-alerte">{erreur}</span>}
          {personnalisee && (
            <button
              className="btn"
              onClick={() => confirm("Abandonner votre liste et revenir à la liste initiale du site ?") && onEnregistrer(null)}
              title="Supprime la liste enregistrée dans ce navigateur"
            >
              Revenir au site d&apos;origine
            </button>
          )}
          <button className="btn" onClick={onFermer}>
            Annuler
          </button>
          <button className="btn on" onClick={enregistrer}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
