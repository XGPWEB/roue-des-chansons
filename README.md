# 🎵 La Roue des Chansons

Roue de tirage au sort verticale, en tambour façon jeu télévisé, pour les animations karaoké.
Elle propose un mode animateur (vraies et fausses pistes), le retrait des chansons déjà tirées, une chanson de lancement, l'accès au karaoké en un clic et le plein écran.

Stack : **Next.js 16 (App Router) · React 19 · TypeScript**. Le site est 100 % statique, sans base de données. Il est déployé sur **Vercel**.

## Développer en local

```bash
npm install
cp .env.example .env.local   # puis y mettre les vraies possibilités
npm run dev        # http://localhost:3000
```

| Je veux… | Fichier |
|---|---|
| Changer les chansons et la chanson de lancement | `data/roues.ts` |
| Choisir les vraies possibilités (les autres sont des fausses pistes) | variable `VRAIES_CHANSONS` : `.env.local` en local, *Settings → Environment Variables* sur Vercel. Jamais dans le code, car le dépôt est public. Après un changement sur Vercel, redéployer |
| Ajouter une autre roue (accessible sur `/<slug>`) | `data/roues.ts` : dupliquer un bloc |
| Ajouter les photos des artistes | `public/photos/` (voir `LISEZ-MOI.txt`) |
| Fixer un lien karaoké précis | champ `karaoke: "https://…"` de la chanson |
| Modifier le design | `app/globals.css` |
| Modifier le comportement de la roue | `components/Roue.tsx` |

Sans photo, la roue affiche les initiales. Sans lien `karaoke`, le bouton ouvre une recherche YouTube « artiste titre karaoké ».

## Mettre en production

**Une seule fois :** sur vercel.com, cliquez sur *Add New → Project*, importez ce dépôt GitHub, puis cliquez sur *Deploy* (Vercel détecte Next.js automatiquement).

**Ensuite :**

```bash
git add -A && git commit -m "Nouvelles chansons" && git push   # → mise en production automatique
```

Toute branche autre que `main` obtient une URL de prévisualisation, ce qui permet de tester avant de passer en production.

## Utilisation pendant la soirée

- **Espace** : tourner la roue ou fermer le résultat. **Échap** : fermer.
- **Mode animateur** : affiche ★ sur les vraies possibilités et le badge « Vraie / Fausse piste ». À couper avant de projeter.
- Les réglages (mode animateur, chansons tirées) sont mémorisés dans le navigateur utilisé.
- Plan B sans internet : `npm run build && npm run start` sur le portable de la soirée (seul le karaoké a besoin du réseau).

## Après l'événement

Vercel → projet → *Settings* → *Delete Project*. Le code reste sur GitHub.
