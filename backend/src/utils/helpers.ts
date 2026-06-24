export function decimalToNumber(value: { toString(): string } | number | string): number {
  return Number(value);
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Bills",
  "Health",
  "Education",
  "Travel",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
