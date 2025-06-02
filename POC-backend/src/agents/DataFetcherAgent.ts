import { LinkedInDataSource } from "../data_sources/linkedin";
import { PANDataSource } from "../data_sources/panData";
import { SocialMediaDataSource } from "../data_sources/socialMedia";
import { CustomerProfile } from "../types/customer";

export class DataFetcherAgent {
  private linkedInSource: LinkedInDataSource;
  private panSource: PANDataSource;
  private socialMediaSource: SocialMediaDataSource;

  constructor() {
    this.linkedInSource = new LinkedInDataSource();
    this.panSource = new PANDataSource();
    this.socialMediaSource = new SocialMediaDataSource();
  }

  async fetchCustomerData(customerId: string): Promise<CustomerProfile> {
    try {
      console.log("Fetching customer data for:", customerId);

      // Use public search for LinkedIn data instead of authenticated fetch
      const [linkedInSearchResult, panData, socialData] = await Promise.all([
        this.linkedInSource.searchPublicInfo(customerId),
        this.panSource.fetchPANDetails(customerId),
        this.socialMediaSource.fetchSocialPresence(customerId),
      ]);

      // Extract LinkedIn info from search results
      const linkedInData = linkedInSearchResult.linkedInInfo || {
        title: "",
        company: "",
        experience: [],
      };

      console.log("LinkedIn data found:", linkedInData);

      // Construct the response with proper typing
      const customerProfile: CustomerProfile = {
        basicInfo: {
          name: panData.name,
          dateOfBirth: panData.dateOfBirth,
          address: panData.address,
          panNumber: panData.panNumber,
        },
        professional: {
          title: linkedInData.title,
          company: linkedInData.company,
          experience: linkedInData.experience,
          ...(linkedInData.summary && { summary: linkedInData.summary }),
          ...(linkedInData.publicProfileUrl && {
            publicProfileUrl: linkedInData.publicProfileUrl,
          }),
        },
        social: {
          platforms: socialData.platforms,
          activity: socialData.activity,
          ...(linkedInSearchResult.socialMedia && {
            additionalProfiles: linkedInSearchResult.socialMedia.map(
              (profile) => ({
                platform: profile.platform,
                url: profile.url,
                username: profile.username,
              })
            ),
          }),
        },
      };

      return customerProfile;
    } catch (error) {
      console.error("Error fetching customer data:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch customer data: ${error.message}`);
      }
      throw new Error("Failed to fetch customer data");
    }
  }
}
