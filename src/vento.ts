import titleCase from "https://deno.land/x/case@2.2.0/titleCase.ts";
import Vento from "https://deno.land/x/vento@v0.10.0/mod.ts";
import tinycolor from "https://esm.sh/v135/tinycolor2@1.6.0";
import { stringify as stringifyYaml } from "https://deno.land/std@0.210.0/yaml/mod.ts";
import { stringify as stringifyTOML } from "https://deno.land/std@0.210.0/toml/mod.ts";

import type { CatppuccinFlavorObj } from "./ctp.ts";

export const vento = Vento({
  // shim the loader
  includes: {
    load: (_) => ({ source: "", data: {} }),
    resolve: (_) => "",
  },
  dataVarname: "root",
});

const uppercase = (str: string) => String(str).toUpperCase();

const lowercase = (str: string) => String(str).toLowerCase();

const titlecase = (str: string) => titleCase(String(str));

const trunc = (value: number, fractionDigits: number) =>
  Number(value).toFixed(fractionDigits);

const unquote = (str: string) => `{{WHISKERS:UNQUOTE:${str}}}`;

const lighten = (color: string, amount: number) =>
  tinycolor(color).clone().lighten(amount * 100);

const darken = (color: string, amount: number) =>
  tinycolor(color).clone().darken(amount * 100);

const mix = (color1: string, color2: string, amount: number) =>
  tinycolor.mix(color1, color2, amount);

const opacity = (color: string, alpha: number) =>
  tinycolor(color).clone().setAlpha(alpha);

vento.filters.toTitleCase = titleCase;
vento.filters.toUpperCase = uppercase;
vento.filters.toLowerCase = lowercase;
vento.filters.trunc = trunc;
vento.filters.unquote = unquote;

const hasAllProperties = (obj: object, props: string[]) =>
  props.every((prop) => Object.hasOwn(obj, prop));

// structured Data helpers
const parseColors = (input: Record<string, unknown>) =>
  JSON.parse(JSON.stringify(input, (_, v) => {
    // if it's an instance of tinycolor, strinfify it
    if (
      typeof v === "object" &&
      hasAllProperties(v, ["_originalInput", "_format", "_ok"]) &&
      v._ok
    ) return String(v);
    else return v;
  }));

vento.filters.toJSON = (input: Record<string, unknown>, space = 2) =>
  JSON.stringify(parseColors(input), null, space);

vento.filters.toTOML = (input: Record<string, unknown>) =>
  stringifyTOML(parseColors(input));

vento.filters.toYaml = (input: Record<string, unknown>, space = 2) =>
  stringifyYaml(parseColors(input), { indent: space });

/**
 * remapping some of the filters to predefined Vento functions as well
 * e.g.
 * ```vento
 * {{ trunc(3.14159, 2) }}
 * ```
 * is the same as
 * ```vento
 * {{ 3.14159 | trunc(2) }}
 * ```
 * resulting in `3.14`.
 */
export const makeHelpers = (ctx: CatppuccinFlavorObj) => ({
  uppercase,
  lowercase,
  titlecase,
  trunc,
  lighten,
  darken,
  mix,
  unquote,
  opacity,
  darklight: (dark: string, light: string) => ctx.dark ? dark : light,
});
