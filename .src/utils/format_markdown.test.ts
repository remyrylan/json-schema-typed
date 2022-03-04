import { formatMarkdown } from "./format_markdown.ts";

const { test } = Deno;

test("Format markdown", async () => {
  console.log(
    await formatMarkdown(await Deno.readTextFile("./LICENSE.md"), {
      lineWidth: 100_000,
    }),
  );
});
