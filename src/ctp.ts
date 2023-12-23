import palette from "https://raw.githubusercontent.com/catppuccin/palette/feat/rewrite/palette.json" with {
  type: "json",
};

export type CatppuccinFlavor = keyof typeof palette;
export type CatppuccinColor = keyof typeof palette.mocha.colors;

export { palette };
