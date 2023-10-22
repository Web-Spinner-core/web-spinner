import { createAppAuth } from "@octokit/auth-app";
import { Webhooks } from "@octokit/webhooks";
import { App, Octokit } from "octokit";
import { env } from "~/env";

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
 * GitHub App for the agent
 */
export const githubApp: App = new App({
  appId: env.GH_APP_ID,
  privateKey: env.GH_PRIVATE_KEY,
});

/**
 * GitHub webhooks
 */
export const githubWebhooks = new Webhooks({
  secret: env.WEBHOOK_SECRET,
});
