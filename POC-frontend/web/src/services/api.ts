import axios from "axios";
// import type { Customer } from "./clientService";

export const api = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface Meeting {
  id: string;
  clientId: string;
  date: string;
  notes: string;
  recordingUrl?: string;
}

interface Report {
  id: string;
  customerId: string;
  type: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Client API endpoints
export const clientApi = {
  search: (query: string) =>
    api.get<Client[]>(`/api/customers/search?q=${query}`),
  getById: (id: string) => api.get<Client>(`/api/customers/${id}`),
  create: (data: Omit<Client, "id">) =>
    api.post<Client>("/api/customers", data),
  update: (id: string, data: Partial<Client>) =>
    api.put<Client>(`/api/customers/${id}`, data),
};

// Meeting API endpoints
export const meetingApi = {
  create: (data: Omit<Meeting, "id">) =>
    api.post<Meeting>("/api/meetings", data),
  getByClientId: (clientId: string) =>
    api.get<Meeting[]>(`/api/meetings/client/${clientId}`),
  uploadRecording: (meetingId: string, file: FormData) =>
    api.post<Meeting>(`/api/meetings/${meetingId}/recording`, file, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
};

// Report API endpoints
export const reportApi = {
  generate: (data: Omit<Report, "id">) =>
    api.post<Report>("/api/reports", data),
  getByClientId: (clientId: string) =>
    api.get<Report[]>(`/api/reports/customer/${clientId}`),
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);
