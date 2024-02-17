#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net=api.github.com
/// <reference types="./src/types.d.ts" />
import { assertEquals } from "https://deno.land/std@0.210.0/assert/assert_equals.ts";
import * as log from "https://deno.land/std@0.210.0/log/mod.ts";
import {
  Command,
  CompletionsCommand,
  EnumType,
} from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { tty } from "https://deno.land/x/cliffy@v1.0.0-rc.3/ansi/tty.ts";

import { palette } from "./src/ctp.ts";
import { compile } from "./src/whiskers.ts";
import { scaffoldCmd, upgradeCmd } from "./src/cmds/mod.ts";
import denoJSON from "./deno.json" with { type: "json" };

const accentEnumType = new EnumType(
  Object.entries(palette.mocha.colors)
    .filter(([_, v]) => v.accent)
    .map(([k, _]) => k),
);

if (import.meta.main) {
  await new Command()
    .name("whiskers")
    .version(denoJSON.version)
    .description("Whiskers 🤝 Vento")
    .type("accent", accentEnumType)
    .type("log-level", new EnumType(["DEBUG", "INFO", "WARNING", "ERROR"]))
    .type("whiskers-flavor", new EnumType(Object.keys(palette)))
    .option("-o, --output <path:string>", "File to write to")
    .option("--overrides <JSON:string>", "Overrides to apply")
    .option("--accent <accent:accent>", "Accent color to use")
    .option("-w, --watch", "Watch the template file for changes")
    .option("-c, --check", "Lint the template against a previous output")
    .option("-l, --log-level <level:log-level>", "Set log level")
    .arguments("<template:string> <flavor:whiskers-flavor>")
    .action(async (options, templateFp, flavor) => {
      log.setup({
        handlers: {
          console: new log.handlers.ConsoleHandler(options.logLevel ?? "INFO"),
        },
      });

      const templateData = await Deno.readTextFile(templateFp);

      let overrides;
      if (options.overrides) {
        /**
         * if the overrides option is a file path, read the file
         * otherwise, parse the JSON
         */
        overrides = await Deno.readTextFile(options.overrides)
          .then((data) => JSON.parse(data))
          .catch(() => {
            try {
              return JSON.parse(options.overrides ?? "{}");
            } catch (_) {
              log.critical("Invalid JSON provided to overrides.");
              Deno.exit(1);
            }
          });
      }

      const result = await compile(templateData, flavor, { overrides });

      if (options.check) {
        if (!options.output) {
          log.critical("Cannot check without an output file.");
          Deno.exit(1);
        }
        try {
          assertEquals(result, await Deno.readTextFile(options.output));
        } catch (e) {
          log.critical("Output does not match previous output.");
          Deno.stdout.writeSync(new TextEncoder().encode(e.message));
          Deno.exit(1);
        }
        log.info("Output matches previous output.");
        Deno.exit(0);
      }

      if (options.watch) {
        const watcher = Deno.watchFs(templateFp);

        const myTty = tty({
          writer: Deno.stdout,
          reader: Deno.stdin,
        });

        myTty.cursorSave
          .cursorHide
          .cursorTo(0, 0)
          .eraseScreen();

        for await (const event of watcher) {
          if (event.kind === "modify") {
            const result = await compile(templateData, flavor, { overrides });
            console.log(result);
            log.info("Updated output file.");
          }
        }
      }

      console.log(result);
    })
    .command("scaffold", scaffoldCmd)
    .command("upgrade", upgradeCmd)
    .command("completions", new CompletionsCommand())
    .parse();
}
