export interface CustomerProfile {
    basicInfo: {
        name: string;
        dateOfBirth: string;
        address: string;
        panNumber: string;
    };
    professional: {
        title: string;
        company: string;
        experience: Array<{
            company: string;
            role: string;
            duration: string;
        }>;
        summary?: string;
        publicProfileUrl?: string;
    };
    social: {
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
        additionalProfiles?: Array<{
            platform: string;
            url: string;
            username?: string;
        }>;
    };
}
