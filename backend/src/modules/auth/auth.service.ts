import { AppError } from "@/utils/app-error";
import {
  comparePassword,
  compareToken,
  hashPassword,
  hashToken,
} from "@/utils/password";
import {
  generateRefreshTokenValue,
  getRefreshTokenExpiry,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/utils/jwt";
import { authRepository } from "./auth.repository";
import { LoginInput, RegisterInput, ForgotPasswordInput } from "./auth.schema";
import crypto from "crypto";
import { sendResetPasswordEmail } from "@/utils/email";

function sanitizeUser(user: {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

async function issueTokens(user: { id: string; email: string }) {
  const payload = { userId: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshTokenValue = generateRefreshTokenValue();
  const refreshToken = signRefreshToken(payload);
  const tokenHash = await hashToken(refreshTokenValue);

  await authRepository.createRefreshToken({
    userId: user.id,
    tokenHash,
    expiresAt: getRefreshTokenExpiry(),
  });

  return { accessToken, refreshToken: `${refreshToken}::${refreshTokenValue}` };
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) {
      throw new AppError(409, "EMAIL_EXISTS", "Email already registered");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await authRepository.createUser({
      email: input.email,
      passwordHash,
      name: input.name,
    });

    const tokens = await issueTokens(user);
    return { user: sanitizeUser(user), ...tokens };
  },

  async login(input: LoginInput) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    const valid = await comparePassword(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    const tokens = await issueTokens(user);
    return { user: sanitizeUser(user), ...tokens };
  },

  async refresh(refreshTokenCombined: string) {
    const sepIndex = refreshTokenCombined.lastIndexOf("::");
    if (sepIndex === -1) {
      throw new AppError(401, "INVALID_TOKEN", "Invalid refresh token");
    }
    const signedToken = refreshTokenCombined.slice(0, sepIndex);
    const rawToken = refreshTokenCombined.slice(sepIndex + 2);

    let payload;
    try {
      payload = verifyRefreshToken(signedToken);
    } catch {
      throw new AppError(401, "INVALID_TOKEN", "Invalid refresh token");
    }

    const storedTokens = await authRepository.findRefreshTokensByUserId(
      payload.userId,
    );
    let matchedId: string | null = null;
    for (const stored of storedTokens) {
      const match = await compareToken(rawToken, stored.tokenHash);
      if (match) {
        matchedId = stored.id;
        break;
      }
    }

    if (!matchedId) {
      throw new AppError(401, "INVALID_TOKEN", "Refresh token not found");
    }

    await authRepository.deleteRefreshToken(matchedId);

    const user = await authRepository.findUserById(payload.userId);
    if (!user) {
      throw new AppError(401, "INVALID_TOKEN", "User not found");
    }

    const tokens = await issueTokens(user);
    return { user: sanitizeUser(user), ...tokens };
  },

  async getMe(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new AppError(404, "NOT_FOUND", "User not found");
    }
    return sanitizeUser(user);
  },

  async logout(userId: string) {
    await authRepository.deleteAllRefreshTokens(userId);
  },

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) {
      // Do not reveal if user exists or not for security reasons
      return;
    }
    
    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    await authRepository.updateUser(user.id, {
      resetToken: token,
      resetTokenExp: expiry,
    });

    const resetLink = `${process.env.API_URL || "https://smart-expense-api-16xp.onrender.com/api/v1"}/auth/reset-password?token=${token}`;
    
    // Send email asynchronously so the mobile app doesn't timeout waiting for SMTP
    sendResetPasswordEmail(user.email, resetLink).catch(err => {
      console.error("[Email Error] Failed to send password reset email:", err);
    });
  },

  async resetPassword(token: string, newPassword: string) {
    const user = await authRepository.findUserByResetToken(token);
    
    if (!user) {
      throw new AppError(400, "INVALID_TOKEN", "Invalid or expired password reset token.");
    }

    const passwordHash = await hashPassword(newPassword);

    await authRepository.updateUser(user.id, {
      passwordHash,
      resetToken: null,
      resetTokenExp: null,
    });
    
    // Invalidate all active sessions by clearing refresh tokens
    await authRepository.deleteAllRefreshTokens(user.id);
  },
};
