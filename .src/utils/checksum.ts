import { crypto } from "std/crypto/mod.ts";
import { iterateReader } from "std/streams/conversion.ts";

export const algorithm = "MD5" as const;

export const fileChecksum = async (
  file: URL | string | Deno.FsFile,
): Promise<string> => {
  const f = file instanceof Deno.FsFile ? file : await Deno.open(file);
  const arrayBuffer = await crypto.subtle.digest(algorithm, iterateReader(f));

  f.close();
  return toHexString(arrayBuffer);
};

const toHexString = (bytes: ArrayBuffer): string =>
  new Uint8Array(bytes).reduce(
    (str, byte) => str + byte.toString(16).padStart(2, "0"),
    "",
  );
