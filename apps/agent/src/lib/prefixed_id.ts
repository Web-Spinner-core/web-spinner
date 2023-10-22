import { v4 as uuidv4 } from "uuid";
import b32 from "base32-encoding";

/**
 * Generate a prefixed ID
 * e.g. generatePrefixedId("foo") => "foo_abcd1234"
 */
export function generatePrefixedId(prefix: IDPrefix): string {
  // Parse raw UUID buffer and convert to hex
  const uuid = Buffer.from(uuidv4().replace(/-/g, ""), "hex");
  return `${prefix}_${b32.stringify(uuid)}`;
}

/**
 * Mapping of ID prefixes
 */
export const ID_PREFIXES = {
  REPOSITORY: "repo",
} as const;

type IDPrefix = (typeof ID_PREFIXES)[keyof typeof ID_PREFIXES];
