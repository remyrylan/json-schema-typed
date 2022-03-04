// deno-fmt-ignore-file
// deno-lint-ignore-file

// __BEGIN__
// __PLACEHOLDER:LICENSE__

export const draft = "__PLACEHOLDER:DRAFT__" as const;
export const $schema = "__PLACEHOLDER:SCHEMA_URL__" as const;

type MaybeReadonlyArray<T> = Array<T> | ReadonlyArray<T>;
type ValueOf<T> = T[keyof T];

/**
 * JSON Schema [Draft __PLACEHOLDER:DRAFT__](__PLACEHOLDER:DOCS_URL__)
 */
export type JSONSchema<
  Value = any,
  SchemaType = Value extends boolean ? "boolean"
    : Value extends null ? "null"
    : Value extends number ? "number" | "integer"
    : Value extends string ? "string"
    : Value extends unknown[] ? "array"
    : Value extends Record<string | number, unknown> ? "object"
    : JSONSchema.TypeValue,
> = boolean | {
  __PLACEHOLDER__: true; // KEYWORDS_INTERFACE
};

// -----------------------------------------------------------------------------

export namespace JSONSchema {
  export type TypeValue = (
    // @ts-expect-error
    | ValueOf<TypeName>
    // @ts-expect-error
    | TypeName
    // @ts-expect-error
    | Array<ValueOf<TypeName> | TypeName>
    // @ts-expect-error
    | ReadonlyArray<ValueOf<TypeName> | TypeName>
  );

  /**
   * JSON Schema interface
   */
  export type Interface<
    Value = any,
    SchemaType extends TypeValue =
      TypeValue,
  > = Exclude<
    JSONSchema<Value, SchemaType>,
    boolean
  >;

  export type Array<T = any> = Pick<
    Interface<T, "array">,
    // @ts-expect-error
    KeywordByType.Any | KeywordByType.Array
  >;

  export type Boolean = Pick<
    Interface<boolean, "boolean">,
    // @ts-expect-error
    KeywordByType.Any
  >;

  export type Integer = Pick<
    Interface<number, "integer">,
    // @ts-expect-error
    KeywordByType.Any | KeywordByType.Number
  >;

  export type Number = Pick<
    Interface<number, "number">,
    // @ts-expect-error
    KeywordByType.Any | KeywordByType.Number
  >;

  export type Null = Pick<
    Interface<null, "null">,
    // @ts-expect-error
    KeywordByType.Any
  >;

  export type Object<T = any> = Pick<
    Interface<T, "object">,
    // @ts-expect-error
    KeywordByType.Any | KeywordByType.Object
  >;

  export type String = Pick<
    Interface<string, "string">,
    // @ts-expect-error
    KeywordByType.Any | KeywordByType.String
  >;
}

namespace KeywordByType {
  // __PLACEHOLDER:KEYWORD_TYPES__
}

// -----------------------------------------------------------------------------

// __PLACEHOLDER:ENUMS__

// -----------------------------------------------------------------------------
// Keywords
// -----------------------------------------------------------------------------

// __PLACEHOLDER:KEYWORDS__
