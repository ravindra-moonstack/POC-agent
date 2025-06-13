import { api } from "./api";

export interface BaseCustomerProfile {
  name: string;
  email?: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  familyDetails?: {
    spouse?: string;
    children?: number;
    dependents?: number;
  };
  companyOwnership?: Array<{
    companyName: string;
    role: string;
    ownershipPercentage?: number;
  }>;
}

export interface EnrichedProfile {
  basicInfo: {
    name: string;
    currentLocation?: string;
    profilePictureUrl?: string;
    shortBio?: string;
  };
  professional: {
    currentRole?: {
      title: string;
      company: string;
      startDate: string;
    };
    jobHistory: Array<{
      title: string;
      company: string;
      duration: string;
      location?: string;
      description?: string;
    }>;
    education: Array<{
      institution: string;
      degree: string;
      field: string;
      year?: string;
    }>;
    skills?: string[];
    achievements?: Array<{
      title: string;
      date?: string;
      description?: string;
    }>;
  };
  social: {
    linkedIn?: {
      url: string;
      followers?: number;
      engagement?: string;
    };
    twitter?: {
      handle: string;
      url: string;
      followers?: number;
      bio?: string;
    };
    github?: {
      username: string;
      url: string;
      repos?: number;
      stars?: number;
    };
    other?: Array<{
      platform: string;
      url: string;
      metrics?: Record<string, string | number>;
    }>;
  };
  mediaPresence: {
    newsArticles: Array<{
      title: string;
      source: string;
      date: string;
      url: string;
      snippet?: string;
    }>;
    interviews: Array<{
      title: string;
      platform: string;
      date: string;
      url: string;
    }>;
    publications: Array<{
      title: string;
      platform: string;
      date: string;
      url: string;
      type: string;
    }>;
  };
  interests: {
    topics?: string[];
    hobbies?: string[];
    publicActivities?: Array<{
      type: string;
      description: string;
      source?: string;
    }>;
  };
}

export interface Customer extends BaseCustomerProfile {
  customerId: string;
  enrichedProfile?: EnrichedProfile;
  createdAt?: Date;
  updatedAt?: Date;
}

export const customerService = {
  getCustomers: async () => {
    try {
      const response = await api.get<Customer[]>("/api/customers");
      return response.data;
    } catch (error) {
      console.error("Error fetching customers:", error);
      return [];
    }
  },

  getCustomerById: async (customerId: string) => {
    try {
      const response = await api.get<Customer>(`/api/customer/${customerId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching customer ${customerId}:`, error);
      throw error;
    }
  },

  createCustomer: async (
    customer: Omit<Customer, "customerId" | "createdAt" | "updatedAt">
  ) => {
    try {
      const response = await api.post<Customer>("/api/customer", customer);
      return response.data;
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  },

  updateCustomer: async (customerId: string, customer: Partial<Customer>) => {
    try {
      const response = await api.put<Customer>(
        `/api/customer/${customerId}`,
        customer
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating customer ${customerId}:`, error);
      throw error;
    }
  },

  deleteCustomer: async (customerId: string) => {
    try {
      await api.delete(`/api/customer/${customerId}`);
    } catch (error) {
      console.error(`Error deleting customer ${customerId}:`, error);
      throw error;
    }
  },

  enrichCustomerProfile: async (customerId: string) => {
    try {
      const response = await api.post<Customer>(
        `/api/profile/enrich/${customerId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error enriching customer profile ${customerId}:`, error);
      throw error;
    }
  },

  searchCustomers: async (query: string) => {
    try {
      const response = await api.get<Customer[]>(
        `/api/customers/search?q=${encodeURIComponent(query)}`
      );
      return response.data;
    } catch (error) {
      console.error("Error searching customers:", error);
      return [];
    }
  },
};
