import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socket;
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("bookleaf_admin_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${options.method || "GET"} ${endpoint}]:`, error);
    throw error;
  }
};

export const authApi = {
  login: (email, password) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => apiRequest("/auth/me"),
  getAllAuthors: () => apiRequest("/auth/authors"),
  getAdminStats: () => apiRequest("/auth/stats"),
};

export const booksApi = {
  getAllBooks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/books/all${query ? `?${query}` : ""}`);
  },
};

export const ticketsApi = {
  getAllTickets: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/tickets${query ? `?${query}` : ""}`);
  },
  getTicketById: (id) => apiRequest(`/tickets/${id}`),
  updateStatus: (id, status) =>
    apiRequest(`/tickets/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  overrideClassification: (id, { category, priority }) =>
    apiRequest(`/tickets/${id}/classification`, {
      method: "PATCH",
      body: JSON.stringify({ category, priority }),
    }),
  assignTicket: (id, { adminId, adminName }) =>
    apiRequest(`/tickets/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ adminId, adminName }),
    }),
  addInternalNote: (id, note) =>
    apiRequest(`/tickets/${id}/internal-notes`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),
  addMessage: (id, content) =>
    apiRequest(`/tickets/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  regenerateAiDraft: (id) =>
    apiRequest(`/tickets/${id}/ai-draft`, {
      method: "POST",
    }),
  seedDatabase: () =>
    apiRequest("/seed", {
      method: "POST",
    }),
};

