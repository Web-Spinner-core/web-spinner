import { EmitterWebhookEventName, Webhooks } from "@octokit/webhooks";
import { HandlerFunction } from "@octokit/webhooks/dist-types/types";
import { ID_PREFIXES, generatePrefixedId, prisma } from "database";
import { logger } from "../logger";

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
  webhooks.on("installation_repositories.added", onInstallationCreated);
  webhooks.on("installation_repositories.removed", onInstallationDeactivated);
  webhooks.onAny((event) => {
    logger.log("webhook", `Received event: '${event.name}'`);
  });
}

/**
 * Handle the installation.created event
 */
async function onInstallationCreated({
  payload,
}: WebhookHandlerParameters<"installation_repositories.added">) {
  if (payload.repositories_added?.length) {
    const repositories = payload.repositories_added.map((repo) => ({
      id: generatePrefixedId(ID_PREFIXES.REPOSITORY),
      name: repo.name,
      fullName: repo.full_name,
      installationId: payload.installation.id.toString(),
    }));

    // Upsert repositories, updating installation IDs if needed
    await prisma.$transaction(
      repositories.map((repository) =>
        prisma.repository.upsert({
          where: { fullName: repository.fullName },
          create: repository,
          update: {
            installationId: repository.installationId,
            name: repository.name,
            active: true,
          },
        })
      )
    );
  }
}

/**
 * Mark a repository as inactive
 */
async function onInstallationDeactivated({
  payload,
}: WebhookHandlerParameters<"installation_repositories.removed">) {
  const { id } = payload.installation;
  if (payload.repositories_removed.length) {
    const repositories = payload.repositories_removed.map(
      (repo) => repo.full_name
    );
    await prisma.repository.updateMany({
      where: {
        installationId: id.toString(),
        fullName: { in: repositories },
      },
      data: { active: false },
    });
  }
}
