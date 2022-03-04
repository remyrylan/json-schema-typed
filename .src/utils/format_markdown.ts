export type FormatMarkdownOptions = {
  lineWidth?: number;
};

export const formatMarkdown = async (
  sourceCode: string,
  options: FormatMarkdownOptions = {},
): Promise<string> => {
  const { lineWidth = 80 } = options;
  let tempFilename: string | undefined;

  try {
    tempFilename = await Deno.makeTempFile({ suffix: ".md" });
    await Deno.writeTextFile(tempFilename, sourceCode);
    const p = Deno.run({
      cmd: [
        "deno",
        "fmt",
        `--options-line-width=${lineWidth}`,
        "--quiet",
        tempFilename,
      ],
    });
    await p.status();
    p.close();
    return (await Deno.readTextFile(tempFilename)).trimEnd();
  } catch (err) {
    throw err;
  } finally {
    if (tempFilename !== undefined) {
      Deno.remove(tempFilename);
    }
  }
};
