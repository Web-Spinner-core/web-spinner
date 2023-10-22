import { EmitterWebhookEventName, Webhooks } from "@octokit/webhooks";
import { HandlerFunction } from "@octokit/webhooks/dist-types/types";
import { ID_PREFIXES, generatePrefixedId, prisma } from "database";

/**
 * GitHub webhook handler
 */
type WebhookHandlerParameters<E extends EmitterWebhookEventName> = Parameters<
  HandlerFunction<E, unknown>
>[0];

/**
 * Register webhook listeners for the GitHub App
 */
export async function registerWebhookListeners(webhooks: Webhooks) {
  webhooks.on("installation.created", onInstallationCreated);
}

/**
 * Handle the installation.created event
 */
async function onInstallationCreated({
  payload,
}: WebhookHandlerParameters<"installation.created">) {
  if (payload.repositories?.length) {
    const repositories = payload.repositories.map((repo) => ({
      id: generatePrefixedId(ID_PREFIXES.REPOSITORY),
      name: repo.name,
      fullName: repo.full_name,
      installationId: payload.installation.id.toString(),
    }));

    await prisma.repository.createMany({
      data: repositories,
    });
  }
}
