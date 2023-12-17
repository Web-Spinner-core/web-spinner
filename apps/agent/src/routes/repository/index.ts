import { getGithubInstallationClient } from "@lib/github";
import GithubRepositoryClient from "@lib/github/repository_client";
import { prisma } from "database";
import { Context, Next } from "koa";
import { z } from "zod";

const paramsSchema = z.object({
  pageIds: z.string().array(),
});

/**
 * Get diffs associated with a page
 */
export default async function getPullRequestDiffs(ctx: Context, next: Next) {
  const { pageIds } = paramsSchema.parse(ctx.request.body);
  const pages = await prisma.page.findMany({
    where: {
      id: {
        in: pageIds,
      },
    },
    include: {
      project: {
        include: {
          repository: true,
        },
      },
    },
  });

  const diffs = [];
  for (const page of pages) {
    const installationClient = getGithubInstallationClient(
      page.project.repository.installationId
    );
    const repositoryClient = new GithubRepositoryClient(
      installationClient,
      page.project.repository
    );
    if (page.prNum) {
      const pageDiffs = await repositoryClient.getPullRequestDiffs(page.prNum);
      diffs.push([page.id, page.prNum, pageDiffs]);
    }
  }

  ctx.status = 200;
  ctx.body = diffs;
  console.log("Queried backend: ", diffs.length);
  return next();
}
