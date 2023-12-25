#!/usr/bin/env -S deno run --allow-run --allow-read
import * as log from "https://deno.land/std@0.210.0/log/mod.ts";

const targets = [
  "aarch64-apple-darwin",
  "x86_64-apple-darwin",
  "x86_64-pc-windows-msvc",
  "x86_64-unknown-linux-gnu",
];

if (import.meta.main) {
  targets.forEach(async (target) => {
    const isWin = target.includes("windows");
    const binName = `dist/whiskers-${target}${isWin ? ".exe" : ""}`;

    const compileCmd = await new Deno.Command(Deno.execPath(), {
      args: [
        "compile",
        "--cached-only",
        "--allow-read",
        "--allow-write",
        "--target",
        target,
        "--output",
        binName,
        "main.ts",
      ],
    }).output();

    if (compileCmd.code !== 0) {
      log.critical(`failed to compile whiskers for ${target}`);
      log.critical(new TextDecoder().decode(compileCmd.stderr).trim());
      return;
    }

    log.info(`compiled whiskers for ${target}`);

    const bzipCmd = await new Deno.Command("bzip2", { args: ["-f", binName] })
      .output();

    if (bzipCmd.code !== 0) {
      log.critical(`failed to compress whiskers for ${target}:`);
      log.critical(new TextDecoder().decode(bzipCmd.stderr).trim());
      return;
    }

    log.info(`compressed whiskers for ${target}`);
  });
}
