import { RestEndpointMethodTypes } from "@octokit/rest";
import { prisma } from "database";
import { Context, Next } from "koa";
import { z } from "zod";
import APIError from "~/lib/api_error";
import { getGithubInstallationClient } from "~/lib/github";

const bodySchema = z.object({
  fullName: z.string(),
});

type GitHubContentResponse =
  RestEndpointMethodTypes["repos"]["getContent"]["response"];

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

  const installationClient = getGithubInstallationClient(
    repository.installationId
  );

  const [owner, repo] = fullName.split("/");
  const content = await installationClient.rest.repos.getContent({
    owner,
    repo,
    path: "",
  });
  if (Array.isArray(content.data)) {
    handleDirectory(content.data);
  }

  ctx.status = 200;
  ctx.body = {
    message: `Repository '${fullName}' found`,
  };
  return next();
}

function handleDirectory(data: GitHubContentResponse["data"]) {
  if (Array.isArray(data)) {
    data.forEach((item) => console.log(item.path));
  }
}
