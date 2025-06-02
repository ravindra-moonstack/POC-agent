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
export declare class LinkedInDataSource {
    private readonly clientId;
    private readonly clientSecret;
    private readonly redirectUri;
    private readonly apiVersion;
    private readonly baseUrl;
    private readonly scope;
    private readonly serpApiKey;
    constructor();
    getAuthorizationUrl(): string;
    getAccessToken(authorizationCode: string): Promise<string>;
    fetchProfile(accessToken: string): Promise<LinkedInProfile>;
    private transformProfileData;
    private formatDuration;
    searchPublicInfo(query: string): Promise<PublicSearchResult>;
    private transformPublicSearchResults;
    private extractTitle;
    private extractCompany;
    private extractName;
    private extractUsername;
}
