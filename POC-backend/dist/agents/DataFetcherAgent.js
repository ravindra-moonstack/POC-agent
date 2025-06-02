"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataFetcherAgent = void 0;
const linkedin_1 = require("../data_sources/linkedin");
const panData_1 = require("../data_sources/panData");
const socialMedia_1 = require("../data_sources/socialMedia");
class DataFetcherAgent {
    constructor() {
        this.linkedInSource = new linkedin_1.LinkedInDataSource();
        this.panSource = new panData_1.PANDataSource();
        this.socialMediaSource = new socialMedia_1.SocialMediaDataSource();
    }
    async fetchCustomerData(customerId) {
        try {
            // Fetch data from all sources in parallel
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
            const customerProfile = {
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
                        additionalProfiles: linkedInSearchResult.socialMedia.map((profile) => ({
                            platform: profile.platform,
                            url: profile.url,
                            username: profile.username,
                        })),
                    }),
                },
            };
            return customerProfile;
        }
        catch (error) {
            console.error("Error fetching customer data:", error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch customer data: ${error.message}`);
            }
            throw new Error("Failed to fetch customer data");
        }
    }
}
exports.DataFetcherAgent = DataFetcherAgent;
//# sourceMappingURL=DataFetcherAgent.js.map