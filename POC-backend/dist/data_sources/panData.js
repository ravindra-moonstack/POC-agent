"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PANDataSource = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const errorHandler_1 = require("../utils/errorHandler");
class PANDataSource {
    constructor() {
        this.baseUrl = "https://api.pan-india.gov.in/v1";
        this.apiKey = env_1.config.PAN_API_KEY;
    }
    async fetchPANDetails(panNumber) {
        if (process.env.NODE_ENV === "production" && !this.apiKey) {
            throw new errorHandler_1.APIError(500, "PAN API key not configured");
        }
        // If we're not in production or don't have an API key, return mock data
        if (!this.apiKey) {
            return this.getMockPANDetails(panNumber);
        }
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/verify/${panNumber}`, {
                headers: {
                    "X-API-KEY": this.apiKey,
                    "Content-Type": "application/json",
                },
                timeout: 5000, // 5 second timeout
            });
            return this.transformPANData(response.data);
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    throw new errorHandler_1.APIError(404, "PAN number not found");
                }
                else if (error.response?.status === 401) {
                    throw new errorHandler_1.APIError(401, "Invalid PAN API key");
                }
                else if (error.code === "ECONNABORTED") {
                    throw new errorHandler_1.APIError(408, "PAN verification request timeout");
                }
                else if (error.response?.status === 400) {
                    throw new errorHandler_1.APIError(400, "Invalid PAN number format");
                }
                throw new errorHandler_1.APIError(error.response?.status || 500, error.message);
            }
            throw error;
        }
    }
    getMockPANDetails(panNumber) {
        return {
            panNumber: panNumber || "ABCDE1234F",
            name: "John Doe",
            dateOfBirth: "1990-01-01",
            address: "123 Main St, Mumbai, Maharashtra, India",
            verificationStatus: "VERIFIED",
            lastVerified: new Date(),
        };
    }
    transformPANData(data) {
        if (!data || typeof data !== "object") {
            throw new errorHandler_1.APIError(500, "Invalid PAN data received from API");
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
    validateVerificationStatus(status) {
        const validStatuses = ["VERIFIED", "UNVERIFIED", "FAILED"];
        return validStatuses.includes(status)
            ? status
            : "UNVERIFIED";
    }
}
exports.PANDataSource = PANDataSource;
//# sourceMappingURL=panData.js.map