import { Context, Next } from "koa";

/**
 * Debug endpoint
 */
export default async function debug(ctx: Context, next: Next) {
  ctx.status = 200;
  ctx.body = "OK";
  return next();
}
