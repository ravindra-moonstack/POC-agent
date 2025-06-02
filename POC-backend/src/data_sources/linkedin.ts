import axios from "axios";
import { config } from "../config/env";
import { APIError } from "../utils/errorHandler";

export interface LinkedInProfile {
  title: string;
  company: string;
  experience: Array<{
    company: string;
    role: string;
    duration: string;
  }>;
  profileUrl?: string;
  industry?: string;
  location?: string;
  fullName?: string;
  summary?: string;
  publicProfileUrl?: string;
}

export interface PublicSearchResult {
  linkedInInfo?: LinkedInProfile;
  companyInfo?: {
    name: string;
    description?: string;
    website?: string;
    industry?: string;
  };
  socialMedia?: Array<{
    platform: string;
    url: string;
    username?: string;
  }>;
  possibleMatches?: Array<{
    name: string;
    title?: string;
    company?: string;
    profileUrl?: string;
  }>;
}

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
}

interface LinkedInProfileResponse {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: {
    displayImage: string;
  };
  positions: {
    elements: Array<{
      title: string;
      companyName: string;
      startDate: {
        year: number;
        month: number;
      };
      endDate?: {
        year: number;
        month: number;
      };
    }>;
  };
  industry?: {
    name: string;
  };
  location?: {
    country: string;
    city: string;
  };
}

export class LinkedInDataSource {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly apiVersion = "v2";
  private readonly baseUrl = "https://api.linkedin.com";
  private readonly scope = "r_liteprofile r_emailaddress r_organization_social";
  private readonly serpApiKey: string | undefined;

  constructor() {
    this.clientId = config.LINKEDIN_CLIENT_ID;
    this.clientSecret = config.LINKEDIN_CLIENT_SECRET;
    this.redirectUri = config.LINKEDIN_REDIRECT_URI;
    this.serpApiKey = config.SERP_API_KEY;

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error("LinkedIn credentials not configured");
    }
  }

  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope,
      state: Math.random().toString(36).substring(7),
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  async getAccessToken(authorizationCode: string): Promise<string> {
    try {
      const params = new URLSearchParams({
        grant_type: "authorization_code",
        code: authorizationCode,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
      });

      const response = await axios.post<LinkedInTokenResponse>(
        `${this.baseUrl}/oauth/v2/accessToken`,
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new APIError(
          error.response?.status || 500,
          "Failed to get LinkedIn access token"
        );
      }
      throw error;
    }
  }

  async fetchProfile(accessToken: string): Promise<LinkedInProfile> {
    try {
      const response = await axios.get<LinkedInProfileResponse>(
        `${this.baseUrl}/${this.apiVersion}/me?projection=(id,localizedFirstName,localizedLastName,profilePicture,positions,industry,location)`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return this.transformProfileData(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new APIError(
          error.response?.status || 500,
          "Failed to fetch LinkedIn profile"
        );
      }
      throw error;
    }
  }

  private transformProfileData(data: LinkedInProfileResponse): LinkedInProfile {
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

  private formatDuration(
    startDate: { year: number; month: number },
    endDate?: { year: number; month: number }
  ): string {
    const start = `${startDate.year}/${String(startDate.month).padStart(
      2,
      "0"
    )}`;
    const end = endDate
      ? `${endDate.year}/${String(endDate.month).padStart(2, "0")}`
      : "Present";
    return `${start} - ${end}`;
  }

  async searchPublicInfo(query: string): Promise<PublicSearchResult> {
    if (!this.serpApiKey) {
      throw new APIError(400, "SERP API key not configured");
    }

    try {
      // Search for LinkedIn profile
      const linkedInSearchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(
        `${query} site:linkedin.com/in/`
      )}&api_key=${this.serpApiKey}`;

      const linkedInResponse = await axios.get(linkedInSearchUrl);
      const linkedInResults = linkedInResponse.data.organic_results || [];

      // Search for company information
      const companySearchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(
        `${query} company`
      )}&api_key=${this.serpApiKey}`;

      const companyResponse = await axios.get(companySearchUrl);
      const companyResults = companyResponse.data.organic_results || [];

      // Search for social media profiles
      const socialPlatforms = ["twitter.com", "facebook.com", "instagram.com"];
      const socialMediaResults = await Promise.all(
        socialPlatforms.map(async (platform) => {
          const socialSearchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(
            `${query} site:${platform}`
          )}&api_key=${this.serpApiKey}`;
          const response = await axios.get(socialSearchUrl);
          return {
            platform,
            results: response.data.organic_results || [],
          };
        })
      );

      return this.transformPublicSearchResults(
        linkedInResults,
        companyResults,
        socialMediaResults
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new APIError(
          error.response?.status || 500,
          "Failed to search public information"
        );
      }
      throw error;
    }
  }

  private transformPublicSearchResults(
    linkedInResults: any[],
    companyResults: any[],
    socialMediaResults: Array<{ platform: string; results: any[] }>
  ): PublicSearchResult {
    const result: PublicSearchResult = {};

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
      .filter((item): item is NonNullable<typeof item> => item !== null);

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

  private extractTitle(title: string): string {
    const parts = title.split(" - ");
    return parts.length > 1 ? parts[1].trim() : "";
  }

  private extractCompany(title: string): string {
    const parts = title.split(" - ");
    return parts.length > 2 ? parts[2].trim() : "";
  }

  private extractName(title: string): string {
    const parts = title.split(" - ");
    return parts[0].trim();
  }

  private extractUsername(url: string, platform: string): string | undefined {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      return pathParts[pathParts.length - 1];
    } catch {
      return undefined;
    }
  }
}
