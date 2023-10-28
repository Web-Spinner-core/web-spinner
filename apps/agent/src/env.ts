import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "PUBLIC_",
  server: {
    PORT: z.string().optional(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    DATABASE_URL: z.string().url(),
    GH_TOKEN: z.string(),
    GH_APP_ID: z.string(),
    GH_CLIENT_ID: z.string(),
    GH_CLIENT_SECRET: z.string(),
    GH_PRIVATE_KEY: z.string(),
    WEBHOOK_SECRET: z.string(),
    LOG_LEVEL: z.enum(["DEBUG", "INFO", "WARN", "ERROR"]),
    OPENAI_API_KEY: z.string(),
    LANGCHAIN_TRACING_V2: z.boolean(),
    LANGCHAIN_ENDPOINT: z.string().url(),
    LANGCHAIN_API_KEY: z.string(),
    LANGCHAIN_PROJECT: z.string(),
  },
  client: {},
  runtimeEnv: process.env,
});
