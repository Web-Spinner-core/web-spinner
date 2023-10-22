import { ID_PREFIXES, generatePrefixedId, prisma } from "database";
import { Context, Next } from "koa";
import { RequestError } from "octokit";
import { z } from "zod";
import APIError from "~/lib/api_error";
import { githubClient } from "~/lib/github";

const bodySchema = z.object({
  owner: z.string(),
  name: z.string(),
});

interface GithubRepositoryResponse {
  data: {
    name: string;
    owner: {
      login: string;
    };
    full_name: string;
    html_url: string;
  };
}

/**
 * Register a repository in the database
 */
export default async function registerRepository(ctx: Context, next: Next) {
  const { owner, name } = bodySchema.parse(ctx.request.body);

  const existingRepository = await prisma.repository.findUnique({
    where: {
      fullName: `${owner}/${name}`,
    },
  });

  if (existingRepository) {
    // Return existing repository
    ctx.status = 200;
    ctx.body = {
      repository: existingRepository,
    };
    return next();
  }

  // Look up from GH API
  let ghRepository: GithubRepositoryResponse;
  try {
    ghRepository = await githubClient.rest.repos.get({
      owner,
      repo: name,
    });
  } catch (err) {
    if (err instanceof RequestError && err.status === 404) {
      throw new APIError({
        type: "NOT_FOUND",
        message: "Repository not found",
      });
    } else {
      console.error(err);
      throw new APIError({ type: "INTERNAL_SERVER_ERROR" });
    }
  }

  const repository = await prisma.repository.create({
    data: {
      id: generatePrefixedId(ID_PREFIXES.REPOSITORY),
      name: ghRepository.data.name,
      fullName: ghRepository.data.full_name,
      installationId: "0",
    },
  });
  ctx.status = 200;
  ctx.body = {
    repository,
  };

  next();
}
