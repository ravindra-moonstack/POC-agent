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
export declare class ProfileEnrichmentService {
    private readonly serpApiKey;
    constructor();
    enrichProfile(baseProfile: BaseCustomerProfile): Promise<EnrichedProfile>;
    private generateSearchQueries;
    private searchLinkedInProfile;
    private searchNewsAndMedia;
    private searchSocialProfiles;
    private searchCompanyInfo;
    private enrichWithLinkedInData;
    private enrichWithNewsData;
    private enrichWithSocialData;
    private enrichWithCompanyData;
    private detectPlatform;
}
