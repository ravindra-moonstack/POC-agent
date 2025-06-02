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
          num: 10,
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
      // Multiple targeted searches with specific queries
      const searches = [
        {
          q: `${name} latest news articles interviews 2024 2025`,
          type: "news",
        },
        {
          q: `${name} twitter X social media official account`,
          type: "social",
        },
        {
          q: `${name} achievements awards recognition career highlights`,
          type: "achievements",
        },
        {
          q: `${name} biography background education career`,
          type: "background",
        },
        {
          q: `${name} skills expertise specialties professional experience`,
          type: "skills",
        },
        {
          q: `${name} technologies tools programming languages frameworks`,
          type: "technical_skills",
        },
        {
          q: `${name} leadership management business entrepreneurship`,
          type: "business_skills",
        },
      ];

      const results = await Promise.all(
        searches.map((search) =>
          axios.get("https://serpapi.com/search.json", {
            params: {
              api_key: config.SERP_API_KEY,
              engine: "google",
              q: search.q.trim(),
              num: 10,
            },
          })
        )
      );

      const newsResults = results[0].data.organic_results || [];
      const socialResults = results[1].data.organic_results || [];
      const achievementResults = results[2].data.organic_results || [];
      const backgroundResults = results[3].data.organic_results || [];
      const skillsResults = results[4].data.organic_results || [];
      const technicalResults = results[5].data.organic_results || [];
      const businessResults = results[6].data.organic_results || [];

      // Combine all skills-related results
      const allSkillsResults = [
        ...skillsResults,
        ...technicalResults,
        ...businessResults,
      ];

      // Extract skills with multiple patterns
      const skills = new Set<string>();

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
              url: link.split("?")[0], // Remove query parameters
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

      allSkillsResults.forEach((result) => {
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

        // Pattern 4: Industry expertise
        const industryPattern =
          /(industry experience|sector expertise|market knowledge) in ([^.!?]+)/gi;
        const industryMatches = content.matchAll(industryPattern);
        for (const match of industryMatches) {
          if (match[2]) {
            match[2]
              .split(/[,&]/)
              .map((industry) => industry.trim())
              .filter((industry) => industry.length > 2)
              .forEach((industry) =>
                skills.add(`Industry expertise: ${industry}`)
              );
          }
        }
      });

      // Extract achievements with better filtering
      const achievements = achievementResults
        .filter(
          (result) =>
            result.snippet &&
            (result.snippet.toLowerCase().includes("award") ||
              result.snippet.toLowerCase().includes("achievement") ||
              result.snippet.toLowerCase().includes("recognition") ||
              result.snippet.toLowerCase().includes("honor") ||
              result.snippet.toLowerCase().includes("prize"))
        )
        .map((result) => ({
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

      // Extract media mentions
      if (
        content.toLowerCase().includes("news") ||
        content.toLowerCase().includes("article")
      ) {
        info.mediaPresence!.newsArticles.push({
          title: result.title,
          source: result.source || "Web",
          date: result.date || new Date().toISOString().split("T")[0],
          url: result.url || "",
          snippet: result.snippet,
        });
      }

      // Extract publications
      if (
        content.toLowerCase().includes("published") ||
        content.toLowerCase().includes("publication")
      ) {
        info.mediaPresence!.publications.push({
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

  private async cacheEnrichmentResult(
    customerId: string,
    result: EnrichmentResult
  ): Promise<void> {
    try {
      await redis.setex(
        `profile_enrichment:${customerId}`,
        CACHE_TTL,
        JSON.stringify(result)
      );
    } catch (error) {
      // Log error but continue - caching is not critical for functionality
      console.warn("Failed to cache enrichment result:", error);
    }
  }

  private async getCachedEnrichmentResult(
    customerId: string
  ): Promise<EnrichmentResult | null> {
    try {
      const cached = await redis.get(`profile_enrichment:${customerId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      // Log error but continue - caching is not critical for functionality
      console.warn("Failed to get cached enrichment result:", error);
      return null;
    }
  }

  public async enrichCustomerProfile(customer: {
    _id: Types.ObjectId;
    name: string;
    email?: string;
    companyOwnership?: Array<{
      companyName: string;
      role: string;
      ownershipPercentage?: number;
    }>;
  }): Promise<{
    enrichedProfile: EnrichmentResult;
  }> {
    // Check cache first
    const cached = await this.getCachedEnrichmentResult(
      customer._id.toString()
    );
    if (cached) {
      return {
        enrichedProfile: cached,
      };
    }

    // Parallel API calls for faster response
    const [linkedInData, googleData] = await Promise.all([
      this.searchLinkedIn(
        customer.name,
        customer.companyOwnership?.[0]?.companyName
      ),
      this.searchGoogle(customer.name, undefined),
    ]);

    // Merge results, preferring LinkedIn data for professional info
    const enrichedProfile: EnrichmentResult = {
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
        currentLocation:
          linkedInData.basicInfo?.currentLocation ||
          googleData.basicInfo?.currentLocation,
        profilePictureUrl:
          linkedInData.basicInfo?.profilePictureUrl ||
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

export const profileEnrichmentService = new ProfileEnrichmentService();
