import { prisma } from "database";
import { Context, Next } from "koa";
import { z } from "zod";
import APIError from "@lib/model/api_error";

const bodySchema = z.object({
  repo: z.string(),
  description: z.string(),
});

/**
 * Create a new component that fits with the design language of the project
 */
export default async function createComponent(ctx: Context, next: Next) {
  const { repo, description } = bodySchema.parse(ctx.request.body);

  const repository = await prisma.repository.findUnique({
    where: { fullName: repo },
  });
  if (!repository) {
    throw new APIError({
      type: "NOT_FOUND",
      message: `Repository '${repo}' not yet registered. Have you installed the app on your repository/organization?`,
    });
  }

  // TODO: Implement createComponent
  // const result = await createProjectPage(repository, description);

  ctx.status = 200;
  ctx.body = null;
  return next();
}
