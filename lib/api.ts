import { useAuthStore } from "@/store/authStore";

export function getApiBase(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    // If running in browser and envUrl points to localhost while on live site, default to relative /api
    if (!envUrl || (envUrl.includes("localhost") && !window.location.hostname.includes("localhost"))) {
      return "/api";
    }
    return envUrl;
  }
  return envUrl || "/api";
}

const API_BASE = getApiBase();

let refreshPromise: Promise<string> | null = null;

// Refresh the access token silently using the refresh token
export const refreshAccessToken = async (): Promise<string> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("No refresh token");

  refreshPromise = (async () => {
    try {
      const baseUrl = getApiBase();
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        localStorage.removeItem("refreshToken");
        useAuthStore.getState().logout();
        throw new Error("Session expired");
      }

      const { accessToken } = await res.json();
      useAuthStore.getState().setAccessToken(accessToken);
      return accessToken;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Use this instead of fetch() for all protected routes
export const authFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  let accessToken =
    useAuthStore.getState().accessToken ||
    (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);
  const baseUrl = getApiBase();

  const makeRequest = (token: string, forceReload = false) => {
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    const defaultHeaders: Record<string, string> = {};

    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    if (!isFormData && options.body) {
      defaultHeaders["Content-Type"] = "application/json";
    }

    const cacheMode = forceReload ? "reload" : (options.cache ?? (options.method && options.method.toUpperCase() !== "GET" ? "no-store" : "default"));

    return fetch(`${baseUrl}${url}`, {
      cache: cacheMode,
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });
  };

  let res = await makeRequest(accessToken!);

  // If browser cache returned 304 Not Modified, force reload to retrieve full JSON body
  if (res.status === 304) {
    res = await makeRequest(accessToken!, true);
  }

  // If 401, try refreshing the token once then retry
  if (res.status === 401) {
    try {
      accessToken = await refreshAccessToken();
      res = await makeRequest(accessToken);
    } catch {
      // Refresh failed — redirect to login
      window.location.href = "/learn/lms";
    }
  }

  return res;
};

export { API_BASE };