import { Context, Next } from "koa";
import { ZodError } from "zod";
import APIError from "@lib/model/api_error";

/**
 * Global error handler
 */
export default async function errorHandler(ctx: Context, next: Next) {
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
      console.error(err);
      console.error(typedError?.message ?? typedError?.type ?? typedError);
      ctx.status = typedError?.statusCode ?? 500;
      ctx.body = {
        message: typedError?.message ?? typedError?.type ?? "An error occured",
      };
    }
  }
}
