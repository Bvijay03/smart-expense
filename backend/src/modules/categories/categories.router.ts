import { Router } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { categoriesController } from "./categories.controller";

const router = Router();

router.use(authMiddleware);
router.get("/", categoriesController.list);
router.post("/", categoriesController.create);
router.delete("/:id", categoriesController.delete);

export default router;
