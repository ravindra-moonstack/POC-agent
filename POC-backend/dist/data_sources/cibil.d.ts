interface CibilProfile {
    score: number;
    netWorth: number;
    lastUpdated: Date;
    creditHistory?: Array<{
        type: string;
        status: string;
        amount: number;
        date: Date;
    }>;
}
export declare class CibilAPI {
    private apiKey;
    private readonly baseUrl;
    constructor();
    fetchCreditProfile(customerId: string): Promise<CibilProfile>;
    private getMockProfile;
    private transformProfileData;
}
export {};
