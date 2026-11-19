import Link from "next/link";
import { redirect } from "next/navigation";
import { roues } from "@/data/roues";

export default function Accueil() {
  // Une seule roue : on y va directement
  if (roues.length === 1) redirect(`/${roues[0].slug}`);

  return (
    <main className="accueil">
      <h1>🎵 Mes roues</h1>
      <ul>
        {roues.map((r) => (
          <li key={r.slug}>
            <Link href={`/${r.slug}`}>
              {r.titre} <span>— {r.chansons.length} tranches</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
