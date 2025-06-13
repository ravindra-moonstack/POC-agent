import axios from "axios";
import { config } from "../config/env";
import { ICustomer } from "../models/Customer";
import { Types } from "mongoose";
import { redis } from "../config/redis";

interface EnrichmentResult {
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
      description: string;
      date?: string;
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
      repos?: number;
      stars?: number;
    };
    other?: Array<{
      platform: string;
      url: string;
      metrics?: Record<string, string | number>;
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
  basicInfo: {
    name: string;
    currentLocation?: string;
    profilePictureUrl?: string;
    shortBio?: string;
  };
  mediaPresence: {
    newsArticles: Array<{
      title: string;
      source: string;
      date: string;
      url: string;
      snippet?: string;
    }>;
    interviews: Array<{
      title: string;
      platform: string;
      date: string;
      url: string;
    }>;
    publications: Array<{
      title: string;
      platform: string;
      date: string;
      url: string;
      type: string;
    }>;
  };
}

const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

export class ProfileEnrichmentService {
  private async getLinkedInAccessToken(code: string): Promise<string | null> {
    try {
      const params = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        client_id: config.LINKEDIN_CLIENT_ID,
        client_secret: config.LINKEDIN_CLIENT_SECRET,
        redirect_uri: config.LINKEDIN_REDIRECT_URI,
      });

      const response = await axios.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error("Error getting LinkedIn access token:", error);
      return null;
    }
  }

  private async searchLinkedIn(
    name: string,
    currentCompany?: string
  ): Promise<Partial<EnrichmentResult>> {
    try {
      if (!config.SERP_API_KEY) {
        console.log("SERP API key not configured, skipping LinkedIn search");
        return {
          professional: {
            jobHistory: [],
            education: [],
          },
          social: {},
        };
      }

      // First, try to get the exact LinkedIn profile
      const linkedInQuery = `${name} ${
        currentCompany || ""
      } site:linkedin.com/in/`;
      const response = await axios.get(`https://serpapi.com/search.json`, {
        params: {
          api_key: config.SERP_API_KEY,
          engine: "google",
          q: linkedInQuery.trim(),
          num: 5,
        },
      });

      const results = response.data.organic_results || [];
      if (results.length === 0) {
        return {
          professional: {
            jobHistory: [],
            education: [],
          },
          social: {},
        };
      }

      // Get more detailed information about the person
      const detailQuery = `${name} ${
        currentCompany || ""
      } career education background`;
      const detailResponse = await axios.get(
        `https://serpapi.com/search.json`,
        {
          params: {
            api_key: config.SERP_API_KEY,
            engine: "google",
            q: detailQuery.trim(),
            num: 10,
          },
        }
      );

      const detailResults = detailResponse.data.organic_results || [];

      // Get the first result which should be the LinkedIn profile
      const linkedInResult = results[0];
      const profileUrl = linkedInResult.link;
      const title = linkedInResult.title || "";
      const snippet = linkedInResult.snippet || "";

      // Extract current role from title
      let currentRole = {
        title: "",
        company: currentCompany || "",
        startDate: new Date().getFullYear().toString(),
      };

      const titleMatch = title.match(
        /.*?\s*-\s*(.*?)\s+(?:at|@)\s+(.*?)(?:\s*\|.*|$)/i
      );
      if (titleMatch) {
        currentRole = {
          title: titleMatch[1].trim(),
          company: titleMatch[2].trim(),
          startDate: new Date().getFullYear().toString(),
        };
      }

      // Combine snippets for better information extraction
      const allSnippets = [snippet, ...detailResults.map((r) => r.snippet)]
        .filter(Boolean)
        .join(" ");

      // Extract education and experience from all snippets
      const education: Array<{
        institution: string;
        degree: string;
        field: string;
        year?: string;
      }> = [];

      const jobHistory: Array<{
        title: string;
        company: string;
        duration: string;
        location?: string;
        description?: string;
      }> = [];

      // Look for education information in snippets
      const eduMatches = allSnippets.match(
        /(?:studied|graduated|degree|education|attended|alumni).*?(?:at|from)\s+([\w\s&,]+)(?:\.|\n|in|\(|with)/gi
      );
      if (eduMatches) {
        eduMatches.forEach((match) => {
          const institution = match
            .replace(
              /(?:studied|graduated|degree|education|attended|alumni).*?(?:at|from)\s+/i,
              ""
            )
            .replace(/(?:\.|\n|in|\(|with).*$/, "")
            .trim();
          education.push({
            institution,
            degree: "Not specified",
            field: "Not specified",
          });
        });
      }

      // Look for previous positions with improved pattern matching
      const positionMatches = allSnippets.match(
        /(?:former|previously|worked|experience|served|founder|ceo|executive|leader).*?(?:at|with|of)\s+([\w\s&,]+)(?:\.|\n|from|\()/gi
      );
      if (positionMatches) {
        positionMatches.forEach((match) => {
          const company = match
            .replace(
              /(?:former|previously|worked|experience|served|founder|ceo|executive|leader).*?(?:at|with|of)\s+/i,
              ""
            )
            .replace(/(?:\.|\n|from|\().*$/, "")
            .trim();
          if (
            company &&
            company.length > 1 &&
            !jobHistory.some((job) => job.company === company)
          ) {
            jobHistory.push({
              title: match.includes("CEO")
                ? "CEO"
                : match.includes("founder")
                ? "Founder"
                : match.includes("executive")
                ? "Executive"
                : "Previous Position",
              company,
              duration: "Not specified",
            });
          }
        });
      }

      // Extract location if available
      const locationMatch = allSnippets.match(
        /(?:based in|located in|from|lives in|residing in)\s+([\w\s,]+)(?:\.|\n|and|where)/i
      );
      const location = locationMatch ? locationMatch[1].trim() : undefined;

      // Extract skills and expertise
      const skillsMatch = allSnippets.match(
        /(?:skills|expertise|specialized in|focus on|known for|expert in).*?(?:include|includes|including|such as|in)\s+((?:[^.](?!(?:including|such as|in)))+)/i
      );
      const skills = skillsMatch
        ? skillsMatch[1]
            .split(/[,&]/)
            .map((skill) => skill.trim())
            .filter((skill) => skill.length > 0)
        : [];

      // Extract bio
      const bioMatch = allSnippets.match(/(?:is|was)\s+(?:an?|the)\s+([^.]+)/i);
      const shortBio = bioMatch ? bioMatch[0].trim() : undefined;

      return {
        professional: {
          currentRole,
          jobHistory,
          education,
          skills,
        },
        social: {
          linkedIn: {
            url: profileUrl,
          },
        },
        basicInfo: {
          name,
          currentLocation: location,
          shortBio,
        },
      };
    } catch (error) {
      console.error("LinkedIn search error:", error);
      return {
        professional: {
          jobHistory: [],
          education: [],
        },
        social: {},
      };
    }
  }

  private async searchGoogle(
    name: string,
    location?: string
  ): Promise<Partial<EnrichmentResult>> {
    if (!config.SERP_API_KEY) {
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
      // Combine multiple queries into a single search to reduce API calls
      const combinedQuery = `${name} ${
        location || ""
      } (profile OR bio OR career OR background OR achievements OR skills OR expertise OR news OR interview OR article)`;

      const response = await axios.get("https://serpapi.com/search.json", {
        params: {
          api_key: config.SERP_API_KEY,
          engine: "google",
          q: combinedQuery.trim(),
          num: 20, // Increased number of results to compensate for combined query
        },
        timeout: 10000, // 10 second timeout
      });

      // Check for rate limiting
      if (response.status === 429) {
        console.warn("SerpAPI rate limit reached, returning empty results");
        return {
          professional: {
            jobHistory: [],
            education: [],
          },
          social: {},
        };
      }

      const results = response.data.organic_results || [];

      // Extract different types of information from the combined results
      const newsResults = results.filter(
        (result) =>
          result.snippet?.toLowerCase().includes("news") ||
          result.snippet?.toLowerCase().includes("article") ||
          result.snippet?.toLowerCase().includes("interview")
      );

      const socialResults = results.filter(
        (result) =>
          result.link?.includes("twitter.com") ||
          result.link?.includes("github.com") ||
          result.link?.includes("linkedin.com")
      );

      const achievementResults = results.filter(
        (result) =>
          result.snippet?.toLowerCase().includes("award") ||
          result.snippet?.toLowerCase().includes("achievement") ||
          result.snippet?.toLowerCase().includes("recognition")
      );

      const backgroundResults = results.filter(
        (result) =>
          result.snippet?.toLowerCase().includes("career") ||
          result.snippet?.toLowerCase().includes("background") ||
          result.snippet?.toLowerCase().includes("education")
      );

      // Extract skills with multiple patterns
      const skills = new Set<string>();
      results.forEach((result) => {
        const content = `${result.title} ${result.snippet}`.toLowerCase();

        // Pattern 1: Direct skills mentions
        const skillsPatterns = [
          /skills(?:[\s:]+)((?:[^.!?](?!(?:include|includes|including|such as|in)))+)/i,
          /expertise(?:[\s:]+)((?:[^.!?](?!(?:include|includes|including|such as|in)))+)/i,
          /specialized in(?:[\s:]+)((?:[^.!?](?!(?:include|includes|including|such as|in)))+)/i,
          /proficient in(?:[\s:]+)((?:[^.!?](?!(?:include|includes|including|such as|in)))+)/i,
          /expert in(?:[\s:]+)((?:[^.!?](?!(?:include|includes|including|such as|in)))+)/i,
          /known for(?:[\s:]+)((?:[^.!?](?!(?:include|includes|including|such as|in)))+)/i,
        ];

        skillsPatterns.forEach((pattern) => {
          const match = content.match(pattern);
          if (match) {
            match[1]
              .split(/[,&]/)
              .map((skill) => skill.trim())
              .filter((skill) => skill.length > 2 && !skill.includes("more"))
              .forEach((skill) => skills.add(skill));
          }
        });

        // Pattern 2: Technologies and tools
        const techPattern =
          /(using|works? with|developed|built|created|implemented|managed|led|designed) ([^.!?]+)/gi;
        const techMatches = content.matchAll(techPattern);
        for (const match of techMatches) {
          if (match[2]) {
            match[2]
              .split(/[,&]/)
              .map((tech) => tech.trim())
              .filter((tech) => tech.length > 2 && !tech.includes("more"))
              .forEach((tech) => skills.add(tech));
          }
        }

        // Pattern 3: Leadership and business skills
        const leadershipPattern =
          /(led|managed|directed|founded|launched|scaled|grew|transformed|improved|developed) ([^.!?]+)/gi;
        const leadershipMatches = content.matchAll(leadershipPattern);
        for (const match of leadershipMatches) {
          if (match[2]) {
            const achievement = match[0].trim();
            if (achievement.length > 10) {
              skills.add(`Leadership: ${achievement}`);
            }
          }
        }
      });

      // Extract social media profiles
      const social: any = {};
      socialResults.forEach((result) => {
        const { link, snippet, title } = result;

        // Twitter/X matching
        if (link.includes("twitter.com") || link.includes("x.com")) {
          const handle = link.split("/").filter(Boolean).pop();
          if (
            handle &&
            ![
              "with_replies",
              "media",
              "likes",
              "following",
              "followers",
              "highlights",
            ].includes(handle)
          ) {
            social.twitter = {
              handle,
              url: link.split("?")[0], // Remove query parameters
              bio: snippet,
            };
          }
        }
        // GitHub matching
        else if (link.includes("github.com")) {
          const username = link.split("/").filter(Boolean).pop();
          if (username) {
            social.github = {
              username,
              url: `https://github.com/${username}`,
            };
          }
        }
      });

      // Extract news articles and media presence
      const mediaPresence = {
        newsArticles: newsResults.map((result) => ({
          title: result.title,
          source: result.source || this.extractSource(result.link) || "Web",
          date: result.date || new Date().toISOString().split("T")[0],
          url: result.link,
          snippet: result.snippet,
        })),
        interviews: [],
        publications: [],
      };

      // Extract achievements
      const achievements = achievementResults.map((result) => ({
        title: result.title,
        description: result.snippet,
        date: this.extractDate(result.snippet) || result.date,
      }));

      // Extract interests and activities
      const interests = {
        topics: this.extractTopics(backgroundResults),
        hobbies: [],
        publicActivities: this.extractActivities(backgroundResults).map(
          (activity) => ({
            type: "Public Activity",
            description: activity,
            source: "Google Search",
          })
        ),
      };

      return {
        professional: {
          jobHistory: [],
          education: [],
          achievements,
          skills: Array.from(skills),
        },
        social,
        mediaPresence,
        interests,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          console.warn("SerpAPI rate limit reached, returning empty results");
        } else if (error.response?.status === 401) {
          console.error("Invalid SerpAPI key");
        } else if (error.code === "ECONNABORTED") {
          console.error("SerpAPI request timed out");
        } else {
          console.error("SerpAPI request failed:", error.message);
        }
      } else {
        console.error("Unexpected error during Google search:", error);
      }

      return {
        professional: {
          jobHistory: [],
          education: [],
        },
        social: {},
      };
    }
  }

  private extractSource(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace(/^www\./, "").split(".")[0];
    } catch {
      return "Web";
    }
  }

  private extractDate(text: string): string | undefined {
    const dateMatch = text.match(
      /(?:in|on|from)?\s*((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4})/i
    );
    return dateMatch ? dateMatch[1] : undefined;
  }

  private extractTopics(results: any[]): string[] {
    const topics = new Set<string>();
    results.forEach((result) => {
      const text = `${result.title} ${result.snippet}`.toLowerCase();
      // Add relevant topics based on content
      if (text.includes("technology")) topics.add("Technology");
      if (text.includes("space") || text.includes("spacex"))
        topics.add("Space Exploration");
      if (text.includes("electric") || text.includes("tesla"))
        topics.add("Electric Vehicles");
      if (text.includes("ai") || text.includes("artificial intelligence"))
        topics.add("Artificial Intelligence");
      // Add more topic extraction logic as needed
    });
    return Array.from(topics);
  }

  private extractActivities(results: any[]): string[] {
    const activities: string[] = [];
    results.forEach((result) => {
      const text = result.snippet || "";
      if (text.match(/(?:founded|launched|started|established)/i)) {
        activities.push(text.split(".")[0] + ".");
      }
      // Add more activity extraction patterns
    });
    return activities;
  }

  private normalizeString(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  private isRelevantResult(
    title: string,
    snippet: string,
    name: string
  ): boolean {
    const normalizedName = this.normalizeString(name);
    const normalizedContent = this.normalizeString(title + " " + snippet);

    // Check if the result contains the exact name and relevant keywords
    return (
      normalizedContent.includes(normalizedName) &&
      (normalizedContent.includes("profile") ||
        normalizedContent.includes("linkedin") ||
        normalizedContent.includes("professional"))
    );
  }

  private extractProfileInfo(results: any[]): Partial<EnrichmentResult> {
    const info: Partial<EnrichmentResult> = {
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
        info.basicInfo!.currentLocation = locationMatch[1].trim();
      }

      // Extract short bio
      const bioMatch = content.match(/(?:about|bio|summary)[:\s]+([^.]+)/i);
      if (bioMatch) {
        info.basicInfo!.shortBio = bioMatch[1].trim();
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
      const activityMatch = content.match(
        /(volunteer|mentor|speak|organize)[^\.]*/gi
      );
      if (activityMatch && info.interests?.publicActivities) {
        activityMatch.forEach((activity) => {
          info.interests!.publicActivities!.push({
            type: "Public Activity",
            description: activity.trim(),
            source: "Search Result",
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
    });

    return info;
  }

  async enrichProfile(profile: {
    _id: Types.ObjectId;
    name: string;
    email?: string;
    companyOwnership?: Array<{
      companyName: string;
      role: string;
      ownershipPercentage?: number;
    }>;
  }): Promise<EnrichmentResult> {
    try {
      // Get current company if available
      const currentCompany = profile.companyOwnership?.[0]?.companyName;

      // Search LinkedIn and Google in parallel
      const [linkedInData, googleData] = await Promise.all([
        this.searchLinkedIn(profile.name, currentCompany),
        this.searchGoogle(profile.name),
      ]);

      // Merge the results
      const enrichedProfile: EnrichmentResult = {
        basicInfo: {
          name: profile.name,
          ...linkedInData.basicInfo,
          ...googleData.basicInfo,
        },
        professional: {
          currentRole:
            linkedInData.professional?.currentRole ||
            googleData.professional?.currentRole,
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
          ...linkedInData.social,
          ...googleData.social,
        },
        mediaPresence: {
          newsArticles: [
            ...(linkedInData.mediaPresence?.newsArticles || []),
            ...(googleData.mediaPresence?.newsArticles || []),
          ],
          interviews: [
            ...(linkedInData.mediaPresence?.interviews || []),
            ...(googleData.mediaPresence?.interviews || []),
          ],
          publications: [
            ...(linkedInData.mediaPresence?.publications || []),
            ...(googleData.mediaPresence?.publications || []),
          ],
        },
        interests: {
          topics: [
            ...(linkedInData.interests?.topics || []),
            ...(googleData.interests?.topics || []),
          ],
          hobbies: [
            ...(linkedInData.interests?.hobbies || []),
            ...(googleData.interests?.hobbies || []),
          ],
          publicActivities: [
            ...(linkedInData.interests?.publicActivities || []),
            ...(googleData.interests?.publicActivities || []),
          ],
        },
      };

      return enrichedProfile;
    } catch (error) {
      console.error("Error enriching profile:", error);
      throw new Error("Failed to enrich profile");
    }
  }
}
