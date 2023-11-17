import Router from "@koa/router";
import handleIncomingWebhook from "./webhooks";
import scanRepository from "./code_scanner/repository";
import createPage from "./designer/create_page";
import scanIssues from "./agent/issues";

const router = new Router();
router.post("/webhooks", handleIncomingWebhook);
router.post("/scan/repository", scanRepository);
router.post("/designer/page", createPage);
router.post("/agent/issues", scanIssues);

export default router;
