# 🎵 La Roue des Chansons

Roue de tirage au sort verticale, en tambour façon jeu télévisé, pour les animations karaoké.
Elle propose un mode triche (choisir discrètement la prochaine chanson), l'option « ne pas répéter les chansons », une chanson d'ouverture, le karaoké lu directement dans l'application, le plein écran, les photos des artistes et un éditeur pour changer les chansons ou tout refaire depuis le site.

Stack : **Next.js 16 (App Router) · React 19 · TypeScript**. Le site est statique, sans base de données ; trois petites routes serveur interrogent Deezer (`/api/photo`, `/api/recherche`, sans clé) et YouTube (`/api/karaoke`, clé `YOUTUBE_API_KEY`). Il est déployé sur **Vercel**.

## Développer en local

```bash
npm install
cp .env.example .env.local   # puis y mettre la clé YouTube
npm run dev        # http://localhost:3000
```

| Je veux… | Fichier |
|---|---|
| Changer la liste **initiale** (celle que tout le monde voit) | `data/roues.ts` |
| Changer les chansons pour une soirée, sans toucher au code | sur le site : **⚙ Animateur → ✏️ Modifier les chansons** (voir plus bas) |
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
- **⚙ Animateur** (en haut à droite) ouvre le menu de l'animateur :
  - **Mode de tirage** : **🎲 Vraiment au hasard** (par défaut, aucune triche possible) ou **🎯 Triche**. En mode Triche, cliquer sur une chanson pour qu'elle sorte au prochain tour : la roue tourne normalement et s'arrête dessus. Le choix ne vaut que pour un tirage.
  - **Ne pas répéter les chansons** : une chanson tirée devient grise et ne ressort plus ; « ↺ Tout remettre en jeu » les remet toutes.
  - **🎤 Chanson d'ouverture** : joue la chanson prévue pour démarrer la soirée, sans tourner la roue.
  - **✏️ Modifier les chansons** : rechercher et ajouter des chansons, modifier, réordonner, mélanger, supprimer, changer la chanson d'ouverture, repartir de la liste initiale ou de zéro.
  - **🙈 Masquer le menu pendant la partie** (ou touche **A**) : seul un ⚙ discret reste visible ; tout réapparaît quand la souris passe en haut de l'écran.
- **Triche au clavier, invisible** (mode Triche uniquement) : taper le numéro d'une chanson (1, 2… 12, numéros visibles dans le menu et dans l'éditeur), puis Espace. **0** = retour au hasard. Rien ne s'affiche à l'écran.
- La liste modifiée et les réglages sont mémorisés **dans le navigateur utilisé** uniquement. Pour préparer la soirée sur un autre ordinateur : *Exporter* puis *Importer* le fichier `.json`.
- Plan B sans internet : `npm run build && npm run start` sur le portable de la soirée (le karaoké, les photos et la recherche de chansons ont besoin du réseau ; sans réseau, la roue affiche les initiales).

## Après l'événement

Vercel → projet → *Settings* → *Delete Project*. Le code reste sur GitHub.
