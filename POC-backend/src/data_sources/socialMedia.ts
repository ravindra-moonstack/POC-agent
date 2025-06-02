import axios from "axios";
import { config } from "../config/env";
import { APIError } from "../utils/errorHandler";

interface SocialMediaProfile {
  platforms: {
    twitter?: {
      handle: string;
      url: string;
      followers?: number;
      bio?: string;
      engagement?: string;
    };
    facebook?: {
      url: string;
      followers?: number;
      engagement?: string;
    };
    instagram?: {
      handle: string;
      url: string;
      followers?: number;
      engagement?: string;
    };
    linkedin?: {
      url: string;
      followers?: number;
      engagement?: string;
    };
  };
  activity: {
    postFrequency: string;
    engagement: string;
    lastActive?: Date;
  };
}

export class SocialMediaDataSource {
  private readonly serpApiKey: string | undefined;
  private readonly baseUrl: string = "https://serpapi.com/search.json";

  constructor() {
    this.serpApiKey = config.SERP_API_KEY;
  }

  async fetchSocialPresence(
    name: string,
    company?: string
  ): Promise<SocialMediaProfile> {
    if (process.env.NODE_ENV === "production" && !this.serpApiKey) {
      throw new APIError(500, "SERP API key not configured");
    }

    if (!this.serpApiKey) {
      return this.getMockSocialProfile();
    }

    try {
      const [twitterData, facebookData, instagramData, linkedinData] =
        await Promise.all([
          this.searchPlatform(name, company, "twitter.com"),
          this.searchPlatform(name, company, "facebook.com"),
          this.searchPlatform(name, company, "instagram.com"),
          this.searchPlatform(name, company, "linkedin.com/in"),
        ]);

      return this.aggregateSocialData(
        twitterData,
        facebookData,
        instagramData,
        linkedinData
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new APIError(401, "Invalid SERP API key");
        } else if (error.code === "ECONNABORTED") {
          throw new APIError(408, "Social media search timeout");
        }
        throw new APIError(error.response?.status || 500, error.message);
      }
      throw error;
    }
  }

  private async searchPlatform(
    name: string,
    company: string | undefined,
    domain: string
  ): Promise<any> {
    const query = company
      ? `${encodeURIComponent(name)} ${encodeURIComponent(
          company
        )} site:${domain}`
      : `${encodeURIComponent(name)} site:${domain}`;

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          api_key: this.serpApiKey,
          engine: "google",
          q: query,
          num: 1,
        },
        timeout: 10000,
      });

      return response.data.organic_results?.[0] || null;
    } catch (error) {
      console.error(`Error searching ${domain}:`, error);
      return null;
    }
  }

  private getMockSocialProfile(): SocialMediaProfile {
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

  private aggregateSocialData(
    twitterData: any,
    facebookData: any,
    instagramData: any,
    linkedinData: any
  ): SocialMediaProfile {
    const profile: SocialMediaProfile = {
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

  private estimateEngagement(snippet?: string): string {
    if (!snippet) return "Unknown";

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

    if (
      engagementIndicators.high.some((indicator) =>
        snippetLower.includes(indicator)
      )
    ) {
      return "High";
    } else if (
      engagementIndicators.medium.some((indicator) =>
        snippetLower.includes(indicator)
      )
    ) {
      return "Medium";
    } else if (
      engagementIndicators.low.some((indicator) =>
        snippetLower.includes(indicator)
      )
    ) {
      return "Low";
    }

    return "Unknown";
  }

  private estimateOverallActivity(platforms: SocialMediaProfile["platforms"]): {
    postFrequency: string;
    engagement: string;
    lastActive?: Date;
  } {
    const engagementLevels = Object.values(platforms)
      .map((platform) => platform?.engagement)
      .filter(Boolean) as string[];

    if (engagementLevels.length === 0) {
      return {
        postFrequency: "Unknown",
        engagement: "Unknown",
        lastActive: undefined,
      };
    }

    const highCount = engagementLevels.filter(
      (level) => level === "High"
    ).length;
    const mediumCount = engagementLevels.filter(
      (level) => level === "Medium"
    ).length;

    let overallEngagement = "Low";
    if (highCount >= 2 || (highCount === 1 && mediumCount >= 1)) {
      overallEngagement = "High";
    } else if (mediumCount >= 2 || highCount === 1) {
      overallEngagement = "Medium";
    }

    return {
      postFrequency: this.estimatePostFrequency(overallEngagement),
      engagement: overallEngagement,
      lastActive: new Date(), // We could potentially get this from the most recent post/activity
    };
  }

  private estimatePostFrequency(engagement: string): string {
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
