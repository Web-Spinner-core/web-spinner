import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

interface JsonSchema {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/**
 * Generic tool that can be used by an LLM
 */
class Tool<
  N extends string,
  D extends string,
  T extends z.ZodObject<z.ZodRawShape>,
> {
  constructor(
    public readonly name: N,
    public readonly description: D,
    public readonly parameters: T
  ) {}

  /**
   * Create a JSON schema representation of this tool
   * for use with OpenAI function calling
   */
  toJsonSchema(): JsonSchema {
    const serializedParameters = zodToJsonSchema(this.parameters);

    return {
      name: this.name,
      description: this.description,
      parameters: serializedParameters,
    };
  }

  /**
   * Parse a raw object into the parameters of this tool
   */
  parse(raw: unknown): z.infer<T> {
    return this.parameters.parse(raw);
  }
}

export type AnyTool = Tool<string, string, z.ZodObject<z.ZodRawShape>>;

export default Tool;
