import * as fs from "std/fs/mod.ts";
import * as path from "std/path/mod.ts";
import type * as types from "./types.ts";
import { expandSourcePlaceholders } from "./utils/source_code.ts";
import { formatMarkdown } from "./utils/format_markdown.ts";
import { formatDefinitionDescriptions } from "./utils/format_definition_descriptions.ts";
import { fileChecksum } from "./utils/checksum.ts";
import checksums from "./checksums.json" assert { type: "json" };
import { VERSION } from "./version.ts";
import packageJson from "../dist/node/package.json" assert { type: "json" };

// -----------------------------------------------------------------------------

const FORCE_REFRESH = Deno.args.includes("--force");
const CWD = Deno.cwd();
const SRC_DIR = path.join(CWD, ".src");
const FILE_TEMPLATES_DIR = path.join(SRC_DIR, "file_templates");
const DIST_DIR = path.join(CWD, "dist");
const DENO_DIR = path.join(DIST_DIR, "deno");
const NODE_DIR = path.join(DIST_DIR, "node");
const SPEC_DEFS_DIR = path.join(DIST_DIR, "spec_definitions");
const ALL_DIST_DIRS = [DENO_DIR, SPEC_DEFS_DIR, NODE_DIR];

// -----------------------------------------------------------------------------

const licenseCopyrights: Array<
  { draft: string; year: number; credits: string[] }
> = [];

const modTemplateFilename = path.join(SRC_DIR, `mod_template.ts`);
const modTemplateCode = await Deno.readTextFile(modTemplateFilename);

// -----------------------------------------------------------------------------

// Collect all drafts

export const drafts: string[] = [];

for await (
  const entry of fs.expandGlob("./.src/draft/*/definition.ts")
) {
  const draftId = path.basename(path.dirname(entry.path));
  drafts.push(draftId);
}

drafts.sort((a, b) => a.localeCompare(b));

// -----------------------------------------------------------------------------

// Process each draft

for (const draftId of drafts) {
  const nodeDraftId = draftId.replaceAll("_", "-");
  const draftDir = path.join(SRC_DIR, "draft", draftId);
  const draftDefFilename = path.join(draftDir, "definition.ts");
  const draftDefChecksum = await fileChecksum(draftDefFilename);
  const draftDefRelativeFilename = path.relative(CWD, draftDefFilename).split(
    path.sep,
  ).join("/");

  const rawDraftSpec = (await import(draftDefFilename))
    .default as types.ValidationSpecDefinition;

  licenseCopyrights.push({
    ...rawDraftSpec.$copyright,
    draft: rawDraftSpec.$draft,
  });

  // Skip processing if the draft definition hasn't been updated
  if (
    // @ts-expect-error checksums.json is a plain record
    draftDefChecksum === checksums[draftDefRelativeFilename] &&
    FORCE_REFRESH === false
  ) {
    console.log(`Skipping draft-${draftId}: no changes`);
    continue;
  }

  // Update the draft definition checksum
  // @ts-expect-error this is valid
  checksums[draftDefRelativeFilename] = draftDefChecksum;

  const draftSpec = await formatDefinitionDescriptions(rawDraftSpec, {
    lineWidth: 75,
  });

  draftSpec.$license = (await formatMarkdown(draftSpec.$license, {
    lineWidth: 76,
  })).trim();

  {
    const jsonDef = await formatDefinitionDescriptions(rawDraftSpec, {
      lineWidth: 100_000,
    });

    await Deno.writeTextFile(
      path.join(SPEC_DEFS_DIR, `draft_${draftId}.json`),
      JSON.stringify(jsonDef, undefined, 2),
    );
  }

  const modCode = expandSourcePlaceholders(
    modTemplateFilename,
    modTemplateCode,
    draftSpec as unknown as types.ValidationSpecDefinition,
  );

  const outputFilename = path.join(NODE_DIR, `draft-${nodeDraftId}.ts`);
  await Deno.writeTextFile(
    outputFilename,
    [
      "// @generated",
      "// This code is automatically generated. Manual editing is not recommended.",
      "",
      modCode,
    ].join("\n"),
  );
  await Deno.run({ cmd: ["deno", "fmt", "--quiet", outputFilename] }).status();

  // Copy to the deno directory
  await fs.copy(
    outputFilename,
    path.join(DENO_DIR, `draft_${draftId}.ts`),
    { overwrite: true },
  );

  // -------------------------------------------------------------------------
  // Compile to JS
  // -------------------------------------------------------------------------
  const { files } = await Deno.emit(outputFilename, {
    bundle: "module",
    compilerOptions: { target: "es6" },
  });

  const js = files["deno:///bundle.js"];
  const map = files["deno:///bundle.js.map"];

  // Write to the node directory
  const mapJson = JSON.parse(map) as { sources: string[] };
  mapJson.sources = mapJson.sources.map((source) => path.basename(source));

  await Deno.writeTextFile(
    path.join(NODE_DIR, `draft-${nodeDraftId}.js`),
    [
      `/// <reference types="./draft-${nodeDraftId}.ts" />`,
      "// @generated",
      js,
      `//# sourceMappingURL=draft-${nodeDraftId}.js.map`,
    ].join("\n"),
  );

  await Deno.writeTextFile(
    path.join(NODE_DIR, `draft-${nodeDraftId}.js.map`),
    JSON.stringify(mapJson),
  );

  console.log(`draft_${draftId}: complete`);
}

// -----------------------------------------------------------------------------
// Update checksums.json
// -----------------------------------------------------------------------------
await Deno.writeTextFile(
  path.join(SRC_DIR, "checksums.json"),
  JSON.stringify(
    Object.fromEntries(
      Object.entries(checksums).sort(([aKey], [bKey]) =>
        aKey.localeCompare(bKey)
      ),
    ),
    undefined,
    2,
  ),
);

// -----------------------------------------------------------------------------
// Latest draft
// -----------------------------------------------------------------------------

const latestDraft = [...drafts].filter((draftId) => {
  return Number.isInteger(parseInt(draftId.split("-")[0], 10));
}).pop();

if (latestDraft === undefined) {
  throw new Error("TODO");
}

const nodeLatestDraft = latestDraft.replaceAll("_", "-");

await Deno.writeTextFile(
  path.join(DENO_DIR, "draft_latest.ts"),
  `export * from "./draft_${latestDraft}.ts";`,
);

// -----------------------------------------------------------------------------
// Update README files
// -----------------------------------------------------------------------------

const readmeFilenames: Array<{ template: string; output: string }> = [
  {
    template: path.join(FILE_TEMPLATES_DIR, "README.deno.template.md"),
    output: path.join(DENO_DIR, "README.md"),
  },
  {
    template: path.join(FILE_TEMPLATES_DIR, "README.node.template.md"),
    output: path.join(NODE_DIR, "README.md"),
  },
];

for (const readmeFilename of readmeFilenames) {
  const templateSource = await Deno.readTextFile(readmeFilename.template);
  await Deno.writeTextFile(
    readmeFilename.output,
    templateSource
      .replaceAll("{DRAFT_TOTAL}", drafts.length.toLocaleString("en"))
      .replaceAll("{NODE_LATEST_DRAFT}", latestDraft.replaceAll("_", "-"))
      .replace("{NODE_DRAFT_LIST}", () => {
        return drafts.map((draft) => `\`draft-${draft.replaceAll("_", "-")}\``)
          .join("\n- ");
      })
      .replace("{DENO_DRAFT_LIST}", () => {
        return drafts.map((draft) => `\`draft_${draft}.ts\``)
          .join("\n   - ");
      })
      .replaceAll("{LATEST_DRAFT}", latestDraft),
  );
  const p = Deno.run({
    cmd: ["deno", "fmt", "--quiet", readmeFilename.output],
  });
  await p.status();
  p.close();
}

// -----------------------------------------------------------------------------
// Update LICENSE files
// -----------------------------------------------------------------------------

const licenseFilename = path.join(CWD, "LICENSE.md");

await Deno.writeTextFile(
  licenseFilename,
  await formatMarkdown(
    (await Deno.readTextFile(
      path.join(FILE_TEMPLATES_DIR, "LICENSE.template.md"),
    ))
      .replace("{YEAR}", new Date().getFullYear().toString())
      .replace(
        "{COPYRIGHT}",
        licenseCopyrights.sort((a, b) => {
          if (a.year !== b.year) {
            return a.year - b.year;
          }
          return a.draft.localeCompare(b.draft);
        }).map(
          ({ draft, year, credits }) => {
            const initialCredits = credits.slice(0, -1);
            const lastCredit = credits.slice(-1);

            return `${year} [draft-${draft}] ${
              initialCredits.join(", ")
            }, and ${lastCredit}.`;
          },
        ).join("\n\n"),
      ),
  ),
);

for (const dir of ALL_DIST_DIRS) {
  await fs.copy(licenseFilename, path.join(dir, "LICENSE.md"), {
    overwrite: true,
  });
}

// -----------------------------------------------------------------------------
// Update json-schema-typed package.json
// -----------------------------------------------------------------------------
{
  packageJson.version = VERSION;
  packageJson.main = `./draft-${nodeLatestDraft}.js`;
  // @ts-expect-error this is valid
  packageJson.exports = {
    ".": `./draft-${nodeLatestDraft}.js`,
    ...Object.fromEntries(
      drafts.map((
        draftId,
      ) => {
        const nodeDraftId = draftId.replaceAll("_", "-");
        return [`./draft-${nodeDraftId}`, `./draft-${nodeDraftId}.js`];
      }),
    ),
  };

  await Deno.writeTextFile(
    path.join(NODE_DIR, "package.json"),
    JSON.stringify(packageJson, undefined, 2) + "\n",
  );
}

// -----------------------------------------------------------------------------
// Update deno version.ts
// -----------------------------------------------------------------------------
{
  await Deno.writeTextFile(
    path.join(DENO_DIR, "version.ts"),
    `export const VERSION = "${VERSION}";`,
  );
}
