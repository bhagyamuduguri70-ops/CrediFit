export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  withCredentials?: boolean;
  [key: string]: any;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

class ApiError extends Error {
  response?: {
    status: number;
    data: any;
  };
  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = "ApiError";
    if (status !== undefined) {
      this.response = { status, data };
    }
  }
}

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.data?.accessToken) {
      localStorage.setItem("credifit_token", data.data.accessToken);
      if (data.data.user) {
        localStorage.setItem("credifit_user", JSON.stringify(data.data.user));
      }
      return data.data.accessToken;
    }
  } catch (err) {
    console.error("Token refresh failed:", err);
  }
  return null;
}

async function request<T = any>(
  method: string,
  endpoint: string,
  bodyData?: any,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  let url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  // Append query params if provided
  if (config.params) {
    const searchParams = new URLSearchParams();
    Object.entries(config.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) searchParams.append(key, String(val));
    });
    const qs = searchParams.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }

  const token = localStorage.getItem("credifit_token");
  const headers = new Headers(config.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body: BodyInit | undefined = undefined;
  if (bodyData !== undefined && bodyData !== null) {
    if (bodyData instanceof FormData) {
      body = bodyData;
      // Let browser set multipart boundary
    } else {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      body = JSON.stringify(bodyData);
    }
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    body,
    credentials: "include",
  };

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (networkErr: any) {
    throw new ApiError(networkErr.message || "Network error. Unable to reach backend server.", 0);
  }

  // Handle 401 & Automatic Refresh
  const isAuthEndpoint =
    endpoint.includes("/auth/login") ||
    endpoint.includes("/auth/register") ||
    endpoint.includes("/auth/refresh");

  if (response.status === 401 && !isAuthEndpoint && !config._retry) {
    config._retry = true;

    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;

      refreshQueue.forEach((cb) => cb(newToken));
      refreshQueue = [];

      if (newToken) {
        return request<T>(method, endpoint, bodyData, config);
      } else {
        localStorage.removeItem("credifit_token");
        localStorage.removeItem("credifit_user");
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    } else {
      // Wait for in-flight refresh
      return new Promise<ApiResponse<T>>((resolve, reject) => {
        refreshQueue.push((token) => {
          if (token) {
            resolve(request<T>(method, endpoint, bodyData, config));
          } else {
            reject(new ApiError("Session expired", 401));
          }
        });
      });
    }
  }

  const responseContentType = response.headers.get("content-type");
  let data: any = null;
  if (responseContentType && responseContentType.includes("application/json")) {
    data = await response.json().catch(() => ({}));
  } else {
    data = await response.text().catch(() => "");
  }

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `HTTP error ${response.status}: ${response.statusText}`;
    throw new ApiError(errorMsg, response.status, data);
  }

  return {
    data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };
}

export const api = {
  get: <T = any>(url: string, config?: RequestConfig) => request<T>("GET", url, undefined, config),
  post: <T = any>(url: string, data?: any, config?: RequestConfig) => request<T>("POST", url, data, config),
  put: <T = any>(url: string, data?: any, config?: RequestConfig) => request<T>("PUT", url, data, config),
  patch: <T = any>(url: string, data?: any, config?: RequestConfig) => request<T>("PATCH", url, data, config),
  delete: <T = any>(url: string, config?: RequestConfig) => request<T>("DELETE", url, undefined, config),
};

export default api;
