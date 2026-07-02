import { AppError } from "@/utils/app-error";
import { categoriesRepository } from "./categories.repository";
import { CreateCategoryInput } from "./categories.schema";

const DEFAULT_CATEGORIES = [
  { name: "Food", icon: "fast-food-outline", color: "#F59E0B" },
  { name: "Transport", icon: "car-outline", color: "#06B6D4" },
  { name: "Shopping", icon: "bag-outline", color: "#EC4899" },
  { name: "Entertainment", icon: "game-controller-outline", color: "#8B5CF6" },
  { name: "Bills", icon: "document-text-outline", color: "#EF4444" },
  { name: "Health", icon: "medkit-outline", color: "#22C55E" },
  { name: "Education", icon: "school-outline", color: "#4F46E5" },
  { name: "Travel", icon: "airplane-outline", color: "#14B8A6" },
  { name: "Other", icon: "pricetag-outline", color: "#64748B" },
];

export const categoriesService = {
  async list(userId: string) {
    const userCategories = await categoriesRepository.findByUser(userId);
    const userCatNames = new Set(userCategories.map((c) => c.name));

    // Merge defaults (not already overridden by user) + user custom categories
    const defaults = DEFAULT_CATEGORIES
      .filter((d) => !userCatNames.has(d.name))
      .map((d) => ({
        id: `default-${d.name}`,
        name: d.name,
        icon: d.icon,
        color: d.color,
        isDefault: true,
      }));

    const custom = userCategories.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      isDefault: false,
    }));

    return [...defaults, ...custom].sort((a, b) => a.name.localeCompare(b.name));
  },

  async create(userId: string, input: CreateCategoryInput) {
    try {
      const category = await categoriesRepository.create({ userId, ...input });
      return {
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        isDefault: false,
      };
    } catch {
      throw new AppError(409, "CATEGORY_EXISTS", "Category with this name already exists");
    }
  },

  async delete(userId: string, id: string) {
    const category = await categoriesRepository.findById(id, userId);
    if (!category) throw new AppError(404, "NOT_FOUND", "Category not found");
    await categoriesRepository.delete(id);
  },
};
