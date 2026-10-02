const en = {
  app: {
    title: "Pixel War",
    description:
      "Place your pixels, organize your art... Or attack your opponents! All via command line.",
    start: "Join the war",
  },
  canvas: {
    menuTitle: "Pixel War",
    quit: "Quit",
    helpTitle: "How to Play Pixel War",
    helpItems: [
      "Use the terminal input to place pixels by commands.",
      "Example command: /place -x 10 -y 15 -c #ff0000 places a red pixel at coordinates (10, 15).",
      "Use the canvas selector at the top to switch canvases. Read-only canvases can be viewed but not edited.",
      "Use the language switcher to change language anytime.",
      'Click "Quit" to return to the main menu.'
    ],
    helpClose: "Close",
    cursorInfoPlaceholder: "Move the cursor in the area to see coordinates.",
    commandPlaceholder: "/place -x 10 -y 15 -c #ff0000",
    cursorInfoPrefix: "Cursor: x=",
    cursorInfoSeparator: ", y=",
    nukeCommand: "You think you're cool? Skill issue!",
    selectLabel: "Choose a canvas",
    readonlyBadge: "read-only",
    readonlyNotice: "This canvas is read-only: you can look, but not place pixels.",
    loading: "Loading canvases...",
    noCanvas: "No canvas is available right now.",
    notFound: "This canvas doesn't exist or isn't available.",
    backToDefault: "Go to the current canvas",
    loadError: "Couldn't load the canvases.",
    retry: "Retry",
  }
};

export default en;