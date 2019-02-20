// @public
interface JSONSchema {
    $comment?: string;
    $id?: string;
    $ref?: string;
    $schema?: string;
    additionalItems?: JSONSchema;
    additionalProperties?: JSONSchema;
    allOf?: JSONSchema[];
    anyOf?: JSONSchema[];
    const?: any;
    contains?: JSONSchema;
    contentEncoding?: JSONSchemaContentEncodingName | JSONSchemaContentEncoding;
    contentMediaType?: string;
    default?: any;
    definitions?: {
        // (undocumented)
        [key: string]: JSONSchema;
    };
    dependencies?: {
        // (undocumented)
        [key: string]: JSONSchema | string[];
    } | string[];
    description?: string;
    else?: JSONSchema;
    enum?: any[];
    examples?: any[];
    exclusiveMaximum?: number;
    exclusiveMinimum?: number;
    format?: JSONSchemaFormat | 'date' | 'date-time' | 'email' | 'full-date' | 'full-time' | 'hostname' | 'idn-email' | 'idn-hostname' | 'ipv4' | 'ipv6' | 'iri' | 'iri-reference' | 'json-pointer' | 'json-pointer-uri-fragment' | 'regex' | 'relative-json-pointer' | 'time' | 'uri' | 'uri-reference' | 'uri-template' | 'uuid';
    if?: JSONSchema;
    items?: JSONSchema | JSONSchema[];
    maximum?: number;
    maxItems?: number;
    maxLength?: number;
    maxProperties?: number;
    minimum?: number;
    minItems?: number;
    minLength?: number;
    minProperties?: number;
    multipleOf?: number;
    not?: JSONSchema;
    oneOf?: JSONSchema[];
    pattern?: string;
    patternProperties?: {
        // (undocumented)
        [key: string]: JSONSchema;
    };
    properties?: {
        // (undocumented)
        [key: string]: JSONSchema;
    };
    propertyNames?: JSONSchema;
    readOnly?: boolean;
    required?: string[];
    then?: JSONSchema;
    title?: string;
    type?: JSONSchemaType | JSONSchemaTypeName | (JSONSchemaType | JSONSchemaTypeName)[];
    uniqueItems?: boolean;
    writeOnly?: boolean;
}

// @public
declare enum JSONSchemaContentEncoding {
    '7bit' = "7bit",
    '8bit' = "8bit",
    Base64 = "base64",
    Binary = "binary",
    IETFToken = "ietf-token",
    QuotedPrintable = "quoted-printable",
    XToken = "x-token"
}

// @public
declare type JSONSchemaContentEncodingName = '7bit' | '8bit' | 'binary' | 'quoted-printable' | 'base64' | 'ietf-token' | 'x-token';

// @public
declare enum JSONSchemaFormat {
    Date = "date",
    DateTime = "date-time",
    Email = "email",
    Hostname = "hostname",
    IDNEmail = "idn-email",
    IDNHostname = "idn-hostname",
    IPv4 = "ipv4",
    IPv6 = "ipv6",
    IRI = "iri",
    IRIReference = "iri-reference",
    JSONPointer = "json-pointer",
    JSONPointerURIFragment = "json-pointer-uri-fragment",
    RegEx = "regex",
    RelativeJSONPointer = "relative-json-pointer",
    Time = "time",
    URI = "uri",
    URIReference = "uri-reference",
    URITemplate = "uri-template",
    UUID = "uuid"
}

// @public
declare const JSONSchemaKeys: (keyof JSONSchema)[];

// @public
declare enum JSONSchemaType {
    Array = "array",
    Boolean = "boolean",
    Integer = "integer",
    Null = "null",
    Number = "number",
    Object = "object",
    String = "string"
}

// @public
declare type JSONSchemaTypeName = 'array' | 'boolean' | 'integer' | 'null' | 'number' | 'object' | 'string';

// @public
declare type JSONSchemaTypeValue = JSONSchemaTypeName | JSONSchemaType | (JSONSchemaType | JSONSchemaTypeName)[];


// (No @packageDocumentation comment for this package)
