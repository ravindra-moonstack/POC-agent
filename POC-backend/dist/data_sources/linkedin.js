"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkedInDataSource = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const errorHandler_1 = require("../utils/errorHandler");
class LinkedInDataSource {
    constructor() {
        this.apiVersion = "v2";
        this.baseUrl = "https://api.linkedin.com";
        this.scope = "r_liteprofile r_emailaddress r_organization_social";
        this.clientId = env_1.config.LINKEDIN_CLIENT_ID;
        this.clientSecret = env_1.config.LINKEDIN_CLIENT_SECRET;
        this.redirectUri = env_1.config.LINKEDIN_REDIRECT_URI;
        this.serpApiKey = env_1.config.SERP_API_KEY;
        if (!this.clientId || !this.clientSecret || !this.redirectUri) {
            throw new Error("LinkedIn credentials not configured");
        }
    }
    getAuthorizationUrl() {
        const params = new URLSearchParams({
            response_type: "code",
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: this.scope,
            state: Math.random().toString(36).substring(7),
        });
        return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    }
    async getAccessToken(authorizationCode) {
        try {
            const params = new URLSearchParams({
                grant_type: "authorization_code",
                code: authorizationCode,
                client_id: this.clientId,
                client_secret: this.clientSecret,
                redirect_uri: this.redirectUri,
            });
            const response = await axios_1.default.post(`${this.baseUrl}/oauth/v2/accessToken`, params.toString(), {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });
            return response.data.access_token;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new errorHandler_1.APIError(error.response?.status || 500, "Failed to get LinkedIn access token");
            }
            throw error;
        }
    }
    async fetchProfile(accessToken) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/${this.apiVersion}/me?projection=(id,localizedFirstName,localizedLastName,profilePicture,positions,industry,location)`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return this.transformProfileData(response.data);
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new errorHandler_1.APIError(error.response?.status || 500, "Failed to fetch LinkedIn profile");
            }
            throw error;
        }
    }
    transformProfileData(data) {
        return {
            title: data.positions?.elements[0]?.title || "",
            company: data.positions?.elements[0]?.companyName || "",
            experience: (data.positions?.elements || []).map((pos) => ({
                company: pos.companyName,
                role: pos.title,
                duration: this.formatDuration(pos.startDate, pos.endDate),
            })),
            industry: data.industry?.name,
            location: data.location
                ? `${data.location.city}, ${data.location.country}`
                : undefined,
            profileUrl: `https://www.linkedin.com/in/${data.id}`,
        };
    }
    formatDuration(startDate, endDate) {
        const start = `${startDate.year}/${String(startDate.month).padStart(2, "0")}`;
        const end = endDate
            ? `${endDate.year}/${String(endDate.month).padStart(2, "0")}`
            : "Present";
        return `${start} - ${end}`;
    }
    async searchPublicInfo(query) {
        if (!this.serpApiKey) {
            throw new errorHandler_1.APIError(400, "SERP API key not configured");
        }
        try {
            // Search for LinkedIn profile
            const linkedInSearchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(`${query} site:linkedin.com/in/`)}&api_key=${this.serpApiKey}`;
            const linkedInResponse = await axios_1.default.get(linkedInSearchUrl);
            const linkedInResults = linkedInResponse.data.organic_results || [];
            // Search for company information
            const companySearchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(`${query} company`)}&api_key=${this.serpApiKey}`;
            const companyResponse = await axios_1.default.get(companySearchUrl);
            const companyResults = companyResponse.data.organic_results || [];
            // Search for social media profiles
            const socialPlatforms = ["twitter.com", "facebook.com", "instagram.com"];
            const socialMediaResults = await Promise.all(socialPlatforms.map(async (platform) => {
                const socialSearchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(`${query} site:${platform}`)}&api_key=${this.serpApiKey}`;
                const response = await axios_1.default.get(socialSearchUrl);
                return {
                    platform,
                    results: response.data.organic_results || [],
                };
            }));
            return this.transformPublicSearchResults(linkedInResults, companyResults, socialMediaResults);
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new errorHandler_1.APIError(error.response?.status || 500, "Failed to search public information");
            }
            throw error;
        }
    }
    transformPublicSearchResults(linkedInResults, companyResults, socialMediaResults) {
        const result = {};
        // Transform LinkedIn results
        if (linkedInResults.length > 0) {
            const linkedInResult = linkedInResults[0];
            result.linkedInInfo = {
                title: this.extractTitle(linkedInResult.title || ""),
                company: this.extractCompany(linkedInResult.title || ""),
                experience: [],
                summary: linkedInResult.snippet,
                publicProfileUrl: linkedInResult.link,
                fullName: this.extractName(linkedInResult.title || ""),
            };
        }
        // Transform company results
        if (companyResults.length > 0) {
            const companyResult = companyResults[0];
            result.companyInfo = {
                name: companyResult.title || "",
                description: companyResult.snippet,
                website: companyResult.link,
            };
        }
        // Transform social media results
        result.socialMedia = socialMediaResults
            .map((platform) => {
            const firstResult = platform.results[0];
            if (firstResult) {
                return {
                    platform: platform.platform.split(".")[0],
                    url: firstResult.link,
                    username: this.extractUsername(firstResult.link, platform.platform),
                };
            }
            return null;
        })
            .filter((item) => item !== null);
        // Add possible matches if exact match wasn't found
        if (!result.linkedInInfo && linkedInResults.length > 0) {
            result.possibleMatches = linkedInResults.slice(0, 3).map((result) => ({
                name: this.extractName(result.title || ""),
                title: this.extractTitle(result.title || ""),
                company: this.extractCompany(result.title || ""),
                profileUrl: result.link,
            }));
        }
        return result;
    }
    extractTitle(title) {
        const parts = title.split(" - ");
        return parts.length > 1 ? parts[1].trim() : "";
    }
    extractCompany(title) {
        const parts = title.split(" - ");
        return parts.length > 2 ? parts[2].trim() : "";
    }
    extractName(title) {
        const parts = title.split(" - ");
        return parts[0].trim();
    }
    extractUsername(url, platform) {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split("/").filter(Boolean);
            return pathParts[pathParts.length - 1];
        }
        catch {
            return undefined;
        }
    }
}
exports.LinkedInDataSource = LinkedInDataSource;
//# sourceMappingURL=linkedin.js.map