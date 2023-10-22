import Router from "@koa/router";
import handleIncomingWebhook from "./webhooks";
import scanRepository from "./code_scanner/repository";

const router = new Router();
router.post("/webhooks", handleIncomingWebhook);
router.post("/scan/repository", scanRepository);

export default router;
