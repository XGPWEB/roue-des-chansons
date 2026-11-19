# 🎵 La Roue des Chansons

Roue de tirage au sort verticale, en tambour façon jeu télévisé, pour les animations karaoké.
Elle propose un mode animateur (vraies et fausses pistes), le retrait des chansons déjà tirées, une chanson de lancement, le karaoké lu directement dans l'application, le plein écran, les photos des artistes et un éditeur pour changer les chansons ou tout refaire depuis le site.

Stack : **Next.js 16 (App Router) · React 19 · TypeScript**. Le site est statique, sans base de données ; trois petites routes serveur interrogent Deezer (`/api/photo`, `/api/recherche`, sans clé) et YouTube (`/api/karaoke`, clé `YOUTUBE_API_KEY`). Il est déployé sur **Vercel**.

## Développer en local

```bash
npm install
cp .env.example .env.local   # puis y mettre les vraies possibilités
npm run dev        # http://localhost:3000
```

| Je veux… | Fichier |
|---|---|
| Changer la liste **initiale** (celle que tout le monde voit) | `data/roues.ts` |
| Changer les chansons pour une soirée, sans toucher au code | sur le site : ⚙ → **✏️ Chansons** (voir plus bas) |
| Choisir les vraies possibilités (les autres sont des fausses pistes) | variable `VRAIES_CHANSONS` : `.env.local` en local, *Settings → Environment Variables* sur Vercel. Jamais dans le code, car le dépôt est public. Après un changement sur Vercel, redéployer |
| Ajouter une autre roue (accessible sur `/<slug>`) | `data/roues.ts` : dupliquer un bloc |
| Remplacer une photo d'artiste | champ `photo: "https://…"` (ou `"/photos/x.jpg"` déposé dans `public/photos/`) |
| Fixer la vidéo karaoké d'une chanson | champ `karaoke: "https://youtu.be/…"`, ou dans l'éditeur du site (« Photo et lien karaoké ») |
| Activer la recherche automatique des vidéos karaoké | variable `YOUTUBE_API_KEY` (voir plus bas) |
| Modifier le design | `app/globals.css` |
| Modifier le comportement de la roue | `components/Roue.tsx` |

Les photos des artistes sont trouvées automatiquement sur Deezer à partir de l'artiste et du titre. Si aucune n'est trouvée (ou sans internet), la roue affiche les initiales. Le bouton « 🎤 Lancer le karaoké » lit la vidéo dans l'application, sans aller sur YouTube : d'abord le lien `karaoke` s'il y en a un, sinon les vidéos trouvées par la recherche « artiste titre karaoké ». Si une vidéo refuse d'être lue hors de YouTube, la suivante est essayée ; « ⏭ Autre version » permet aussi de changer.

### Clé YouTube (recherche des vidéos karaoké)

1. [console.cloud.google.com](https://console.cloud.google.com) → créer un projet.
2. *APIs et services → Bibliothèque* → **YouTube Data API v3** → *Activer*.
3. *Identifiants → Créer des identifiants → Clé API*, puis *Restreindre la clé* à « YouTube Data API v3 ».
4. La mettre dans `.env.local` (`YOUTUBE_API_KEY=…`) et sur Vercel, puis redéployer.

Gratuit : environ 100 recherches par jour. Chaque chanson n'est cherchée qu'une fois par mois grâce au cache. Sans clé, seuls les liens collés dans l'éditeur sont lus.

## Mettre en production

**Une seule fois :** sur vercel.com, cliquez sur *Add New → Project*, importez ce dépôt GitHub, puis cliquez sur *Deploy* (Vercel détecte Next.js automatiquement).

**Ensuite :**

```bash
git add -A && git commit -m "Nouvelles chansons" && git push   # → mise en production automatique
```

Toute branche autre que `main` obtient une URL de prévisualisation, ce qui permet de tester avant de passer en production.

## Utilisation pendant la soirée

- **Espace** : tourner la roue ou fermer le résultat. **Échap** : fermer.
- **⚙ Masquer** (ou touche **A**) : cache les réglages de l'animateur pendant la partie. Il ne reste qu'un ⚙ presque invisible en haut à droite pour les réafficher.
- **Mode animateur** : affiche ★ sur les vraies possibilités et le badge « Vraie / Fausse piste ». À couper avant de projeter (masquer les réglages ne le coupe pas).
- **✏️ Chansons** : rechercher et ajouter des chansons (vraie ou fausse), modifier, réordonner, mélanger, supprimer, changer la chanson de lancement, repartir de la liste initiale ou de zéro. Un point « • » signale une liste modifiée.
- La liste modifiée et les réglages sont mémorisés **dans le navigateur utilisé** uniquement. Pour préparer la soirée sur un autre ordinateur : *Exporter* puis *Importer* le fichier `.json`.
- Plan B sans internet : `npm run build && npm run start` sur le portable de la soirée (le karaoké, les photos et la recherche de chansons ont besoin du réseau ; sans réseau, la roue affiche les initiales).

## Après l'événement

Vercel → projet → *Settings* → *Delete Project*. Le code reste sur GitHub.
