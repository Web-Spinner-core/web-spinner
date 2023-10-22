import { Octokit } from "octokit";
import { env } from "~/env";

/**
 * Client for interacting with the GitHub API
 */
export const githubClient: Octokit = new Octokit({ auth: env.GH_TOKEN });