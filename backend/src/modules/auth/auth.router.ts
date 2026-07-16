import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware, AuthRequest } from "@/middlewares/auth.middleware";
import { validateBody } from "@/middlewares/validate.middleware";
import { authController } from "./auth.controller";
import {
  loginSchema,
  refreshSchema,
  registerSchema,
  forgotPasswordSchema,
  securityResetSchema,
  updateSecuritySchema,
} from "./auth.schema";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: { code: "RATE_LIMIT", message: "Too many requests" } },
});

const router = Router();

router.post(
  "/register",
  authLimiter,
  validateBody(registerSchema),
  authController.register,
);
router.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  authController.login,
);
router.post(
  "/refresh",
  authLimiter,
  validateBody(refreshSchema),
  authController.refresh,
);
router.post(
  "/forgot-password/question",
  authLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post(
  "/forgot-password/reset",
  authLimiter,
  validateBody(securityResetSchema),
  authController.resetPassword
);
router.put(
  "/security-question",
  authMiddleware,
  validateBody(updateSecuritySchema),
  authController.updateSecurityQuestion
);
router.get("/me", authMiddleware, authController.me);
router.post("/logout", authMiddleware, authController.logout);

export default router;
