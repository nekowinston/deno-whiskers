import { assertEquals } from "https://deno.land/std@0.210.0/assert/mod.ts";
import { join } from "https://deno.land/std@0.210.0/path/mod.ts";

import { type CatppuccinFlavor } from "./ctp.ts";
import { compile } from "./whiskers.ts";

const data: Record<string, {
  template: string;
  expected: string;
  options: ReturnType<JSON["parse"]>;
}> = {};

const fixtureDir = "./src/fixtures";

for await (const { name, isDirectory } of Deno.readDir(fixtureDir)) {
  if (!isDirectory) continue;

  data[name] = {
    template: await Deno.readTextFile(join(fixtureDir, name, "input.vto")),
    expected: await Deno.readTextFile(join(fixtureDir, name, "output.txt")),
    options: await Deno.readTextFile(join(fixtureDir, name, "options.json"))
      .then(JSON.parse)
      // assume that the test has no extra options if there's no JSON file
      .catch(() => {}),
  };
}

Object.entries(data)
  .forEach(([name, { template, expected, options }]) => {
    Deno.test(`fixture: ${name}`, async () => {
      const flavor = options?.flavor;
      const result = compile(
        template,
        flavor,
        { overrides: options?.overrides },
      );
      assertEquals((await result)[flavor as CatppuccinFlavor], expected);
    });
  });
