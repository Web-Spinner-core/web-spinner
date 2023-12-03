import { prisma } from "database";
import { Context, Next } from "koa";
import { z } from "zod";
import APIError from "@lib/model/api_error";
import { identifyDirectories } from "~/pipelines/identify_directories";
import { identifyTheme } from "~/pipelines/identify_theme";

const bodySchema = z.object({
  fullName: z.string(),
  identifyDirectories: z.boolean().optional(),
  identifyTheme: z.boolean().optional(),
});

/**
 * Scan a repository's directory structure
 */
export default async function scanRepository(ctx: Context, next: Next) {
  const {
    fullName,
    identifyDirectories: shouldIdentifyDirectories,
    identifyTheme: shouldIdentifyTheme,
  } = bodySchema.parse(ctx.request.body);

  const repository = await prisma.repository.findUnique({
    where: { fullName },
  });
  if (!repository) {
    throw new APIError({
      type: "NOT_FOUND",
      message: `Repository '${fullName}' not yet registered. Have you installed the app on your repository/organization?`,
    });
  }

  const result = {} as Record<string, any>;
  if (shouldIdentifyDirectories) {
    result.directoryAnalysis = await identifyDirectories(repository);
  }
  if (shouldIdentifyTheme) {
    result.themeAnalysis = await identifyTheme(repository);
  }

  ctx.status = 200;
  ctx.body = result;
  return next();
}
