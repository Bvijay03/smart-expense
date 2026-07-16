import { z } from "zod";

export const registerSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  securityQuestion: z.string().min(5, "Security question is required").optional(),
  securityAnswer: z.string().min(1, "Security answer is required").optional(),
});

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Invalid email address"),
});

export const securityResetSchema = z.object({
  email: z.email("Invalid email address"),
  securityAnswer: z.string().min(1, "Answer is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type SecurityResetInput = z.infer<typeof securityResetSchema>;
