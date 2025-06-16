"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialMediaDataSource = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const errorHandler_1 = require("../utils/errorHandler");
class SocialMediaDataSource {
    constructor() {
        this.baseUrl = "https://serpapi.com/search.json";
        this.serpApiKey = env_1.config.SERP_API_KEY;
    }
    async fetchSocialPresence(name, company) {
        if (process.env.NODE_ENV === "production" && !this.serpApiKey) {
            throw new errorHandler_1.APIError(500, "SERP API key not configured");
        }
        if (!this.serpApiKey) {
            return this.getMockSocialProfile();
        }
        try {
            const [twitterData, facebookData, instagramData, linkedinData] = await Promise.all([
                this.searchPlatform(name, company, "twitter.com"),
                this.searchPlatform(name, company, "facebook.com"),
                this.searchPlatform(name, company, "instagram.com"),
                this.searchPlatform(name, company, "linkedin.com/in"),
            ]);
            return this.aggregateSocialData(twitterData, facebookData, instagramData, linkedinData);
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new errorHandler_1.APIError(401, "Invalid SERP API key");
                }
                else if (error.code === "ECONNABORTED") {
                    throw new errorHandler_1.APIError(408, "Social media search timeout");
                }
                throw new errorHandler_1.APIError(error.response?.status || 500, error.message);
            }
            throw error;
        }
    }
    async searchPlatform(name, company, domain) {
        const query = company
            ? `${encodeURIComponent(name)} ${encodeURIComponent(company)} site:${domain}`
            : `${encodeURIComponent(name)} site:${domain}`;
        try {
            const response = await axios_1.default.get(this.baseUrl, {
                params: {
                    api_key: this.serpApiKey,
                    engine: "google",
                    q: query,
                    num: 1,
                },
                timeout: 10000,
            });
            return response.data.organic_results?.[0] || null;
        }
        catch (error) {
            console.error(`Error searching ${domain}:`, error);
            return null;
        }
    }
    getMockSocialProfile() {
        return {
            platforms: {
                twitter: {
                    handle: "@johndoe",
                    url: "https://twitter.com/johndoe",
                    followers: 1000,
                    bio: "Tech enthusiast and entrepreneur",
                    engagement: "Medium",
                },
                facebook: {
                    url: "https://facebook.com/john.doe",
                    followers: 500,
                    engagement: "Low",
                },
                instagram: {
                    handle: "@johndoe",
                    url: "https://instagram.com/johndoe",
                    followers: 2000,
                    engagement: "High",
                },
                linkedin: {
                    url: "https://linkedin.com/in/johndoe",
                    followers: 5000,
                    engagement: "High",
                },
            },
            activity: {
                postFrequency: "Weekly",
                engagement: "Medium",
                lastActive: new Date(),
            },
        };
    }
    aggregateSocialData(twitterData, facebookData, instagramData, linkedinData) {
        const profile = {
            platforms: {},
            activity: {
                postFrequency: "Unknown",
                engagement: "Unknown",
            },
        };
        // Process Twitter data
        if (twitterData?.link) {
            const handle = twitterData.link.split("twitter.com/").pop();
            profile.platforms.twitter = {
                handle: `@${handle}`,
                url: twitterData.link,
                bio: twitterData.snippet,
                engagement: this.estimateEngagement(twitterData.snippet),
            };
        }
        // Process Facebook data
        if (facebookData?.link) {
            profile.platforms.facebook = {
                url: facebookData.link,
                engagement: this.estimateEngagement(facebookData.snippet),
            };
        }
        // Process Instagram data
        if (instagramData?.link) {
            const handle = instagramData.link.split("instagram.com/").pop();
            profile.platforms.instagram = {
                handle: `@${handle}`,
                url: instagramData.link,
                engagement: this.estimateEngagement(instagramData.snippet),
            };
        }
        // Process LinkedIn data
        if (linkedinData?.link) {
            profile.platforms.linkedin = {
                url: linkedinData.link,
                engagement: this.estimateEngagement(linkedinData.snippet),
            };
        }
        // Estimate overall activity
        profile.activity = this.estimateOverallActivity(profile.platforms);
        return profile;
    }
    estimateEngagement(snippet) {
        if (!snippet)
            return "Unknown";
        // Simple heuristic based on common engagement indicators in snippets
        const engagementIndicators = {
            high: [
                "popular",
                "influential",
                "leader",
                "expert",
                "thousands",
                "millions",
            ],
            medium: ["professional", "active", "regular", "hundreds"],
            low: ["occasional", "rare", "few"],
        };
        const snippetLower = snippet.toLowerCase();
        if (engagementIndicators.high.some((indicator) => snippetLower.includes(indicator))) {
            return "High";
        }
        else if (engagementIndicators.medium.some((indicator) => snippetLower.includes(indicator))) {
            return "Medium";
        }
        else if (engagementIndicators.low.some((indicator) => snippetLower.includes(indicator))) {
            return "Low";
        }
        return "Unknown";
    }
    estimateOverallActivity(platforms) {
        const engagementLevels = Object.values(platforms)
            .map((platform) => platform?.engagement)
            .filter(Boolean);
        if (engagementLevels.length === 0) {
            return {
                postFrequency: "Unknown",
                engagement: "Unknown",
                lastActive: undefined,
            };
        }
        const highCount = engagementLevels.filter((level) => level === "High").length;
        const mediumCount = engagementLevels.filter((level) => level === "Medium").length;
        let overallEngagement = "Low";
        if (highCount >= 2 || (highCount === 1 && mediumCount >= 1)) {
            overallEngagement = "High";
        }
        else if (mediumCount >= 2 || highCount === 1) {
            overallEngagement = "Medium";
        }
        return {
            postFrequency: this.estimatePostFrequency(overallEngagement),
            engagement: overallEngagement,
            lastActive: new Date(), // We could potentially get this from the most recent post/activity
        };
    }
    estimatePostFrequency(engagement) {
        switch (engagement) {
            case "High":
                return "Daily";
            case "Medium":
                return "Weekly";
            case "Low":
                return "Monthly";
            default:
                return "Unknown";
        }
    }
}
exports.SocialMediaDataSource = SocialMediaDataSource;
//# sourceMappingURL=socialMedia.js.map