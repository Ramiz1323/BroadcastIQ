import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({ baseURL, timeout: 120000 });

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      (error.code === "ECONNABORTED"
        ? "The request timed out. Please try again."
        : "Unable to reach the server. Is the API running?");
    error.friendlyMessage = message;
    return Promise.reject(error);
  }
);

export const buildQuery = (filters = {}, extra = {}) => {
  const params = new URLSearchParams();
  const merged = { ...filters, ...extra };
  Object.entries(merged).forEach(([key, value]) => {
    if (value == null || value === "" || (Array.isArray(value) && !value.length)) return;
    params.set(key, Array.isArray(value) ? value.join(",") : String(value));
  });
  return params.toString();
};

export const health = () => api.get("/health").then((r) => r.data);

export const dashboardStats = (params) =>
  api.get(`/dashboard/stats?${buildQuery(params)}`).then((r) => r.data);
export const chunkPerformance = () =>
  api.get("/dashboard/chunk-performance").then((r) => r.data);

export const listChunks = (params) =>
  api.get(`/chunks?${buildQuery(params)}`).then((r) => r.data);
export const getChunk = (id) => api.get(`/chunks/${id}`).then((r) => r.data);
export const updateChunk = (id, body) => api.put(`/chunks/${id}`, body).then((r) => r.data);
export const deleteChunk = (id) => api.delete(`/chunks/${id}`).then((r) => r.data);

export const previewUpload = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/chunks/preview", form).then((r) => r.data);
};

export const importUpload = (file, meta, mapping, force, onProgress) => {
  const form = new FormData();
  form.append("file", file);
  form.append("mapping", JSON.stringify(mapping || {}));
  form.append("force", force ? "true" : "false");
  Object.entries(meta || {}).forEach(([k, v]) => form.append(k, v == null ? "" : v));
  return api
    .post("/chunks/import", form, {
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    })
    .then((r) => r.data);
};

export const listDeliveries = (params) =>
  api.get(`/deliveries?${buildQuery(params)}`).then((r) => r.data);
export const getFacets = () => api.get("/deliveries/facets").then((r) => r.data);

export const listBroadcasts = (params) =>
  api.get(`/broadcasts?${buildQuery(params)}`).then((r) => r.data);
export const getBroadcast = (name) =>
  api.get(`/broadcasts/${encodeURIComponent(name)}`).then((r) => r.data);

export const previewReport = (filters) =>
  api.post("/reports/preview", filters).then((r) => r.data);
export const listSavedReports = () => api.get("/reports").then((r) => r.data);
export const createSavedReport = (body) => api.post("/reports", body).then((r) => r.data);
export const updateSavedReport = (id, body) => api.put(`/reports/${id}`, body).then((r) => r.data);
export const deleteSavedReport = (id) => api.delete(`/reports/${id}`).then((r) => r.data);
export const runSavedReport = (id) => api.post(`/reports/${id}/run`).then((r) => r.data);

export const exportUrl = (type, filters) =>
  `${baseURL}/reports/export/${type}?${buildQuery(filters)}`;

export default api;
