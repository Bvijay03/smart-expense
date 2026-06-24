import { Router } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { validateParams } from "@/middlewares/validate.middleware";
import { settlementsController } from "./settlements.controller";
import { groupIdParamSchema, settlementIdSchema } from "./settlements.schema";

const groupRouter = Router({ mergeParams: true });
groupRouter.use(authMiddleware);
groupRouter.get(
  "/balances",
  validateParams(groupIdParamSchema),
  settlementsController.getBalances,
);
groupRouter.get(
  "/",
  validateParams(groupIdParamSchema),
  settlementsController.list,
);

const settlementRouter = Router();
settlementRouter.use(authMiddleware);
settlementRouter.patch(
  "/:id",
  validateParams(settlementIdSchema),
  settlementsController.markSettled,
);
settlementRouter.post(
  "/:id/settle",
  validateParams(settlementIdSchema),
  settlementsController.settleWithAmount,
);

export { groupRouter as settlementsGroupRouter, settlementRouter };
