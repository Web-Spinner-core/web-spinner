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
class Tool<T extends z.ZodObject<z.ZodRawShape>> {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly parameters: T
  ) {}

  toJsonSchema(): JsonSchema {
    const serializedParameters = zodToJsonSchema(this.parameters);

    return {
      name: this.name,
      description: this.description,
      parameters: serializedParameters,
    };
  }
}

export default Tool;
