import {
  prisma
} from "database";
import { Context, Next } from "koa";
import { z } from "zod";
import { createPlanAgentExecutor } from "~/agents/plan_agent";

const bodySchema = z.object({
  pageId: z.string(),
});

/**
 * Scan issues in a repository and attempt to solve them
 */
export default async function convertCanvasInputToPage(
  ctx: Context,
  next: Next
) {
  const { pageId } = bodySchema.parse(
    ctx.request.body
  );

  const page = await prisma.page.findUniqueOrThrow({
    where: { id: pageId },
    include: {
      project: {
        include: {
          repository: true
        }
      },
    },
  });

  ctx.status = 200;
  ctx.body = result;
  return next();
}
