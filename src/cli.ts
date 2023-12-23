#!/usr/bin/env -S deno run --allow-read=. --allow-write=.
import * as log from "https://deno.land/std@0.210.0/log/mod.ts";
import {
  Command,
  CompletionsCommand,
  EnumType,
} from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";

import { CatppuccinFlavor, palette } from "./ctp.ts";
import { compile } from "./whiskers.ts";

if (import.meta.main) {
  await new Command().name("whiskers")
    .version("anarchy")
    .description("The bastard version of whiskers")
    .type("log-level", new EnumType(["DEBUG", "INFO", "WARNING", "ERROR"]))
    .type("whiskers-flavor", new EnumType([...Object.keys(palette), "all"]))
    .option("-o, --output <path:string>", "File to write to")
    .option("--overrides <JSON:string>", "Overrides to apply")
    .option("-l, --log-level <level:log-level>", "Set log level")
    .arguments("<template:string> <flavor:whiskers-flavor>")
    .action(async (options, templateFp, flavorName) => {
      log.setup({
        handlers: {
          console: new log.handlers.ConsoleHandler(options.logLevel ?? "DEBUG"),
        },
      });
      const templateData = await Deno.readTextFile(templateFp);
      const flavor = flavorName as CatppuccinFlavor | "all";

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

      compile(templateData, flavor, { overrides });
    })
    .command("completions", new CompletionsCommand())
    .parse();
}
