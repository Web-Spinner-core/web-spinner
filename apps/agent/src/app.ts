import Koa from "koa";
import bodyParser from "koa-bodyparser";
import router from "./routes/router";
import dotenv from "dotenv";
import { ZodError } from "zod";
import APIError from "./lib/api_error";

dotenv.config();

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

app.use(router.routes());

export default app;