"use client";

import { useEffect, useRef, useState } from "react";
import type { Chanson } from "@/data/types";
import { initiales, photoUrl } from "@/lib/utils";

/** Photo de l'artiste ; les initiales restent dessous et apparaissent si la photo est introuvable.
 *  Donner `key={photoUrl(c)}` à l'appel pour réessayer quand la photo change. */
export function Avatar({ c }: { c: Pick<Chanson, "artiste" | "titre" | "photo"> }) {
  const [ok, setOk] = useState(true);
  const img = useRef<HTMLImageElement>(null);
  // L'image rendue côté serveur peut échouer avant l'hydratation : onError ne se déclenche alors jamais.
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setOk(false);
  }, []);
  return (
    <>
      <span className="ini">{initiales(c.artiste)}</span>
      {ok && c.artiste.trim() && (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={img} src={photoUrl(c)} alt="" decoding="async" onError={() => setOk(false)} />
      )}
    </>
  );
}
