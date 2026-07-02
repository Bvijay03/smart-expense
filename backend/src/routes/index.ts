import { Router } from "express";
import authRouter from "@/modules/auth/auth.router";
import usersRouter from "@/modules/users/users.router";
import expensesRouter from "@/modules/expenses/expenses.router";
import groupsRouter from "@/modules/groups/groups.router";
import sharedExpensesRouter from "@/modules/shared-expenses/shared-expenses.router";
import {
  settlementsGroupRouter,
  settlementRouter,
} from "@/modules/settlements/settlements.router";
import budgetsRouter from "@/modules/budgets/budgets.router";
import analyticsRouter from "@/modules/analytics/analytics.router";
import notificationsRouter from "@/modules/notifications/notifications.router";
import categoriesRouter from "@/modules/categories/categories.router";

const router = Router();

router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/expenses", expensesRouter);
router.use("/groups", groupsRouter);
router.use("/groups/:groupId/expenses", sharedExpensesRouter);
router.use("/groups/:groupId/settlements", settlementsGroupRouter);
router.use("/settlements", settlementRouter);
router.use("/budgets", budgetsRouter);
router.use("/analytics", analyticsRouter);
router.use("/notifications", notificationsRouter);
router.use("/categories", categoriesRouter);

export default router;
