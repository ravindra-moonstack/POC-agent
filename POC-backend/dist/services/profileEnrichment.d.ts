import { Types } from "mongoose";
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
export declare class ProfileEnrichmentService {
    private searchLinkedIn;
    private searchGoogle;
    private normalizeString;
    private isRelevantResult;
    private extractProfileInfo;
    private cacheEnrichmentResult;
    private getCachedEnrichmentResult;
    enrichCustomerProfile(customer: {
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
    }>;
}
export declare const profileEnrichmentService: ProfileEnrichmentService;
export {};
