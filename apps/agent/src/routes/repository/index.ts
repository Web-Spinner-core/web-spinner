import { getGithubInstallationClient } from "@lib/github";
import GithubRepositoryClient from "@lib/github/repository_client";
import { prisma } from "database";
import { Context, Next } from "koa";
import { z } from "zod";

const bodySchema = z.object({
  pageId: z.string(),
});

/**
 * Get diffs associated with a page
 */
export default async function getPullRequestDiffs(ctx: Context, next: Next) {
  const { pageId } = bodySchema.parse(ctx.request.body);
  const page = await prisma.page.findUniqueOrThrow({
    where: { id: pageId },
    include: {
      project: {
        include: {
          repository: true,
        },
      },
    },
  });

  if (!page.prNum) {
    throw new Error("Page does not have a pull request yet!");
  }

  const installationClient = getGithubInstallationClient(
    page.project.repository.installationId
  );
  const repositoryClient = new GithubRepositoryClient(installationClient, page.project.repository);
  const diffs = await repositoryClient.getPullRequestDiffs(page.prNum);

  ctx.status = 200;
  ctx.body = diffs;
  return next();
}
