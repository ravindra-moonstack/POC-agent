export interface MeetingBriefing {
  customerProfile: {
    name: string;
    age: number;
    occupation: string;
    riskProfile: string;
  };
  portfolioSummary: {
    totalInvestments: number;
    performance: {
      totalReturns: number;
      annualizedReturns: number;
    };
    allocation: Record<string, number>;
  };
  recentActivity: {
    lastMeetingDate?: Date;
    lastMeetingSummary?: string;
    recentTransactions: Array<{
      date: Date;
      type: string;
      amount: number;
    }>;
  };
  actionItems: Array<{
    type: string;
    description: string;
    priority: "high" | "medium" | "low";
    dueDate?: Date;
  }>;
}

export interface MeetingReport {
  meetingId: string;
  date: Date;
  summary: string;
  keyPoints: string[];
  nextSteps: Array<{
    action: string;
    assignee: string;
    dueDate?: Date;
  }>;
  attachments?: string[];
}
