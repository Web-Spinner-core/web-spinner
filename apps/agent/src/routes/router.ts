import Router from "@koa/router";
import registerRepository from "./repository/register";

const router = new Router();
router.post("/repository", registerRepository)

export default router;