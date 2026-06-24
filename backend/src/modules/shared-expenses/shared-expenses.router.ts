import { Router } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";
import {
  validateBody,
  validateParams,
} from "@/middlewares/validate.middleware";
import { sharedExpensesController } from "./shared-expenses.controller";
import {
  createSharedExpenseSchema,
  groupExpenseParamsSchema,
  sharedExpenseIdSchema,
} from "./shared-expenses.schema";

const router = Router({ mergeParams: true });

router.use(authMiddleware);
router.get(
  "/",
  validateParams(groupExpenseParamsSchema),
  sharedExpensesController.list,
);
router.post(
  "/",
  validateParams(groupExpenseParamsSchema),
  validateBody(createSharedExpenseSchema),
  sharedExpensesController.create,
);
router.get(
  "/:id",
  validateParams(sharedExpenseIdSchema),
  sharedExpensesController.getById,
);
router.delete(
  "/:id",
  validateParams(sharedExpenseIdSchema),
  sharedExpensesController.delete,
);

export default router;
