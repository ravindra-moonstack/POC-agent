import axios from "axios";
import { config } from "../config/env";
import { APIError } from "../utils/errorHandler";

interface PANDetails {
  panNumber: string;
  name: string;
  dateOfBirth: string;
  address: string;
  verificationStatus?: "VERIFIED" | "UNVERIFIED" | "FAILED";
  lastVerified?: Date;
}

export class PANDataSource {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string = "https://api.pan-india.gov.in/v1";

  constructor() {
    this.apiKey = config.PAN_API_KEY;
  }

  async fetchPANDetails(panNumber: string): Promise<PANDetails> {
    if (process.env.NODE_ENV === "production" && !this.apiKey) {
      throw new APIError(500, "PAN API key not configured");
    }

    // If we're not in production or don't have an API key, return mock data
    if (!this.apiKey) {
      return this.getMockPANDetails(panNumber);
    }

    try {
      const response = await axios.get(`${this.baseUrl}/verify/${panNumber}`, {
        headers: {
          "X-API-KEY": this.apiKey,
          "Content-Type": "application/json",
        },
        timeout: 5000, // 5 second timeout
      });

      return this.transformPANData(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new APIError(404, "PAN number not found");
        } else if (error.response?.status === 401) {
          throw new APIError(401, "Invalid PAN API key");
        } else if (error.code === "ECONNABORTED") {
          throw new APIError(408, "PAN verification request timeout");
        } else if (error.response?.status === 400) {
          throw new APIError(400, "Invalid PAN number format");
        }
        throw new APIError(error.response?.status || 500, error.message);
      }
      throw error;
    }
  }

  private getMockPANDetails(panNumber: string): PANDetails {
    return {
      panNumber: panNumber || "ABCDE1234F",
      name: "John Doe",
      dateOfBirth: "1990-01-01",
      address: "123 Main St, Mumbai, Maharashtra, India",
      verificationStatus: "VERIFIED",
      lastVerified: new Date(),
    };
  }

  private transformPANData(data: any): PANDetails {
    if (!data || typeof data !== "object") {
      throw new APIError(500, "Invalid PAN data received from API");
    }

    return {
      panNumber: data.panNumber || "",
      name: data.name || "",
      dateOfBirth: data.dateOfBirth || "",
      address: data.address || "",
      verificationStatus: this.validateVerificationStatus(data.status),
      lastVerified: data.verificationDate
        ? new Date(data.verificationDate)
        : undefined,
    };
  }

  private validateVerificationStatus(
    status: string
  ): "VERIFIED" | "UNVERIFIED" | "FAILED" {
    const validStatuses = ["VERIFIED", "UNVERIFIED", "FAILED"];
    return validStatuses.includes(status)
      ? (status as "VERIFIED" | "UNVERIFIED" | "FAILED")
      : "UNVERIFIED";
  }
}
