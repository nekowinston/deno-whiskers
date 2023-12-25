/// <reference types="./types.d.ts" />
import { test as testForFrontmatter } from "https://deno.land/std@0.210.0/front_matter/mod.ts";
import { extract } from "https://deno.land/std@0.210.0/front_matter/yaml.ts";
import { deepMerge } from "https://deno.land/std@0.210.0/collections/deep_merge.ts";
import { type Instance, tinycolor } from "./tinycolor.ts";

import { type CatppuccinColor, type CatppuccinFlavor, palette } from "./ctp.ts";
import { makeHelpers, vento } from "./vento.ts";

type FlavorDirective = CatppuccinFlavor | "all";
type WhiskersResult = Record<CatppuccinFlavor, string>;

export const compile = async (
  input: string,
  flavor: FlavorDirective,
  options?: {
    overrides?: Record<string, unknown>;
  },
): Promise<WhiskersResult> => {
  const flavors: CatppuccinFlavor[] = flavor === "all"
    ? ["mocha", "macchiato", "frappe", "latte"]
    : [flavor];

  const result = {} as WhiskersResult;

  for await (const flavor of flavors) {
    let template: string;
    let attrs: Record<string, unknown> = {};

    if (testForFrontmatter(input, ["yaml"])) {
      ({ body: template, attrs } = extract(input));
    } else {
      template = input;
      attrs = {};
    }

    const ctpHexColors = Object.entries(palette[flavor].colors).reduce(
      (acc, [colorName, colorValue]) => {
        acc[colorName] = tinycolor(colorValue.hex.replace("#", ""));
        return acc;
      },
      {} as Record<CatppuccinColor, Instance>,
    );

    const basicContext = {
      flavor,
      isLight: palette[flavor].dark,
      isDark: !palette[flavor].dark,
      ...ctpHexColors,
      colors: ctpHexColors,
      ...makeHelpers(palette[flavor]),
    };

    // cli overrides
    const overrides = deepMerge(
      options?.overrides?.all ?? {},
      options?.overrides?.[flavor] ?? {},
    );

    // fully parse the frontmatter, apply overrides
    // while also compiling the handlebars expressions
    const reducer = (
      acc: Record<string, unknown>,
      [key, value]: [string, unknown],
    ) => {
      if (typeof value === "object" && value !== null) {
        acc[key] = Object.entries(value).reduce(reducer, {});
        return acc;
      }
      const { content } = vento.runStringSync(
        String(value),
        deepMerge(basicContext, overrides),
      );
      acc[key] = content;
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
    const data = deepMerge(
      deepMerge(
        deepMerge(
          basicContext,
          frontmatter,
        ),
        frontmatter?.overrides ?? {},
      ),
      overrides,
    );

    result[flavor] = await vento
      .runString(template, data)
      // post-process the unquote helper
      .then((result) => {
        return result.content
          .replaceAll(/['"]{{WHISKERS:UNQUOTE:(.*?)}}['"]/g, "$1");
      }).catch((err) => {
        console.error(err);
        Deno.exit(1);
      });
  }

  return Promise.resolve(result);
};
