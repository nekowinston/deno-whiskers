import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import {
  Input,
  prompt,
} from "https://deno.land/x/cliffy@v1.0.0-rc.3/prompt/mod.ts";
import { vento } from "../vento.ts";

export const scaffoldCmd = new Command()
  .description("Scaffold a new port.")
  .action(async () => {
    const responses = await prompt([{
      type: Input,
      name: "portName",
      message: "What's the name of the port?",
    }, {
      type: Input,
      name: "portSlug",
      message: "What's the slug of the port?",
    }, {
      type: Input,
      name: "authorName",
      message: "What's your name?",
    }, {
      type: Input,
      name: "authorGitHub",
      message: "What's your GitHub username?",
    }]).catch(() => Deno.exit(1));
    const data = {
      port: { name: responses.portName, slug: responses.portSlug },
      author: {
        name: responses.authorName,
        github: responses.authorGitHub,
      },
    };

    // TODO: actually scaffold into a new directory
    await Promise.all([
      vento.run("./template/README.vto", data),
      vento.run("./template/LICENSE.vto", data),
    ]).then((res) => res.map((r) => console.log(r.content)));
  });
