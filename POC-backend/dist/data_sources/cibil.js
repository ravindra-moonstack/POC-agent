"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CibilAPI = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const errorHandler_1 = require("../utils/errorHandler");
class CibilAPI {
    constructor() {
        this.baseUrl = "https://api.cibil.com/v1";
        this.apiKey = env_1.config.CIBIL_API_KEY;
    }
    async fetchCreditProfile(customerId) {
        if (process.env.NODE_ENV === "production" && !this.apiKey) {
            throw new errorHandler_1.APIError(500, "CIBIL API key not configured");
        }
        // If we're not in production or don't have an API key, return mock data
        if (!this.apiKey) {
            return this.getMockProfile();
        }
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/credit-score/${customerId}`, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                },
                timeout: 10000, // 10 second timeout
            });
            return this.transformProfileData(response.data);
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    throw new errorHandler_1.APIError(404, "Credit profile not found");
                }
                else if (error.response?.status === 401) {
                    throw new errorHandler_1.APIError(401, "Invalid CIBIL API key");
                }
                else if (error.code === "ECONNABORTED") {
                    throw new errorHandler_1.APIError(408, "CIBIL API request timeout");
                }
                throw new errorHandler_1.APIError(error.response?.status || 500, error.message);
            }
            throw error;
        }
    }
    getMockProfile() {
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
    transformProfileData(data) {
        return {
            score: parseInt(data.creditScore) || 0,
            netWorth: parseFloat(data.netWorth) || 0,
            lastUpdated: new Date(data.lastUpdated),
            creditHistory: Array.isArray(data.history)
                ? data.history.map((item) => ({
                    type: item.type || "Unknown",
                    status: item.status || "Unknown",
                    amount: parseFloat(item.amount) || 0,
                    date: new Date(item.date),
                }))
                : undefined,
        };
    }
}
exports.CibilAPI = CibilAPI;
//# sourceMappingURL=cibil.js.map