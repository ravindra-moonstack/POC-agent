import axios from "axios";
import { config } from "../config/env";

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
  companyOwnership?: {
    companyName: string;
    role: string;
    ownershipPercentage?: number;
  }[];
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
      repositories?: number;
      mainLanguages?: string[];
    };
    other?: Array<{
      platform: string;
      url: string;
      username?: string;
    }>;
  };
  mediaPresence: {
    newsArticles?: Array<{
      title: string;
      source: string;
      date: string;
      url: string;
      snippet?: string;
    }>;
    interviews?: Array<{
      title: string;
      platform: string;
      date: string;
      url: string;
    }>;
    publications?: Array<{
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
  companies?: Array<{
    name: string;
    role: string;
    foundingDate?: string;
    industry?: string;
    size?: string;
    location?: string;
    description?: string;
    publicInfo?: {
      website?: string;
      linkedIn?: string;
      funding?: Array<{
        round: string;
        amount: string;
        date: string;
        investors?: string[];
      }>;
    };
  }>;
}

export class ProfileEnrichmentService {
  private readonly serpApiKey: string | undefined;

  constructor() {
    this.serpApiKey = config.SERP_API_KEY;
  }

  async enrichProfile(
    baseProfile: BaseCustomerProfile
  ): Promise<EnrichedProfile> {
    if (!this.serpApiKey) {
      throw new Error("SERP API key not configured");
    }
    try {
      // Initialize enriched profile with basic info
      const enrichedProfile: EnrichedProfile = {
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
      const [linkedInData, newsData, socialData, companyData, wikipediaData] =
        await Promise.all([
          this.searchLinkedInProfile(searchQueries.linkedin),
          this.searchNewsAndMedia(searchQueries.news),
          this.searchSocialProfiles(searchQueries.social),
          this.searchCompanyInfo(searchQueries.company),
          this.searchWikipedia(searchQueries.wikipedia),
        ]);

      // Enrich the profile with found data
      this.enrichWithLinkedInData(enrichedProfile, linkedInData);
      this.enrichWithNewsData(enrichedProfile, newsData);
      this.enrichWithSocialData(enrichedProfile, socialData);
      this.enrichWithCompanyData(enrichedProfile, companyData);
      this.enrichWithWikipediaData(enrichedProfile, wikipediaData);

      return enrichedProfile;
    } catch (error) {
      console.error("Error enriching profile:", error);
      throw new Error("Failed to enrich profile with public information");
    }
  }

  private generateSearchQueries(profile: BaseCustomerProfile): {
    linkedin: string;
    news: string;
    social: string;
    company: string;
    wikipedia: string;
  } {
    const nameQuery = encodeURIComponent(profile.name);
    const companyQuery = profile.companyOwnership?.[0]?.companyName
      ? encodeURIComponent(profile.companyOwnership[0].companyName)
      : "";
    const socialQuery = profile.familyDetails?.spouse
      ? encodeURIComponent(profile.familyDetails.spouse)
      : "";
    return {
      linkedin: `${nameQuery} ${companyQuery} site:linkedin.com/in/`,
      news: `${nameQuery} ${companyQuery} (interview OR article OR news OR press)`,
      social: `${nameQuery} ${socialQuery}  (site:twitter.com OR site:github.com OR site:instagram.com or about relatives or about family)`,
      company: companyQuery
        ? `${companyQuery} company information funding`
        : "",
      wikipedia: `${nameQuery} ${companyQuery}`,
    };
  }

  private async searchLinkedInProfile(query: string): Promise<any> {
    const url = `https://serpapi.com/search.json?engine=google&q=${query}&api_key=${this.serpApiKey}`;
    const response = await axios.get(url);
    return response.data.organic_results || [];
  }

  private async searchNewsAndMedia(query: string): Promise<any> {
    const url = `https://serpapi.com/search.json?engine=google&q=${query}&api_key=${this.serpApiKey}`;
    const response = await axios.get(url);
    return response.data.organic_results || [];
  }

  private async searchSocialProfiles(query: string): Promise<any> {
    const url = `https://serpapi.com/search.json?engine=google&q=${query}&api_key=${this.serpApiKey}`;
    const response = await axios.get(url);
    return response.data.organic_results || [];
  }

  private async searchCompanyInfo(query: string): Promise<any> {
    if (!query) return null;
    const url = `https://serpapi.com/search.json?engine=google&q=${query}&api_key=${this.serpApiKey}`;
    const response = await axios.get(url);
    return response.data.organic_results || [];
  }

  private async searchWikipedia(query: string): Promise<any> {
    if (!query) return null;
    const url = `https://serpapi.com/search.json?engine=wikipedia&q=${query}&api_key=${this.serpApiKey}`;
    const response = await axios.get(url);
    return response.data.organic_results || [];
  }

  private enrichWithLinkedInData(profile: EnrichedProfile, data: any[]): void {
    if (!data.length) return;

    const linkedInResult = data[0];
    if (linkedInResult) {
      // Extract LinkedIn URL
      profile.social.linkedIn = {
        url: linkedInResult.link || "",
      };
      console.log("linkedInResult", linkedInResult);

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

  private enrichWithNewsData(profile: EnrichedProfile, data: any[]): void {
    if (!data.length) return;

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

  private enrichWithSocialData(profile: EnrichedProfile, data: any[]): void {
    if (!data.length) return;

    data.forEach((result) => {
      const url = result.link;
      if (url.includes("twitter.com")) {
        profile.social.twitter = {
          handle: url.split("/").pop() || "",
          url,
          bio: result.snippet,
        };
      } else if (url.includes("github.com")) {
        profile.social.github = {
          username: url.split("/").pop() || "",
          url,
        };
      } else {
        if (!profile.social.other) profile.social.other = [];
        profile.social.other.push({
          platform: this.detectPlatform(url),
          url,
        });
      }
    });
  }

  private enrichWithCompanyData(profile: EnrichedProfile, data: any[]): void {
    if (!data?.length) return;

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
  private enrichWithWikipediaData(profile: EnrichedProfile, data: any[]): void {
    if (!data?.length) return;

    const wiki = data[0];
    if (wiki) {
      profile.basicInfo.shortBio ??= wiki.snippet;
      profile.basicInfo.currentLocation ??= wiki.title.includes("from")
        ? wiki.title.split("from").pop()?.trim()
        : undefined;
    }
  }
  private detectPlatform(url: string): string {
    const hostname = new URL(url).hostname;
    return hostname.split(".")[1] || hostname;
  }
}
