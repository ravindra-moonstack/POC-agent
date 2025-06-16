"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileEnrichmentService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
class ProfileEnrichmentService {
    constructor() {
        this.serpApiKey = env_1.config.SERP_API_KEY;
    }
    async enrichProfile(baseProfile) {
        if (!this.serpApiKey) {
            throw new Error("SERP API key not configured");
        }
        try {
            // Initialize enriched profile with basic info
            const enrichedProfile = {
                basicInfo: {
                    name: baseProfile.name,
                },
                professional: {
                    jobHistory: [],
                    education: [],
                },
                social: {},
                mediaPresence: {},
                interests: {},
            };
            // Search queries to gather different types of information
            const searchQueries = this.generateSearchQueries(baseProfile);
            // Perform searches in parallel
            const [linkedInData, newsData, socialData, companyData] = await Promise.all([
                this.searchLinkedInProfile(searchQueries.linkedin),
                this.searchNewsAndMedia(searchQueries.news),
                this.searchSocialProfiles(searchQueries.social),
                this.searchCompanyInfo(searchQueries.company),
            ]);
            // Enrich the profile with found data
            this.enrichWithLinkedInData(enrichedProfile, linkedInData);
            this.enrichWithNewsData(enrichedProfile, newsData);
            this.enrichWithSocialData(enrichedProfile, socialData);
            this.enrichWithCompanyData(enrichedProfile, companyData);
            return enrichedProfile;
        }
        catch (error) {
            console.error("Error enriching profile:", error);
            throw new Error("Failed to enrich profile with public information");
        }
    }
    generateSearchQueries(profile) {
        const nameQuery = encodeURIComponent(profile.name);
        const companyQuery = profile.companyOwnership?.[0]?.companyName
            ? encodeURIComponent(profile.companyOwnership[0].companyName)
            : "";
        return {
            linkedin: `${nameQuery} ${companyQuery} site:linkedin.com/in/`,
            news: `${nameQuery} ${companyQuery} (interview OR article OR news OR press)`,
            social: `${nameQuery} (site:twitter.com OR site:github.com OR site:instagram.com)`,
            company: companyQuery
                ? `${companyQuery} company information funding`
                : "",
        };
    }
    async searchLinkedInProfile(query) {
        const url = `https://serpapi.com/search.json?engine=google&q=${query}&api_key=${this.serpApiKey}`;
        const response = await axios_1.default.get(url);
        return response.data.organic_results || [];
    }
    async searchNewsAndMedia(query) {
        const url = `https://serpapi.com/search.json?engine=google&q=${query}&api_key=${this.serpApiKey}`;
        const response = await axios_1.default.get(url);
        return response.data.organic_results || [];
    }
    async searchSocialProfiles(query) {
        const url = `https://serpapi.com/search.json?engine=google&q=${query}&api_key=${this.serpApiKey}`;
        const response = await axios_1.default.get(url);
        return response.data.organic_results || [];
    }
    async searchCompanyInfo(query) {
        if (!query)
            return null;
        const url = `https://serpapi.com/search.json?engine=google&q=${query}&api_key=${this.serpApiKey}`;
        const response = await axios_1.default.get(url);
        return response.data.organic_results || [];
    }
    enrichWithLinkedInData(profile, data) {
        if (!data.length)
            return;
        const linkedInResult = data[0];
        if (linkedInResult) {
            // Extract LinkedIn URL
            profile.social.linkedIn = {
                url: linkedInResult.link || "",
            };
            // Parse title and company from LinkedIn headline
            const titleMatch = linkedInResult.title?.match(/^([^-]+) - ([^-]+)/);
            if (titleMatch) {
                profile.professional.currentRole = {
                    title: titleMatch[1].trim(),
                    company: titleMatch[2].trim(),
                    startDate: "Present", // Actual date would need LinkedIn API access
                };
            }
            // Extract description/summary if available
            if (linkedInResult.snippet) {
                profile.basicInfo.shortBio = linkedInResult.snippet;
            }
        }
    }
    enrichWithNewsData(profile, data) {
        if (!data.length)
            return;
        profile.mediaPresence.newsArticles = data
            .filter((result) => !result.link.includes("linkedin.com")) // Filter out LinkedIn results
            .map((result) => ({
            title: result.title || "",
            source: new URL(result.link).hostname,
            date: result.date || "Unknown",
            url: result.link,
            snippet: result.snippet,
        }))
            .slice(0, 5); // Limit to 5 most relevant articles
    }
    enrichWithSocialData(profile, data) {
        if (!data.length)
            return;
        data.forEach((result) => {
            const url = result.link;
            if (url.includes("twitter.com")) {
                profile.social.twitter = {
                    handle: url.split("/").pop() || "",
                    url,
                    bio: result.snippet,
                };
            }
            else if (url.includes("github.com")) {
                profile.social.github = {
                    username: url.split("/").pop() || "",
                    url,
                };
            }
            else {
                if (!profile.social.other)
                    profile.social.other = [];
                profile.social.other.push({
                    platform: this.detectPlatform(url),
                    url,
                });
            }
        });
    }
    enrichWithCompanyData(profile, data) {
        if (!data?.length)
            return;
        const companyInfo = data[0];
        if (companyInfo) {
            profile.companies = [
                {
                    name: companyInfo.title?.split("-")[0].trim() || "",
                    role: "Unknown", // Default role if not found in data
                    description: companyInfo.snippet || "",
                    publicInfo: {
                        website: companyInfo.link,
                    },
                },
            ];
        }
    }
    detectPlatform(url) {
        const hostname = new URL(url).hostname;
        return hostname.split(".")[1] || hostname;
    }
}
exports.ProfileEnrichmentService = ProfileEnrichmentService;
//# sourceMappingURL=ProfileEnrichmentService.js.map