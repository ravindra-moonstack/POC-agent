import axios from "axios";
import { config } from "../config/env";
import { APIError } from "../utils/errorHandler";

interface CibilProfile {
  score: number;
  netWorth: number;
  lastUpdated: Date;
  creditHistory?: Array<{
    type: string;
    status: string;
    amount: number;
    date: Date;
  }>;
}

export class CibilAPI {
  private apiKey: string | undefined;
  private readonly baseUrl: string = "https://api.cibil.com/v1";

  constructor() {
    this.apiKey = config.CIBIL_API_KEY;
  }

  async fetchCreditProfile(customerId: string): Promise<CibilProfile> {
    if (process.env.NODE_ENV === "production" && !this.apiKey) {
      throw new APIError(500, "CIBIL API key not configured");
    }

    // If we're not in production or don't have an API key, return mock data
    if (!this.apiKey) {
      return this.getMockProfile();
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/credit-score/${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 second timeout
        }
      );

      return this.transformProfileData(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new APIError(404, "Credit profile not found");
        } else if (error.response?.status === 401) {
          throw new APIError(401, "Invalid CIBIL API key");
        } else if (error.code === "ECONNABORTED") {
          throw new APIError(408, "CIBIL API request timeout");
        }
        throw new APIError(error.response?.status || 500, error.message);
      }
      throw error;
    }
  }

  private getMockProfile(): CibilProfile {
    return {
      score: Math.floor(Math.random() * (850 - 300 + 1)) + 300, // Random score between 300-850
      netWorth: Math.floor(Math.random() * 10000000),
      lastUpdated: new Date(),
      creditHistory: [
        {
          type: "Credit Card",
          status: "Good Standing",
          amount: 50000,
          date: new Date(),
        },
        {
          type: "Personal Loan",
          status: "Closed",
          amount: 200000,
          date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        },
      ],
    };
  }

  private transformProfileData(data: any): CibilProfile {
    return {
      score: parseInt(data.creditScore) || 0,
      netWorth: parseFloat(data.netWorth) || 0,
      lastUpdated: new Date(data.lastUpdated),
      creditHistory: Array.isArray(data.history)
        ? data.history.map((item: any) => ({
            type: item.type || "Unknown",
            status: item.status || "Unknown",
            amount: parseFloat(item.amount) || 0,
            date: new Date(item.date),
          }))
        : undefined,
    };
  }
}
