import Koa from "koa";
import bodyParser from "koa-bodyparser";
import router from "./routes/router";

const app = new Koa();
app.use(bodyParser());
app.use(router.routes());

export default app;