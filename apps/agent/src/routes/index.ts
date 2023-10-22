import Router from "@koa/router";
import handleIncomingWebhook from "./webhooks";

const router = new Router();
router.post("/webhooks", handleIncomingWebhook);

export default router;
