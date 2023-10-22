import { Context, Next } from "koa";
import { z } from "zod";
import { prisma } from "database";
import { githubClient } from "~/lib/github";

const bodySchema = z.object({
  owner: z.string(),
  name: z.string(),
})

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
    ctx.body = {
      repository: existingRepository,
    }
    return next();
  }

  // Look up from GH API
  const ghRepository = await githubClient.rest.repos.get({
    owner,
    repo: name,
  })
  if (!ghRepository.data) {
    ctx.throw(404, "Repository not found");
  }

  const repository = await prisma.repository.create({
    data: {
      name: ghRepository.data.name,
      owner: ghRepository.data.owner.login,
      url: ghRepository.data.html_url,
    }
  })
  ctx.body = {
    repository,
  }

  next();
}