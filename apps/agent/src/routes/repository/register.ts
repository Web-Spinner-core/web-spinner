import { Context, Next } from "koa";
import { z } from "zod";
import { prisma } from "database";
import { githubApp, githubClient } from "~/lib/github";
import APIError from "~/lib/api_error";
import { RequestError } from "octokit";

const bodySchema = z.object({
  owner: z.string(),
  name: z.string(),
})

interface GithubRepositoryResponse {
  data: {
    name: string;
    owner: {
      login: string;
    }
    html_url: string;
  }
}

/**
 * Register a repository in the database
 */
export default async function registerRepository(ctx: Context, next: Next) {
  const { owner, name } = bodySchema.parse(ctx.request.body);

  const existingRepository = await prisma.repository.findUnique({
    where: {
      name_owner: {
        name,
        owner,
      }
    }
  })

  if (existingRepository) {
    // Return existing repository
    ctx.status = 200;
    ctx.body = {
      repository: existingRepository,
    }
    return next();
  }

  // Look up from GH API
  let ghRepository: GithubRepositoryResponse;
  try {
    ghRepository = await githubClient.rest.repos.get({
      owner,
      repo: name,
    })
  } catch (err) {
    if (err instanceof RequestError && err.status === 404) {
      throw new APIError({ type: "NOT_FOUND", message: "Repository not found" })
    } else {
      console.error(err);
      throw new APIError({ type: "INTERNAL_SERVER_ERROR" })
    }
  }
  
  const repository = await prisma.repository.create({
    data: {
      name: ghRepository.data.name,
      owner: ghRepository.data.owner.login,
      url: ghRepository.data.html_url,
    }
  })
  ctx.status = 200;
  ctx.body = {
    repository,
  }

  next();
}