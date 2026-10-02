const de = {
  app: {
    title: "Pixelkrieg",
    description:
      "Platziere deine Pixel, organisiere deine Kunst... Oder greife deine Gegner an! Alles über die Befehlszeile.",
    start: "Dem Krieg beitreten",
  },
  canvas: {
    menuTitle: "Pixelkrieg",
    quit: "Beenden",
    helpTitle: "Wie man Pixelkrieg spielt",
    helpItems: [
      "Verwenden Sie die Terminal-Eingabe, um Pixel per Befehl zu platzieren.",
      "Beispielbefehl: /place -x 10 -y 15 -c #ff0000 platziert einen roten Pixel bei den Koordinaten (10, 15).",
      "Verwenden Sie die Auswahl oben, um die Leinwand zu wechseln. Schreibgeschützte Leinwände können angesehen, aber nicht bearbeitet werden.",
      "Verwenden Sie den Sprachwechsler, um jederzeit die Sprache zu ändern.",
      'Klicken Sie auf "Beenden", um zum Hauptmenü zurückzukehren.'
    ],
    helpClose: "Schließen",
    cursorInfoPlaceholder: "Bewegen Sie den Cursor in der Zone, um Koordinaten zu sehen.",
    commandPlaceholder: "/place -x 10 -y 15 -c #ff0000",
    cursorInfoPrefix: "Cursor: x=",
    cursorInfoSeparator: ", y=",
    nukeCommand: "Du glaubst dir cool zu sein? Skill issue!",
    selectLabel: "Leinwand wählen",
    readonlyBadge: "schreibgeschützt",
    readonlyNotice: "Diese Leinwand ist schreibgeschützt: Sie können sie ansehen, aber keine Pixel platzieren.",
    loading: "Leinwände werden geladen...",
    noCanvas: "Derzeit ist keine Leinwand verfügbar.",
    notFound: "Diese Leinwand existiert nicht oder ist nicht verfügbar.",
    backToDefault: "Zur aktuellen Leinwand",
    loadError: "Die Leinwände konnten nicht geladen werden.",
    retry: "Erneut versuchen",
  }
};

export default de;