import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// ── Request interceptor — attach access token ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Refresh queue — holds requests that arrived while a refresh was in progress ──
let isRefreshing = false;
let refreshQueue: ((token: string) => void)[] = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ── Guards — skip refresh entirely if any of these are true ──
    const accessToken = localStorage.getItem("accessToken");
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/login");

    if (
      error.response?.status !== 401 || // not a 401
      originalRequest._retry ||         // already retried once
      !accessToken ||                   // no token = user not logged in (fixes login page error)
      isAuthEndpoint                    // don't refresh if login/refresh itself failed
    ) {
      return Promise.reject(error);
    }

    // ── If a refresh is already in progress, queue this request ──
    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((newToken: string) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const activeOutletId = localStorage.getItem("activeOutletId");

      const res = await axios.post(
        "/api/auth/refresh",
        { activeOutletId },
        { withCredentials: true }
      );

      const newToken = res.data.accessToken;
      localStorage.setItem("accessToken", newToken);

      // update role if returned
      if (res.data.role) {
        localStorage.setItem("role", res.data.role);
      }

      // flush queued requests with new token
      refreshQueue.forEach((cb) => cb(newToken));
      refreshQueue = [];

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh genuinely failed — clear everything and redirect to login
      refreshQueue = [];
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;