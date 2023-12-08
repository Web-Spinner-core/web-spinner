import {
  ID_PREFIXES,
  Page,
  Project,
  Repository,
  generatePrefixedId,
  prisma,
} from "database";
import { Context, Next } from "koa";
import { z } from "zod";
import { captureRenderedHtml } from "@lib/util/capture_html";
import StorageClient from "@lib/storage/client";
import convertCanvasToPage from "~/pipelines/canvas_to_page";

const bodySchema = z.object({
  canvasPageId: z.string(),
  pageName: z.string(),
  imageUrl: z.string(),
  pageText: z.string(),
  projectId: z.string(),
});

/**
 * Convert a canvas drawing into a standalone page
 */
export default async function convertCanvasInputToPage(
  ctx: Context,
  next: Next
) {
  const { projectId, canvasPageId, pageName, imageUrl, pageText } = bodySchema.parse(
    ctx.request.body
  );

  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      pages: true,
    },
  });

  // Pull other page screenshot if it exists
  let styleImageUrl: string | undefined;
  if (project.pages.length > 1) {
    const stylePage = project.pages.find((page) => page.name != pageName);
    if (stylePage && stylePage.screenshotPath) {
      const storageClient = new StorageClient();
      styleImageUrl = await storageClient.generateSignedUrl(stylePage.screenshotPath);
    }
  }

  const result = await convertCanvasToPage({
    imageUrl,
    pageText,
    styleImageUrl,
  });

  // Update prisma
  const page = await prisma.page.upsert({
    where: {
      projectId_canvasPageId: {
        canvasPageId,
        projectId,
      },
    },
    update: {
      standaloneCode: result,
    },
    create: {
      id: generatePrefixedId(ID_PREFIXES.PAGE),
      canvasPageId,
      projectId,
      name: pageName,
      standaloneCode: result,
    },
  });

  // Save async
  if (!page.screenshotPath) {
    void savePageScreenshot(result, project, page).catch(console.error);
  }

  ctx.status = 200;
  ctx.body = result;
  return next();
}

/**
 * Save screenshot to AWS bucket and update prisma
 */
async function savePageScreenshot(
  html: string,
  project: Project,
  page: Page
) {
  const screenshot = await captureRenderedHtml(html);
  const fileName = `${project.id}/${page.id}.png`;

  const storageClient = new StorageClient();
  storageClient.uploadFile(fileName, screenshot);

  await prisma.page.update({
    where: { id: page.id },
    data: { screenshotPath: fileName },
  });
}
