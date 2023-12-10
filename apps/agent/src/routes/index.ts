import Router from "@koa/router";
import scanIssues from "./agent/issues";
import convertCanvasInputToPage from "./canvas/canvas_to_page";
import convertStandaloneToMulti from "./canvas/standalone_to_multi";
import scanRepository from "./code_scanner/repository";
import debug from "./debug";
import createPage from "./designer/create_page";
import handleIncomingWebhook from "./webhooks";
import getPullRequestDiffs from "./repository";

const router = new Router();
router.post("/webhooks", handleIncomingWebhook);
router.post("/scan/repository", scanRepository);
router.post("/designer/page", createPage);
router.post("/agent/issues", scanIssues);
router.post("/debug", debug);
router.post("/canvas/page", convertCanvasInputToPage);
router.post("/canvas/multi", convertStandaloneToMulti);
router.post("/diffs", getPullRequestDiffs);

export default router;
