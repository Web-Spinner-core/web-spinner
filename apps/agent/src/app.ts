import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { githubWebhooks } from "./lib/github";
import { registerWebhookListeners } from "./lib/github/webhooks";
import router from "./routes";
import errorHandler from "./routes/middleware/error_handler";

const app = new Koa();
app.use(bodyParser());
app.use(errorHandler);

// Register GitHub webhook listeners
registerWebhookListeners(githubWebhooks);

app.use(router.routes());

export default app;
