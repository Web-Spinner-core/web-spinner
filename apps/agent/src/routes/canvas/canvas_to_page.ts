import {
  ID_PREFIXES,
  Page,
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
});

const REPOSITORY_ID = "repo_ztfisxzlfeeitv4";

/**
 * Scan issues in a repository and attempt to solve them
 */
export default async function convertCanvasInputToPage(
  ctx: Context,
  next: Next
) {
  const { canvasPageId, pageName, imageUrl, pageText } = bodySchema.parse(
    ctx.request.body
  );

  const repository = await prisma.repository.findUniqueOrThrow({
    where: { id: REPOSITORY_ID },
    include: {
      pages: true,
    },
  });

  // Pull other page screenshot if it exists
  let styleImageUrl: string | undefined;
  if (repository.pages.length > 1) {
    const stylePage = repository.pages.find((page) => page.name != pageName);
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
      repositoryId_canvasPageId: {
        canvasPageId,
        repositoryId: REPOSITORY_ID,
      },
    },
    update: {
      standaloneCode: result,
    },
    create: {
      id: generatePrefixedId(ID_PREFIXES.PAGE),
      canvasPageId,
      repositoryId: REPOSITORY_ID,
      name: pageName,
      standaloneCode: result,
    },
  });

  // Save async
  if (!page.screenshotPath) {
    void savePageScreenshot(result, repository, page).catch(console.error);
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
  repository: Repository,
  page: Page
) {
  const screenshot = await captureRenderedHtml(html);
  const fileName = `${repository.fullName}/${page.name}.png`;

  const storageClient = new StorageClient();
  storageClient.uploadFile(fileName, screenshot);

  await prisma.page.update({
    where: { id: page.id },
    data: { screenshotPath: fileName },
  });
}
