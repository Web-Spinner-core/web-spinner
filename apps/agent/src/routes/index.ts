import Router from "@koa/router";
import handleIncomingWebhook from "./webhooks";
import scanRepository from "./code_scanner/repository";
import createPage from "./designer/create_page";
import scanIssues from "./agent/issues";
import debug from "./debug";
import convertCanvasInputToPage from "./canvas/canvas_to_page";

const router = new Router();
router.post("/webhooks", handleIncomingWebhook);
router.post("/scan/repository", scanRepository);
router.post("/designer/page", createPage);
router.post("/agent/issues", scanIssues);
router.post("/debug", debug);
router.post("/canvas/page", convertCanvasInputToPage);

export default router;
