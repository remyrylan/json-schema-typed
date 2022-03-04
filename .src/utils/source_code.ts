import type * as types from "../types.ts";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/**
 * Split line breaks
 *
 * @param text
 * @returns
 */
export const splitLines = (text: string): string[] => text.split("\n");

/**
 * Format a block description line
 *
 * @param line
 * @param indent
 * @returns
 */
export const formatBlockCommentLine = (line: string, indent = 0) =>
  `${" ".repeat(indent > 0 ? indent : 0)}* ${line}`;

/**
 * Make a block description
 *
 * @param text
 * @param indent
 * @returns
 */
export const makeBlockComment = (text: string, indent = 0): string => {
  return `${"".repeat(indent > 1 ? indent - 1 : 0)}/**\n${
    splitLines(text).map((line) => formatBlockCommentLine(line, indent + 1))
      .join("\n")
  }\n${" ".repeat(indent + 1)}*/`;
};

export const formatKeywordComment = (
  keyword: types.KeywordSchema,
): string | undefined => {
  const comment: string[] = [];
  const tags: string[] = [];

  if (keyword.description !== undefined) {
    comment.push(keyword.description);
  }

  // `default` is the only one out of alphabetical order since editors like
  // VS Code display it differently.
  if ("default" in keyword && keyword.default !== undefined) {
    const { default: def } = keyword;
    tags.push(
      `@default ${typeof def === "string" ? `"${def}"` : def.toString()}`,
    );
  }

  if ("const" in keyword && keyword.const !== undefined) {
    const { const: value } = keyword;

    tags.push(
      `@const ${typeof value === "string" ? `"${value}"` : value.toString()}`,
    );
  }

  if ("deprecated" in keyword && keyword.deprecated !== undefined) {
    tags.push(
      `@deprecated ${keyword.deprecated.toString()}`,
    );
  }

  // `enum` is not needed -- the values will display as a TypeScript union

  if ("exclusiveMinimum" in keyword && keyword.exclusiveMinimum !== undefined) {
    tags.push(
      `@exclusiveMinimum ${keyword.exclusiveMinimum.toString()}`,
    );
  }

  if ("format" in keyword && keyword.format !== undefined) {
    tags.push(
      `@format "${keyword.format.toString()}"`,
    );
  }

  if ("minimum" in keyword && keyword.minimum !== undefined) {
    tags.push(
      `@minimum ${keyword.minimum.toString()}`,
    );
  }

  if (tags.length > 0) {
    comment.push("\n\n", ...tags);
  }

  if (comment.length === 0) {
    return;
  }

  return comment.join("\n");
};

export const stringifyKeyword = (keyword: types.KeywordSchema): string => {
  if ("type" in keyword) {
    switch (keyword.type) {
      case "string": {
        if (keyword.enum !== undefined) {
          return stringifyArrayToUnion(keyword.enum);
        }
        return "string";
      }

      case "JSONSchema":
        return "JSONSchema";

      case "JSONSchema<Narrowable>":
        return "JSONSchema<Value, SchemaType>";

      case "Value":
        return "Value";

      case "array":
        return `MaybeReadonlyArray<${
          Array.isArray(keyword.items)
            ? keyword.items.map((item) => stringifyKeyword(item))
            : stringifyKeyword(keyword.items)
        }>`;

      case "object": {
        if (keyword.additionalProperties !== undefined) {
          return `Record<string, ${
            stringifyKeyword(keyword.additionalProperties)
          }>`;
        }
        throw new TypeError("Unexpected object without `additionalProperties`");
      }

      case "boolean":
      case "null":
        return keyword.type;

      case "integer":
      case "number":
        return "number";

      default:
        console.log(keyword);
        throw new TypeError("Unexpected keyword schema");
    }
  }

  if ("oneOf" in keyword) {
    return keyword.oneOf.map(stringifyKeyword).join(" | ");
  }

  if ("anyOf" in keyword) {
    return keyword.anyOf.map(stringifyKeyword).join(" | ");
  }

  throw new TypeError("Unexpected keyword schema");
};

export const stringifyArray = (
  values: readonly string[],
): string => {
  return `\n${values.map((value) => `"${value}",`).join("\n")}`;
};

export const stringifyArrayToUnion = (
  values: readonly string[],
  indent = 0,
): string => {
  return `\n${
    values.map((value) => `${" ".repeat(indent)}| "${value}"`).join("\n")
  }`;
};

export const assertCodeDoesNotHavePlaceholder = (
  filename: string,
  sourceCode: string,
): void => {
  if (sourceCode.includes("PLACEHOLDER") === false) {
    return;
  }

  console.error(
    `Placeholder is still present when generating "${filename}".`,
    "Refusing to proceed.",
  );
  const placeHolderIndex = sourceCode.indexOf("PLACEHOLDER");
  const indexStart = placeHolderIndex - 250;
  console.log(
    sourceCode.slice(indexStart > 0 ? indexStart : 0, indexStart + 500),
  );
  Deno.exit();
};

export const expandSourcePlaceholders = (
  filename: string,
  rawSourceCode: string,
  draftSpec: types.ValidationSpecDefinition,
) => {
  const sourceCode = rawSourceCode.includes("// __BEGIN__")
    ? rawSourceCode.split("// __BEGIN__")[1]
    : rawSourceCode;
  const draftIdNoLeadingZero = draftSpec.$draft.replace(/^0/, "");

  const typeNames = Object.values(draftSpec.enums.typeName.values).map((
    value,
  ) => value.value);
  const newCode = splitLines(sourceCode.trim())
    .filter((line) => {
      const trimmedLine = line.trim();
      return trimmedLine.includes("// @ts-expect-error") === false;
    })
    .map((line) => {
      if (line.includes("* __PLACEHOLDER:KEYWORD_COMMENT:")) {
        const indent = line.length - line.trimStart().length;
        const keyword = line.split(`* __PLACEHOLDER:KEYWORD_COMMENT:`)[1]
          .trim().slice(0, -2) as keyof typeof draftSpec.keywords;
        if (keyword in draftSpec.keywords) {
          const keywordSchema = draftSpec.keywords[keyword];
          const keywordComment = formatKeywordComment(
            keywordSchema as types.KeywordSchema,
          );
          if (keywordComment !== undefined) {
            return splitLines(keywordComment).map((
              descriptionLine,
            ) => formatBlockCommentLine(descriptionLine, indent)).join("\n");
          }
          // throw new TypeError("TODO")
          return "";
        }
      }
      return line;
    })
    .join("\n")
    .replace(
      "// __PLACEHOLDER:LICENSE__",
      makeBlockComment(
        draftSpec.$license,
      ).replace("/**", "/*"),
    )
    .replace(
      `// __PLACEHOLDER:TYPES_IMPORT__`,
      `import { type JSONSchema } from "./types.ts";`,
    )
    .replaceAll(/(__|\*\*)PLACEHOLDER\:DRAFT(__|\*\*)/g, draftSpec.$draft)
    .replaceAll(
      /(__|\*\*)PLACEHOLDER\:DRAFT(__|\*\*)/g,
      draftIdNoLeadingZero,
    )
    .replaceAll(
      /(__|\*\*)PLACEHOLDER\:DRAFT_LEFT_PADDED(__|\*\*)/g,
      draftSpec.$draft.padStart(2, "0"),
    )
    .replaceAll("__PLACEHOLDER:SCHEMA_URL__", draftSpec.$schemaUrl)
    .replaceAll("__PLACEHOLDER:DOCS_URL__", draftSpec.$docsUrl)
    .replace(
      `__PLACEHOLDER__: true; // KEYWORDS_INTERFACE`,
      Object.entries(draftSpec.keywords).map(([keyword, keywordSchema]) => {
        const entry: string[] = [];
        const comment = formatKeywordComment(keywordSchema);

        if (comment !== undefined) {
          entry.push(makeBlockComment(comment));
        }

        entry.push(
          `  ${keyword}?: ${
            keyword === "type"
              ? "SchemaType"
              : stringifyKeyword(keywordSchema as types.KeywordSchema)
          };`,
        );

        return entry.join("\n");
      }).join("\n\n"),
    )
    .replace(`// __PLACEHOLDER:KEYWORD_TYPES__`, () => {
      const code: string[] = [];

      for (
        const entry of Object.values(
          draftSpec.keywordsByType,
        ) as types.KeywordKind<string, string>[]
      ) {
        code.push(
          `  export type ${entry.title} = ${
            stringifyArrayToUnion(entry.values)
          }`,
        );
      }
      return code.join("\n\n");
    })
    .replace(`// __PLACEHOLDER:TYPE_NAMES_TYPE__`, () => {
      const typeEnum = draftSpec.enums.typeName;

      return `  export type TypeName = ${
        stringifyArrayToUnion(
          Object.values(typeEnum.values).map((entry) => entry.value),
          2,
        )
      }`;
    })
    .replace(`// __PLACEHOLDER:ENUMS__`, () => {
      const code: string[] = [];

      for (
        const enumSchema of Object.values(
          draftSpec.enums,
        ) as types.EnumSchema[]
      ) {
        if (enumSchema.description !== undefined) {
          code.push(
            makeBlockComment(enumSchema.description, 0),
          );
        }

        code.push(
          `export enum ${enumSchema.title} {${
            Object.entries(enumSchema.values).map(
              ([valueKey, valueSchema]) => {
                const value: string[] = [];

                if (valueSchema.description !== undefined) {
                  value.push(
                    "\n\n",
                    makeBlockComment(valueSchema.description, 2),
                    "\n",
                  );
                }

                value.push(
                  `${" ".repeat(4)}${
                    Number.isInteger(parseInt(valueKey.charAt(0), 10))
                      ? `"${valueKey}"`
                      : valueKey
                  } = "${valueSchema.value}",`,
                );

                return value.join("");
              },
            ).join("")
          }}\n`,
        );
      }

      return code.join("\n");
    })
    .replace(`// __PLACEHOLDER:KEYWORDS__`, () => {
      return `export const keywords = [${
        stringifyArray(Object.keys(draftSpec.keywords))
      }] as const;`;
    })
    .replace(
      `"__PLACEHOLDER:TYPE_UNION__"`,
      stringifyArrayToUnion(typeNames, 2),
    ).replace("// __PLACEHOLDER:EXTRACT_ARRAY_ITEMS_TUPLE__", () => {
      return [
        "// deno-fmt-ignore-start",
        ...LETTERS.map((_letter, index) => {
          const chars = LETTERS.slice(0, index + 1);
          return `: Schema extends { items: readonly [${
            chars.map((char) => `infer ${char}`).join(", ")
          }] } | { items: [${
            chars.map((char) => `infer ${char}`).join(", ")
          }]} ? [${
            chars.map((char) => `JSONSchemaToValueType<${char}, RootSchema>`)
              .join(", ")
          }]`;
        }),
        // ...LETTERS.map((_letter, index) => {
        //   const chars = LETTERS.slice(0, index + 1);
        //   return `: Schema extends { items: [${
        //     chars.map((char) => `infer ${char}`).join(", ")
        //   }] } ? [${
        //     chars.map((char) => `JSONSchemaToValueType<${char}, RootSchema>`)
        //       .join(", ")
        //   }]`;
        // }),
        "// deno-fmt-ignore-end",
        ,
      ].join("\n");
    });

  assertCodeDoesNotHavePlaceholder(filename, newCode);
  return newCode;
};
