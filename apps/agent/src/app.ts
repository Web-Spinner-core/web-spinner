import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { ZodError } from "zod";
import APIError from "./lib/api_error";
import { githubWebhooks } from "./lib/github";
import { registerWebhookListeners } from "./lib/github/webhooks";
import router from "./routes";

const app = new Koa();
app.use(bodyParser());

// Set error handler
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (err instanceof ZodError) {
      console.error(err.issues);
      // Argument type validation
      ctx.status = 400;
      ctx.body = {
        errors: err.issues,
        message: err.message,
      };
    } else {
      const typedError = err as APIError;
      console.error(typedError?.message ?? typedError?.type ?? typedError);
      ctx.status = typedError?.statusCode ?? 500;
      ctx.body = {
        message: typedError?.message ?? typedError?.type ?? "An error occured",
      };
    }
  }
});

// Register GitHub webhook listeners
registerWebhookListeners(githubWebhooks);

app.use(router.routes());

export default app;
