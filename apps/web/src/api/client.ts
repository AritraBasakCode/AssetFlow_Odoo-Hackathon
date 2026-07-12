import axios from "axios";

// httpOnly cookies carry the JWT — withCredentials is required on every call.
export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// On a 401, try a silent refresh once, then retry the original request.
// This keeps the user logged in across the 15-min access token expiry
// without forcing a re-login every time.
let isRefreshing = false;
let queue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url.includes("/auth/")) {
      original._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await api.post("/auth/refresh");
          queue.forEach((cb) => cb());
          queue = [];
          isRefreshing = false;
          return api(original);
        } catch (e) {
          isRefreshing = false;
          queue = [];
          window.location.href = "/login";
          return Promise.reject(error);
        }
      }
      return new Promise((resolve) => {
        queue.push(() => resolve(api(original)));
      });
    }
    return Promise.reject(error);
  }
);
