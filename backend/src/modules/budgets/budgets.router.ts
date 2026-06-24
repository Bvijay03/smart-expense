import { Router } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middlewares/validate.middleware";
import { budgetsController } from "./budgets.controller";
import {
  budgetIdSchema,
  budgetQuerySchema,
  createBudgetSchema,
  updateBudgetSchema,
} from "./budgets.schema";

const router = Router();

router.use(authMiddleware);
router.get("/", validateQuery(budgetQuerySchema), budgetsController.list);
router.post("/", validateBody(createBudgetSchema), budgetsController.create);
router.patch(
  "/:id",
  validateParams(budgetIdSchema),
  validateBody(updateBudgetSchema),
  budgetsController.update,
);
router.delete(
  "/:id",
  validateParams(budgetIdSchema),
  budgetsController.delete,
);

export default router;
