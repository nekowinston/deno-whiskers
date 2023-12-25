import {
  GithubProvider,
  UpgradeCommand,
} from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/upgrade/mod.ts";

export const upgradeCmd = new UpgradeCommand({
  provider: [
    new GithubProvider({ repository: "nekowinston/deno-whiskers" }),
  ],
});
