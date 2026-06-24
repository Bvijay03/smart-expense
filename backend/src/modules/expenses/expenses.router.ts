import { Router } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/middlewares/validate.middleware";
import { expensesController } from "./expenses.controller";
import {
  createExpenseSchema,
  expenseIdSchema,
  expenseQuerySchema,
  updateExpenseSchema,
} from "./expenses.schema";

const router = Router();

router.use(authMiddleware);
router.get("/", validateQuery(expenseQuerySchema), expensesController.list);
router.post("/", validateBody(createExpenseSchema), expensesController.create);
router.get(
  "/:id",
  validateParams(expenseIdSchema),
  expensesController.getById,
);
router.patch(
  "/:id",
  validateParams(expenseIdSchema),
  validateBody(updateExpenseSchema),
  expensesController.update,
);
router.delete(
  "/:id",
  validateParams(expenseIdSchema),
  expensesController.delete,
);

export default router;
