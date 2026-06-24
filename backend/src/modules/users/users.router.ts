import { Router } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { validateBody } from "@/middlewares/validate.middleware";
import { usersController } from "./users.controller";
import { updateProfileSchema } from "./users.schema";

const router = Router();

router.use(authMiddleware);
router.patch("/me", validateBody(updateProfileSchema), usersController.updateMe);
router.delete("/me", usersController.deleteMe);

export default router;
