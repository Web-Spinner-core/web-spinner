import { init } from "@paralleldrive/cuid2";

const createCuid = init({
  random: Math.random,
  length: 15,
});

/**
 * Generate a prefixed ID
 * e.g. generatePrefixedId("foo") => "foo_abcd1234"
 */
export function generatePrefixedId(prefix: IDPrefix): string {
  return `${prefix}_${createCuid()}`;
}

/**
 * Mapping of ID prefixes
 */
export const ID_PREFIXES = {
  REPOSITORY: "repo",
  PAGE: "pg"
} as const;

type IDPrefix = (typeof ID_PREFIXES)[keyof typeof ID_PREFIXES];
