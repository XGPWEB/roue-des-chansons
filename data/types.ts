export type Chanson = {
  artiste: string;
  titre: string;
  /** true = vraie possibilité ; false = fausse piste */
  vraie: boolean;
  /** Chemin d'une photo dans /public (ex. "/photos/stromae.jpg"). Par défaut : /photos/<artiste-en-slug>.jpg */
  photo?: string;
  /** Lien direct vers la version karaoké choisie. Par défaut : recherche YouTube « artiste titre karaoké » */
  karaoke?: string;
};

export type RoueConfig = {
  /** Identifiant d'URL : /<slug> */
  slug: string;
  titre: string;
  /** Chanson d'ouverture (bouton « Lancement ») */
  lancement?: Omit<Chanson, "vraie">;
  /** Tranches de la roue (12 recommandées, 6 minimum) */
  chansons: Chanson[];
};
