/// <reference types="./types.d.ts" />
import { test as testForFrontmatter } from "https://deno.land/std@0.210.0/front_matter/mod.ts";
import { extract } from "https://deno.land/std@0.210.0/front_matter/yaml.ts";
import { deepMerge } from "https://deno.land/std@0.210.0/collections/deep_merge.ts";

import { CatppuccinColor, CatppuccinFlavor, palette } from "./ctp.ts";
import { Handlebars } from "./hbs.ts";

type FlavorDirective = CatppuccinFlavor | "all";

export const compile = (
  template: string,
  flavor: FlavorDirective,
  options?: {
    overrides?: Record<string, unknown>;
  },
): Record<CatppuccinFlavor, string> => {
  const flavors: CatppuccinFlavor[] = flavor === "all"
    ? ["mocha", "macchiato", "frappe", "latte"]
    : [flavor];

  return flavors.reduce((acc, flavor) => {
    let input: string;
    let attrs: Record<string, unknown> = {};

    if (testForFrontmatter(template, ["yaml"])) {
      ({ body: input, attrs } = extract(template));
    } else {
      input = template;
      attrs = {};
    }

    const ctpHexColors = Object.entries(palette[flavor].colors).reduce(
      (acc, [colorName, colorValue]) => {
        acc[colorName] = colorValue.hex.replace("#", "");
        return acc;
      },
      {} as Record<CatppuccinColor, string>,
    );

    const basicContext = {
      flavor,
      isLight: palette[flavor].dark,
      isDark: !palette[flavor].dark,
      ...ctpHexColors,
    };

    // cli overrides
    const overrides = deepMerge(
      options?.overrides?.all ?? {},
      options?.overrides?.[flavor] ?? {},
    );

    // fully parse the frontmatter, apply overrides
    // while also compiling the handlebars expressions
    const reducer = (acc: Record<string, unknown>, [key, value]: [
      string,
      unknown,
    ]) => {
      if (typeof value === "object" && value !== null) {
        acc[key] = Object.entries(value).reduce(reducer, {});
        return acc;
      }
      acc[key] = Handlebars.compile(String(value))(deepMerge(
        basicContext,
        overrides,
      ));
      return acc;
    };
    const frontmatter = Object.entries(attrs).reduce(reducer, {});

    /**
     * now the
     * - predefined
     * - frontmatter
     * - cli overrides
     * are all merged
     */
    const context = deepMerge(
      deepMerge(
        deepMerge(basicContext, frontmatter),
        frontmatter?.overrides ?? {},
      ),
      overrides,
    );

    const result = Handlebars
      .compile(input, { strict: true })(context)
      // post-process the unquote helper
      .replaceAll(/['"]{{WHISKERS:UNQUOTE:(.*?)}}['"]/g, "$1");

    acc[flavor] = result;
    console.log(result);

    return acc;
  }, {} as Record<CatppuccinFlavor, string>);
};