interface InvestmentData {
    type: string;
    amount: number;
    date: Date;
    status: string;
    details: {
        instrument?: string;
        sector?: string;
        risk?: string;
        term?: string;
        returns?: number;
        fees?: number;
    };
}
interface InvestmentAnalysis {
    totalInvestments: number;
    portfolioAllocation: {
        [key: string]: number;
    };
    riskProfile: {
        score: number;
        breakdown: {
            [key: string]: number;
        };
    };
    performanceMetrics: {
        totalReturns: number;
        annualizedReturns: number;
        volatility: number;
    };
    recommendations: Array<{
        type: string;
        reason: string;
        priority: "high" | "medium" | "low";
    }>;
}
export declare class InvestmentDataAgent {
    private fileParser;
    private openai;
    private db;
    constructor();
    processInvestmentFile(customerId: string, fileBuffer: Buffer, fileType: string): Promise<InvestmentData[]>;
    analyzeInvestments(customerId: string): Promise<InvestmentAnalysis>;
    private transformToInvestmentData;
    private validateInvestments;
    private storeInvestments;
    private getCustomerInvestments;
    private calculateTotalInvestments;
    private calculatePortfolioAllocation;
    private analyzeRiskProfile;
    private calculateSectorConcentration;
    private calculateVolatility;
    private calculateInstrumentRisk;
    private calculatePerformanceMetrics;
    private generateRecommendations;
    private parseRecommendations;
    private storeAnalysis;
}
export {};
