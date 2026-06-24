import { AppError } from "@/utils/app-error";
import { usersRepository } from "./users.repository";
import { UpdateProfileInput } from "./users.schema";

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

export const usersService = {
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new AppError(404, "NOT_FOUND", "User not found");

    const updated = await usersRepository.update(userId, input);
    return sanitizeUser(updated);
  },

  async deleteAccount(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new AppError(404, "NOT_FOUND", "User not found");
    await usersRepository.softDelete(userId);
  },
};
