const DEFAULT_API_BASE_URL = "http://localhost:8080/api";

const sanitizeBaseUrl = (value: string): string => {
  return value.trim().replace(/\/+$/, "");
};

const readFromViteEnv = (key: string): string | undefined => {
  if (typeof import.meta === "undefined" || !import.meta.env) {
    return undefined;
  }

  const envRecord = import.meta.env as unknown as Record<string, unknown>;
  const rawValue = envRecord[key];

  if (typeof rawValue === "string" && rawValue.trim().length > 0) {
    return rawValue;
  }

  return undefined;
};

const readFromProcessEnv = (key: string): string | undefined => {
  if (typeof process === "undefined" || !process.env) {
    return undefined;
  }

  const rawValue = process.env[key];
  if (typeof rawValue === "string" && rawValue.trim().length > 0) {
    return rawValue;
  }

  return undefined;
};

let cachedBaseUrl: string | undefined;

export const getApiBaseUrl = (): string => {
  if (cachedBaseUrl) {
    return cachedBaseUrl;
  }

  const fromEnv =
    readFromViteEnv("VITE_API_BASE_URL") ??
    readFromProcessEnv("VITE_API_BASE_URL");
  const resolved = fromEnv ? sanitizeBaseUrl(fromEnv) : DEFAULT_API_BASE_URL;

  cachedBaseUrl = resolved;
  return resolved;
};

export const __TESTING__ = {
  resetApiBaseUrlCache: () => {
    cachedBaseUrl = undefined;
  },
  setApiBaseUrlOverride: (value: string | undefined) => {
    cachedBaseUrl = value ? sanitizeBaseUrl(value) : undefined;
  },
  sanitizeBaseUrl,
};

export { DEFAULT_API_BASE_URL };
