import Constants from "expo-constants";

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

const expoConfig = Constants.expoConfig as any;
const expoGoConfig = Constants.expoGoConfig as any;
const manifest = Constants.manifest as any;
const manifest2 = Constants.manifest2 as any;

const expoExtra =
  expoConfig?.extra ||
  manifest?.extra ||
  manifest2?.extra ||
  undefined;

const extraApiUrl =
  expoExtra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  undefined;

const rawHost =
  expoConfig?.hostUri ||
  expoGoConfig?.hostUri ||
  manifest?.hostUri ||
  manifest?.debuggerHost ||
  manifest2?.hostUri ||
  manifest2?.extra?.expoClient?.hostUri ||
  manifest2?.extra?.expoClient?.debuggerHost ||
  manifest2?.extra?.expoGo?.hostUri ||
  manifest2?.extra?.expoGo?.debuggerHost ||
  undefined;

function resolveHost(host?: string) {
  if (!host) return undefined;
  const trimmed = host.trim();
  try {
    const normalized = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `http://${trimmed}`;
    return new URL(normalized).hostname;
  } catch {
    return trimmed.split(/[:/]/)[0];
  }
}

const expoHost = resolveHost(rawHost);
const dynamicExpoUrl = expoHost ? `http://${expoHost}:3000/api/v1` : undefined;

// If .env is a cloud HTTPS URL → always use it directly (skip Expo host detection)
// Otherwise fall back to dynamic Expo host (correct for local Expo Go dev)
const isCloudUrl = extraApiUrl?.startsWith("https://");
export const API_URL = isCloudUrl
  ? extraApiUrl!
  : dynamicExpoUrl || extraApiUrl || "http://10.0.2.2:3000/api/v1";
