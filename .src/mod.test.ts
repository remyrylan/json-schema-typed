import {
  ContentEncoding,
  type JSONSchema,
  TypeName,
} from "../dist/deno/draft_2019_09.ts";

export const schema1: JSONSchema.Array = {
  type: "array",
};

export const schema2: JSONSchema = true;

export const schema3: JSONSchema<string> = {
  contentEncoding: ContentEncoding.Base64,
  type: "string",
};

export const schema4: JSONSchema.String = {
  type: "string",
};

export const schema5: JSONSchema = {
  oneOf: [{
    type: "object",
    properties: {
      hello: { type: "number" },
    },
    required: ["hello"],
  }, {
    type: "object",
    properties: {
      hello2: { type: "string" },
    },
    required: ["hello2"],
  }],
  definitions: {
    foo: {
      type: "boolean",
    },
    yup: {
      if: true,
      then: { enum: [5, 7, 9] },
      else: { const: 6 },
    },
  },
  properties: {
    foobar: {
      enum: ["test", "what"],
    },
    foobar2: {
      const: "yo",
    },
    num: {
      maximum: 5,
      minimum: 2,
    },
    enabled: {
      $ref: "#/definitions/foo",
    },
    test: {
      type: "object",
      properties: {
        what: { type: "string" },
        yo: { enum: ["foo", "bar"] },
        foo: {
          $ref: "#/definitions/foo",
        },
      },
      required: ["yo"],
    },
    what: {
      $ref: "#/definitions/yup",
    },
    testing: {
      type: [TypeName.String, TypeName.Number],
    },
  },
  required: ["num"],
};
