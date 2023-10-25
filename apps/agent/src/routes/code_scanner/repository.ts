import { prisma } from "database";
import { Context, Next } from "koa";
import { z } from "zod";
import APIError from "~/lib/api_error";
import { analyzeRepository } from "~/pipeline/analyze_repository";

const bodySchema = z.object({
  fullName: z.string(),
});

/**
 * Scan a repository's directory structure
 */
export default async function scanRepository(ctx: Context, next: Next) {
  const { fullName } = bodySchema.parse(ctx.request.body);

  const repository = await prisma.repository.findUnique({
    where: { fullName },
  });
  if (!repository) {
    throw new APIError({
      type: "NOT_FOUND",
      message: `Repository '${fullName}' not yet registered. Have you installed the app on your repository/organization?`,
    });
  }

  const result = await analyzeRepository(repository);

  ctx.status = 200;
  ctx.body = result;
  return next();
}
