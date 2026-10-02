const fr = {
  app: {
    title: "Guerre des Pixels",
    description:
      "Placez vos pixels, organisez vous pour créer vos arts... Ou attaquez vos adversaires! Tout cela, en ligne de commande.",
    start: "Rejoindre la guerre",
  },
  canvas: {
    menuTitle: "Guerre des Pixels",
    quit: "Quitter",
    helpTitle: "Comment jouer à la Guerre des Pixels",
    helpItems: [
      "Utilisez l'entrée terminal pour placer des pixels avec des commandes.",
      "Exemple : /place -x 10 -y 15 -c #ff0000 place un pixel rouge aux coordonnées (10, 15).",
      "Utilisez le sélecteur en haut pour changer de canvas. Les canvas en lecture seule peuvent être consultés mais pas modifiés.",
      "Utilisez le sélecteur de langue pour changer la langue à tout moment.",
      'Cliquez sur "Quitter" pour revenir au menu principal.'
    ],
    helpClose: "Fermer",
    cursorInfoPlaceholder: "Bouger le curseur dans la zone pour voir les coordonnées.",
    commandPlaceholder: "/place -x 10 -y 15 -c #ff0000",
    cursorInfoPrefix: "Curseur : x=",
    cursorInfoSeparator: ", y=",
    nukeCommand: "Tu te crois marrant ? Skill issue !",
    selectLabel: "Choisir un canvas",
    readonlyBadge: "lecture seule",
    readonlyNotice: "Ce canvas est en lecture seule : vous pouvez le regarder, mais pas y placer de pixels.",
    loading: "Chargement des canvas...",
    noCanvas: "Aucun canvas n'est disponible pour le moment.",
    notFound: "Ce canvas n'existe pas ou n'est pas disponible.",
    backToDefault: "Aller au canvas actuel",
    loadError: "Impossible de charger les canvas.",
    retry: "Réessayer",
  }
};

export default fr;