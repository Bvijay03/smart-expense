import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

let useMemoryOnly = false;
let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;

export const tokenStorage = {
  setRememberMe(remember: boolean) {
    useMemoryOnly = !remember;
  },
  async getAccessToken() {
    if (useMemoryOnly) return memoryAccessToken;
    return SecureStore.getItemAsync(ACCESS_KEY);
  },
  async getRefreshToken() {
    if (useMemoryOnly) return memoryRefreshToken;
    return SecureStore.getItemAsync(REFRESH_KEY);
  },
  async setTokens(accessToken: string, refreshToken: string) {
    if (useMemoryOnly) {
      memoryAccessToken = accessToken;
      memoryRefreshToken = refreshToken;
    } else {
      await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    }
  },
  async clear() {
    memoryAccessToken = null;
    memoryRefreshToken = null;
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};
