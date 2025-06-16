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
export declare class SocialMediaDataSource {
    private readonly serpApiKey;
    private readonly baseUrl;
    constructor();
    fetchSocialPresence(name: string, company?: string): Promise<SocialMediaProfile>;
    private searchPlatform;
    private getMockSocialProfile;
    private aggregateSocialData;
    private estimateEngagement;
    private estimateOverallActivity;
    private estimatePostFrequency;
}
export {};
