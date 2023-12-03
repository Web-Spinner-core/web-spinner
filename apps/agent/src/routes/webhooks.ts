import { type EmitterWebhookEventName } from "@octokit/webhooks";
import { Context, Next } from "koa";
import APIError from "@lib/model/api_error";
import { githubWebhooks } from "@lib/github";

/**
 * Handle an incoming webhook
 */
export default async function handleIncomingWebhook(ctx: Context, next: Next) {
  try {
    const { request } = ctx;
    githubWebhooks.verifyAndReceive({
      id: request.headers["x-github-delivery"] as string,
      name: request.headers["x-github-event"] as EmitterWebhookEventName,
      payload: request.rawBody,
      signature: request.headers["x-hub-signature-256"] as string,
    });

    ctx.status = 200;
    return next();
  } catch (err) {
    console.error(err);
    throw new APIError({
      type: "INTERNAL_SERVER_ERROR",
      message: "An error occured processing the webhook",
    });
  }
}
