import { createAppAuth } from "@octokit/auth-app";
import { Webhooks } from "@octokit/webhooks";
import { Octokit } from "@octokit/rest";
import { env } from "@lib/env";

/**
 * GitHub client authenticated as the app
 */
export const githubClient: Octokit = new Octokit({
  authStrategy: createAppAuth,
  auth: {
    appId: env.GH_APP_ID,
    privateKey: env.GH_PRIVATE_KEY,
    clientId: env.GH_CLIENT_ID,
    clientSecret: env.GH_CLIENT_SECRET,
  },
});

/**
 * GitHub webhooks
 */
export const githubWebhooks = new Webhooks({
  secret: env.WEBHOOK_SECRET,
});

/**
 * Get a GitHub client authenticated as an installation
 */
export function getGithubInstallationClient(installationId: string): Octokit {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: env.GH_APP_ID,
      privateKey: env.GH_PRIVATE_KEY,
      clientId: env.GH_CLIENT_ID,
      clientSecret: env.GH_CLIENT_SECRET,
      installationId,
    },
  });
}
