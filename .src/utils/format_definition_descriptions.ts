import {
  formatMarkdown,
  type FormatMarkdownOptions,
} from "./format_markdown.ts";
import type * as types from "../types.ts";

export const formatDefinitionDescriptions = async (
  def: types.ValidationSpecDefinition,
  options: FormatMarkdownOptions,
): Promise<types.ValidationSpecDefinition> => {
  const defClone = structuredClone(def) as types.ValidationSpecDefinition;

  for (const enumDef of Object.values(defClone.enums)) {
    if (enumDef.description !== undefined) {
      enumDef.description = await formatMarkdown(
        enumDef.description,
        options,
      );
    }
    for (const enumValue of Object.values(enumDef.values)) {
      if (enumValue.description !== undefined) {
        enumValue.description = await formatMarkdown(
          enumValue.description,
          options,
        );
      }
    }
  }

  for (const keywordEntry of Object.values(def.keywords)) {
    if (keywordEntry.description) {
      keywordEntry.description = await formatMarkdown(
        keywordEntry.description,
        options,
      );
    }
  }

  return defClone;
};
