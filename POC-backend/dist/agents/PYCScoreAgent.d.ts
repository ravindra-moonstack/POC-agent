export declare class PYCScoreAgent {
    private readonly weights;
    private db;
    constructor();
    calculateScore(customerId: string): Promise<number>;
    private getCustomerProfile;
    private getCustomerMeetings;
    private getCustomerInvestments;
    private aggregateFactors;
    private calculateFinancialFactors;
    private calculatePersonalFactors;
    private calculateInvestmentFactors;
    private calculateLifestyleFactors;
    private calculateEmotionalFactors;
    private computeScore;
    private computeCategoryScore;
    private normalizeScore;
    private normalizeAmount;
    private normalizeAge;
    private normalizeSentiment;
    private updateProfileScore;
}
