"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileEnrichmentService = exports.ProfileEnrichmentService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const redis_1 = require("../config/redis");
const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds
class ProfileEnrichmentService {
    async searchLinkedIn(name, currentCompany) {
        if (!env_1.config.LINKEDIN_API_KEY) {
            console.log("LinkedIn API key not configured, skipping LinkedIn search");
            return {
                professional: {
                    jobHistory: [],
                    education: [],
                },
                social: {},
            };
        }
        try {
            const response = await axios_1.default.get(`https://api.linkedin.com/v2/people-search`, {
                headers: {
                    Authorization: `Bearer ${env_1.config.LINKEDIN_API_KEY}`,
                    "X-Restli-Protocol-Version": "2.0.0",
                },
                params: {
                    q: `firstName,lastName,headline,positions:(title,companyName,startDate)`,
                    keywords: `${name} ${currentCompany || ""}`.trim(),
                },
            });
            // Process and validate LinkedIn data
            const profiles = response.data.elements || [];
            const exactMatch = profiles.find((p) => this.normalizeString(`${p.firstName} ${p.lastName}`) ===
                this.normalizeString(name));
            if (!exactMatch)
                return {
                    professional: {
                        jobHistory: [],
                        education: [],
                    },
                    social: {},
                };
            const vanityName = exactMatch.vanityName || exactMatch.id;
            return {
                professional: {
                    currentRole: {
                        title: exactMatch.positions?.[0]?.title || "",
                        company: exactMatch.positions?.[0]?.companyName || "",
                        startDate: exactMatch.positions?.[0]?.startDate?.year?.toString() ||
                            new Date().getFullYear().toString(),
                    },
                    jobHistory: [],
                    education: [],
                },
                social: {
                    linkedIn: {
                        url: `https://www.linkedin.com/in/${vanityName}`,
                        followers: exactMatch.numConnections,
                        engagement: exactMatch.engagement,
                    },
                },
            };
        }
        catch (error) {
            console.error("LinkedIn API error:", error);
            return {
                professional: {
                    jobHistory: [],
                    education: [],
                },
                social: {},
            };
        }
    }
    async searchGoogle(name, location) {
        if (!env_1.config.SERP_API_KEY) {
            console.log("SERP API key not configured, skipping Google search");
            return {
                professional: {
                    jobHistory: [],
                    education: [],
                },
                social: {},
            };
        }
        try {
            const response = await axios_1.default.get("https://serpapi.com/search", {
                params: {
                    api_key: env_1.config.SERP_API_KEY,
                    q: `${name} ${location || ""} profile`.trim(),
                    num: 10,
                },
            });
            // Extract relevant information from search results
            const results = response.data.organic_results || [];
            const relevantResults = results.filter((result) => this.isRelevantResult(result.title, result.snippet, name));
            return this.extractProfileInfo(relevantResults);
        }
        catch (error) {
            console.error("Google Search API error:", error);
            return {
                professional: {
                    jobHistory: [],
                    education: [],
                },
                social: {},
            };
        }
    }
    normalizeString(str) {
        return str.toLowerCase().replace(/[^a-z0-9]/g, "");
    }
    isRelevantResult(title, snippet, name) {
        const normalizedName = this.normalizeString(name);
        const normalizedContent = this.normalizeString(title + " " + snippet);
        // Check if the result contains the exact name and relevant keywords
        return (normalizedContent.includes(normalizedName) &&
            (normalizedContent.includes("profile") ||
                normalizedContent.includes("linkedin") ||
                normalizedContent.includes("professional")));
    }
    extractProfileInfo(results) {
        const info = {
            interests: {
                topics: [],
                hobbies: [],
                publicActivities: [],
            },
            mediaPresence: {
                newsArticles: [],
                interviews: [],
                publications: [],
            },
            basicInfo: {
                name: "", // Will be filled in enrichCustomerProfile
                currentLocation: undefined,
                shortBio: undefined,
            },
            professional: {
                jobHistory: [],
                education: [],
                skills: [],
            },
            social: {},
        };
        // Extract information from search results using pattern matching
        results.forEach((result) => {
            const content = result.title + " " + result.snippet;
            // Extract location
            const locationMatch = content.match(/based in ([^,.]+)/i);
            if (locationMatch) {
                info.basicInfo.currentLocation = locationMatch[1].trim();
            }
            // Extract short bio
            const bioMatch = content.match(/(?:about|bio|summary)[:\s]+([^.]+)/i);
            if (bioMatch) {
                info.basicInfo.shortBio = bioMatch[1].trim();
            }
            // Extract interests and hobbies
            const interestMatches = content.match(/interested in ([^.]+)/i);
            if (interestMatches && info.interests?.topics) {
                const topics = interestMatches[1]
                    .split(/[,&]/)
                    .map((t) => t.trim())
                    .filter((t) => t.length > 0);
                info.interests.topics.push(...topics);
            }
            // Extract public activities
            const activityMatch = content.match(/(volunteer|mentor|speak|organize)[^\.]*/gi);
            if (activityMatch && info.interests?.publicActivities) {
                activityMatch.forEach((activity) => {
                    info.interests.publicActivities.push({
                        type: activity.split(/\s+/)[0].toLowerCase(),
                        description: activity.trim(),
                        source: result.source || "Web",
                    });
                });
            }
            // Extract skills
            const skillsMatch = content.match(/skills[:\s]+([^.]+)/i);
            if (skillsMatch && info.professional?.skills) {
                const skills = skillsMatch[1]
                    .split(/[,&]/)
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0);
                info.professional.skills.push(...skills);
            }
            // Extract social profiles
            const twitterMatch = content.match(/twitter\.com\/([^/\s]+)/i);
            if (twitterMatch) {
                const handle = twitterMatch[1];
                info.social = {
                    ...info.social,
                    twitter: {
                        handle,
                        url: `https://twitter.com/${handle}`,
                        bio: result.snippet,
                    },
                };
            }
            const githubMatch = content.match(/github\.com\/([^/\s]+)/i);
            if (githubMatch) {
                const username = githubMatch[1];
                info.social = {
                    ...info.social,
                    github: {
                        username,
                        url: `https://github.com/${username}`,
                    },
                };
            }
            // Extract media mentions
            if (content.toLowerCase().includes("news") ||
                content.toLowerCase().includes("article")) {
                info.mediaPresence.newsArticles.push({
                    title: result.title,
                    source: result.source || "Web",
                    date: result.date || new Date().toISOString().split("T")[0],
                    url: result.url || "",
                    snippet: result.snippet,
                });
            }
            // Extract publications
            if (content.toLowerCase().includes("published") ||
                content.toLowerCase().includes("publication")) {
                info.mediaPresence.publications.push({
                    title: result.title,
                    platform: result.publisher || result.source || "Unknown",
                    date: result.date || new Date().toISOString().split("T")[0],
                    url: result.url || "",
                    type: result.type || "article",
                });
            }
        });
        return info;
    }
    async cacheEnrichmentResult(customerId, result) {
        try {
            await redis_1.redis.setex(`profile_enrichment:${customerId}`, CACHE_TTL, JSON.stringify(result));
        }
        catch (error) {
            // Log error but continue - caching is not critical for functionality
            console.warn("Failed to cache enrichment result:", error);
        }
    }
    async getCachedEnrichmentResult(customerId) {
        try {
            const cached = await redis_1.redis.get(`profile_enrichment:${customerId}`);
            return cached ? JSON.parse(cached) : null;
        }
        catch (error) {
            // Log error but continue - caching is not critical for functionality
            console.warn("Failed to get cached enrichment result:", error);
            return null;
        }
    }
    async enrichCustomerProfile(customer) {
        // Check cache first
        const cached = await this.getCachedEnrichmentResult(customer._id.toString());
        if (cached) {
            return {
                enrichedProfile: cached,
            };
        }
        // Parallel API calls for faster response
        const [linkedInData, googleData] = await Promise.all([
            this.searchLinkedIn(customer.name, customer.companyOwnership?.[0]?.companyName),
            this.searchGoogle(customer.name, undefined),
        ]);
        // Merge results, preferring LinkedIn data for professional info
        const enrichedProfile = {
            professional: {
                currentRole: linkedInData.professional?.currentRole,
                jobHistory: [
                    ...(linkedInData.professional?.jobHistory || []),
                    ...(googleData.professional?.jobHistory || []),
                ],
                education: [
                    ...(linkedInData.professional?.education || []),
                    ...(googleData.professional?.education || []),
                ],
                skills: [
                    ...(linkedInData.professional?.skills || []),
                    ...(googleData.professional?.skills || []),
                ],
                achievements: [
                    ...(linkedInData.professional?.achievements || []),
                    ...(googleData.professional?.achievements || []),
                ],
            },
            social: {
                linkedIn: linkedInData.social?.linkedIn,
                twitter: googleData.social?.twitter,
                github: googleData.social?.github,
                other: googleData.social?.other,
            },
            interests: {
                topics: [...(googleData.interests?.topics || [])],
                hobbies: [...(googleData.interests?.hobbies || [])],
                publicActivities: [...(googleData.interests?.publicActivities || [])],
            },
            basicInfo: {
                name: customer.name,
                currentLocation: linkedInData.basicInfo?.currentLocation ||
                    googleData.basicInfo?.currentLocation,
                profilePictureUrl: linkedInData.basicInfo?.profilePictureUrl ||
                    googleData.basicInfo?.profilePictureUrl,
                shortBio: googleData.basicInfo?.shortBio,
            },
            mediaPresence: {
                newsArticles: [...(googleData.mediaPresence?.newsArticles || [])],
                interviews: [...(googleData.mediaPresence?.interviews || [])],
                publications: [...(googleData.mediaPresence?.publications || [])],
            },
        };
        // Cache the result
        await this.cacheEnrichmentResult(customer._id.toString(), enrichedProfile);
        // Return enriched customer
        return {
            enrichedProfile,
        };
    }
}
exports.ProfileEnrichmentService = ProfileEnrichmentService;
exports.profileEnrichmentService = new ProfileEnrichmentService();
//# sourceMappingURL=profileEnrichment.js.map