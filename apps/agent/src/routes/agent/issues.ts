import { prisma } from "database";
import { Context, Next } from "koa";
import { z } from "zod";
import APIError from "@lib/model/api_error";
import { getGithubInstallationClient } from "@lib/github";
import GithubRepositoryClient from "@lib/github/repository_client";
import { createPageWithVision } from "~/pipelines/create_page_with_vision";

const bodySchema = z.object({
  repo: z.string(),
});

/**
 * Scan issues in a repository and attempt to solve them
 */
export default async function scanIssues(ctx: Context, next: Next) {
  const { repo: fullName } = bodySchema.parse(ctx.request.body);

  const repository = await prisma.repository.findUnique({
    where: { fullName },
  });
  if (!repository) {
    throw new APIError({
      type: "NOT_FOUND",
      message: `Repository '${fullName}' not yet registered. Have you installed the app on your repository/organization?`,
    });
  }

  const client = await getGithubInstallationClient(repository.installationId);
  const repositoryClient = new GithubRepositoryClient(client, repository);
  const issues = await repositoryClient.getIssues();
  const issue = issues[0]!;

  const body = issue.body!;
  const imageUrls = await repositoryClient.getIssueImageUrls(issue.number);
  const imageUrl = imageUrls[0]!;

  const result = await createPageWithVision(
    repository,
    body,
    imageUrl,
    issue.number
  );

  ctx.status = 200;
  ctx.body = result;
  return next();
}
