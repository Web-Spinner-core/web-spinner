import { Context, Next } from "koa";
import { z } from "zod";
import convertCanvasToPage from "~/pipelines/canvas_to_page";

const bodySchema = z.object({
  imageUrl: z.string(),
  selectionText: z.string()
});

/**
 * Scan issues in a repository and attempt to solve them
 */
export default async function convertCanvasInputToPage(ctx: Context, next: Next) {
  const { imageUrl, selectionText } = bodySchema.parse(ctx.request.body);

  const result = await convertCanvasToPage(imageUrl, selectionText);
  
  ctx.status = 200;
  ctx.body = result;
  return next();
}
