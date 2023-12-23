import { assertEquals } from "https://deno.land/std@0.210.0/assert/mod.ts";
import { walk } from "https://deno.land/std@0.210.0/fs/walk.ts";
import { basename, extname } from "https://deno.land/std@0.210.0/path/mod.ts";

import { type CatppuccinFlavor } from "./ctp.ts";
import { compile } from "./whiskers.ts";

const data: Record<string, {
  template: string;
  expected: string;
  // deno-lint-ignore no-explicit-any
  options: any;
}> = {};

const replaced = (path: string, ext: string) =>
  path.replace(extname(path), ext);

for await (const { path } of walk("./src/fixtures", { exts: ["hbs"] })) {
  const name = basename(path);
  data[name] = {
    template: await Deno.readTextFile(path),
    expected: await Deno.readTextFile(replaced(path, ".txt")),
    options: await Deno.readTextFile(replaced(path, ".json"))
      .then(JSON.parse)
      .catch(() => {}),
  };
}

Object.entries(data)
  .forEach(([name, { template, expected, options }]) => {
    Deno.test(`fixture: ${name}`, () => {
      const flavor = options?.flavor;
      const result = compile(
        template,
        flavor,
        { overrides: options?.overrides },
      );
      assertEquals(result[flavor as CatppuccinFlavor], expected);
    });
  });
