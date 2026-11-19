export type Chanson = {
  artiste: string;
  titre: string;
  /** URL d'une photo, ou chemin dans /public (ex. "/photos/stromae.jpg"). Par défaut : photo de l'artiste sur Deezer */
  photo?: string;
  /** Lien YouTube de la version karaoké. Par défaut : vidéo trouvée par la recherche YouTube */
  karaoke?: string;
};

export type RoueConfig = {
  /** Identifiant d'URL : /<slug> */
  slug: string;
  titre: string;
  /** Chanson d'ouverture (menu ⚙ Animateur → « Jouer la chanson d'ouverture ») */
  lancement?: Chanson;
  /** Tranches de la roue (12 recommandées, 6 minimum) */
  chansons: Chanson[];
};
