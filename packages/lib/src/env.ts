import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "PUBLIC_",
  server: {
    DATABASE_URL: z.string().url(),
    GH_TOKEN: z.string(),
    GH_APP_ID: z.string(),
    GH_CLIENT_ID: z.string(),
    GH_CLIENT_SECRET: z.string(),
    GH_PRIVATE_KEY: z.string(),
    WEBHOOK_SECRET: z.string(),
    LOG_LEVEL: z.enum(["DEBUG", "INFO", "WARN", "ERROR"]),
    OPENAI_API_KEY: z.string(),
    LANGCHAIN_TRACING_V2: z.string(),
    LANGCHAIN_ENDPOINT: z.string().url(),
    LANGCHAIN_API_KEY: z.string(),
    LANGCHAIN_PROJECT: z.string(),
    AWS_REGION: z.string(),
    AWS_ACCESS_KEY: z.string(),
    AWS_SECRET_KEY: z.string(),
    MOMENTO_API_KEY: z.string(),
    MOMENTO_CACHE_NAME: z.string(),
  },
  client: {},
  runtimeEnv: process.env,
});
