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
  webhooks.on("installation.created", onInstallationCreated);
  webhooks.on("installation.deleted", onInstallationDeactivated);
  webhooks.on("installation.suspend", onInstallationDeactivated);
  webhooks.on("installation.unsuspend", onInstallationReactivated);
  webhooks.onAny((event) => {
    logger.log("webhook", `Received event: '${event.name}'`);
  });
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

    // Upsert repositories, updating installation IDs if needed
    await prisma.$transaction(
      repositories.map((repository) =>
        prisma.repository.upsert({
          where: { fullName: repository.fullName },
          create: repository,
          update: {
            installationId: repository.installationId,
            name: repository.name,
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
}: WebhookHandlerParameters<"installation.deleted" | "installation.suspend">) {
  const { id } = payload.installation;
  await prisma.repository.updateMany({
    where: { installationId: id.toString() },
    data: {
      active: false,
    },
  });
}

/**
 * Reactivate a repository
 */
async function onInstallationReactivated({
  payload,
}: WebhookHandlerParameters<"installation.unsuspend">) {
  const { id } = payload.installation;
  await prisma.repository.updateMany({
    where: { installationId: id.toString() },
    data: {
      active: true,
    },
  });
}
