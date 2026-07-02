import { Router } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { recurringController } from "./recurring.controller";

const router = Router();

router.use(authMiddleware);
router.get("/", recurringController.list);
router.post("/", recurringController.create);
router.patch("/:id", recurringController.update);
router.patch("/:id/toggle", recurringController.toggleActive);
router.delete("/:id", recurringController.delete);
router.post("/process", recurringController.process);

export default router;
