interface PANDetails {
    panNumber: string;
    name: string;
    dateOfBirth: string;
    address: string;
    verificationStatus?: "VERIFIED" | "UNVERIFIED" | "FAILED";
    lastVerified?: Date;
}
export declare class PANDataSource {
    private readonly apiKey;
    private readonly baseUrl;
    constructor();
    fetchPANDetails(panNumber: string): Promise<PANDetails>;
    private getMockPANDetails;
    private transformPANData;
    private validateVerificationStatus;
}
export {};
