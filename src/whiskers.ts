/// <reference types="./types.d.ts" />
import { test as testForFrontmatter } from "https://deno.land/std@0.210.0/front_matter/mod.ts";
import {
  createExtractor,
  Parser,
} from "https://deno.land/std@0.210.0/front_matter/create_extractor.ts";
import { parse as parseYaml } from "https://deno.land/std@0.210.0/yaml/mod.ts";
import { deepMerge } from "https://deno.land/std@0.210.0/collections/deep_merge.ts";
import { type Instance, tinycolor } from "./color.ts";

import { type CatppuccinColor, type CatppuccinFlavor, palette } from "./ctp.ts";
import { makeHelpers, vento } from "./vento.ts";

type SingleFlavorMode =
  & {
    flavor: CatppuccinFlavor;
    isDark: boolean;
    isLight: boolean;
    colors: Record<CatppuccinColor, Instance>;
    overrides?: Record<string, unknown>;
  }
  & ReturnType<typeof makeHelpers>
  & {
    [k in CatppuccinColor]: Instance;
  };

type MultiFlavorMode = {
  [k in CatppuccinFlavor]: SingleFlavorMode;
};

export const compile = async (
  input: string,
  flavor: CatppuccinFlavor,
  options?: {
    overrides?: Record<string, unknown>;
  },
): Promise<string> => {
  let template: string;
  let attrs: Record<string, unknown> = {};

  if (testForFrontmatter(input, ["yaml", "unknown"])) {
    const extract = createExtractor({
      yaml: parseYaml as Parser,
      unknown: ((s: string) => s) as Parser,
    });

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
  // while also compiling the vento expressions
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

  const result = await vento.runString(template, data);

  return result.content.replaceAll(/['"]{{WHISKERS:UNQUOTE:(.*?)}}['"]/g, "$1");
};
