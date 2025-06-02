import api from "./api";

export interface Report {
  id: number;
  clientId: number;
  clientName: string;
  meetingDate: string;
  type: string;
  status: string;
  duration: string;
  location: string;
  attendees: string[];
  summary: string;
  insights: Array<{
    id: number;
    category: string;
    content: string;
  }>;
  nextSteps: string[];
}

export const reportService = {
  getReports: async () => {
    const response = await api.get<Report[]>("/reports");
    return response.data;
  },

  getReportById: async (id: number) => {
    const response = await api.get<Report>(`/reports/${id}`);
    return response.data;
  },

  createReport: async (report: Omit<Report, "id">) => {
    const response = await api.post<Report>("/reports", report);
    return response.data;
  },

  updateReport: async (id: number, report: Partial<Report>) => {
    const response = await api.put<Report>(`/reports/${id}`, report);
    return response.data;
  },

  deleteReport: async (id: number) => {
    await api.delete(`/reports/${id}`);
  },

  getClientReports: async (clientId: number) => {
    const response = await api.get<Report[]>(`/clients/${clientId}/reports`);
    return response.data;
  },

  searchReports: async (query: string) => {
    const response = await api.get<Report[]>("/reports/search", {
      params: { q: query },
    });
    return response.data;
  },

  generateInsights: async (reportId: number) => {
    const response = await api.post<Report>(`/reports/${reportId}/insights`);
    return response.data;
  },
};
