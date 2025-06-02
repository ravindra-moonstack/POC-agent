export declare class MeetingReportAgent {
    private openai;
    private db;
    constructor();
    generateBriefing(customerId: string): Promise<Buffer>;
    generateMeetingReport(meetingId: string, customerId: string): Promise<Buffer>;
    private collectBriefingData;
    private collectReportData;
    private createBriefingPDF;
    private createReportPDF;
    private calculateTotalInvestments;
    private calculateTotalReturns;
    private calculateAnnualizedReturns;
    private calculateAllocation;
    private generateActionItems;
    private extractKeyPoints;
    private parseNextSteps;
    private parseActionItems;
    private parseKeyPoints;
    private storeBriefing;
    private storeReport;
}
