import titleCase from "https://deno.land/x/case@2.2.0/titleCase.ts";
import tinycolor from "https://esm.sh/v135/tinycolor2@1.6.0";
import Handlebars from "npm:handlebars";

Handlebars.registerHelper("uppercase", (str) => String(str).toUpperCase());
Handlebars.registerHelper("lowercase", (str) => String(str).toLowerCase());
Handlebars.registerHelper("titlecase", (str) => titleCase(String(str)));
Handlebars.registerHelper(
  "trunc",
  (value: number, fractionDigits: number) =>
    Number(value).toFixed(fractionDigits),
);

Handlebars.registerHelper(
  "lighten",
  (color, amount) => tinycolor(color).lighten(amount).toHex(),
);
Handlebars.registerHelper(
  "darken",
  (color, amount) => tinycolor(color).darken(amount).toHex(),
);
Handlebars.registerHelper(
  "mix",
  (color1, color2, amount) => tinycolor.mix(color1, color2, amount).toHex(),
);
Handlebars.registerHelper(
  "unquote",
  (str) => `{{WHISKERS:UNQUOTE:${str}}}`,
);

Handlebars.registerHelper(
  "rgb",
  (color) => {
    const { r, g, b } = tinycolor(color).toRgb();
    return [r, g, b].join(" ");
  },
);
Handlebars.registerHelper(
  "hsl",
  (color) => tinycolor(color).toHslString(),
);
Handlebars.registerHelper(
  "hsla",
  (color) => {
    const { h, s, l, a } = tinycolor(color).toHsl();
    return `hsla(${[h, s, l, a].join(", ")})`;
  },
);
Handlebars.registerHelper(
  "red_i",
  (color) => tinycolor(color).toRgb().r,
);
Handlebars.registerHelper(
  "green_i",
  (color) => tinycolor(color).toRgb().g,
);
Handlebars.registerHelper(
  "blue_i",
  (color) => tinycolor(color).toRgb().b,
);
Handlebars.registerHelper(
  "red_f",
  (color) => tinycolor(color).toRgb().r / 255,
);
Handlebars.registerHelper(
  "green_f",
  (color) => tinycolor(color).toRgb().g / 255,
);
Handlebars.registerHelper(
  "blue_f",
  (color) => tinycolor(color).toRgb().b / 255,
);
Handlebars.registerHelper(
  "opacity",
  (color, alpha: number) => tinycolor(color).setAlpha(alpha).toHex8(),
);
Handlebars.registerHelper(
  "alpha_i",
  (color) => tinycolor(color).getAlpha(),
);
Handlebars.registerHelper(
  "alpha_f",
  (color: string) => tinycolor(color).getAlpha() / 255,
);
Handlebars.registerHelper(
  "darklight",
  (ifDark, ifLight, ctx) => {
    // this is an error upstream lmao
    return ctx.data.root.isLight ? ifDark : ifLight;
  },
);

export { Handlebars };
