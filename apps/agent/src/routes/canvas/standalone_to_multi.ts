import {
  prisma
} from "database";
import { Context, Next } from "koa";
import { z } from "zod";
import { createMultiFromStandalonePage } from "~/pipelines/standalone_to_multi";

const bodySchema = z.object({
  pageId: z.string(),
});

/**
 * Convert a standalone draft page into a multi-file page
 */
export default async function convertStandaloneToMulti(
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

  const result = await createMultiFromStandalonePage(page);

  ctx.status = 200;
  ctx.body = result;
  return next();
}
