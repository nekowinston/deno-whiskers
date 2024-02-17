import palette from "https://deno.land/x/catppuccin@v1.1.0/palette.json" with {
  type: "json",
};

export type CatppuccinFlavor = keyof typeof palette;
export type CatppuccinFlavorObj = typeof palette.mocha;
export type CatppuccinColor = keyof typeof palette.mocha.colors;

export { palette };
