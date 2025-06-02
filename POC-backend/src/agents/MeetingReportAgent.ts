import { PDFDocument } from "pdf-lib";
import { getDB } from "../config/database";
import { APIError } from "../utils/errorHandler";
import { OpenAI } from "openai";
import { config } from "../config/env";
import { Db, ObjectId } from "mongodb";
import { Investment } from "../types/investment";
import { MeetingBriefing, MeetingReport } from "../types/meeting";

export class MeetingReportAgent {
  private openai: OpenAI;
  private db: Db;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
    this.db = getDB();
  }

  async generateBriefing(customerId: string): Promise<Buffer> {
    try {
      const briefingData = await this.collectBriefingData(customerId);
      const pdfBuffer = await this.createBriefingPDF(briefingData);
      await this.storeBriefing(customerId, pdfBuffer);
      return pdfBuffer;
    } catch (error) {
      throw new APIError(500, "Failed to generate meeting briefing");
    }
  }

  async generateMeetingReport(
    meetingId: string,
    customerId: string
  ): Promise<Buffer> {
    try {
      const reportData = await this.collectReportData(meetingId);
      const pdfBuffer = await this.createReportPDF(reportData);
      await this.storeReport(meetingId, customerId, pdfBuffer);
      return pdfBuffer;
    } catch (error) {
      throw new APIError(500, "Failed to generate meeting report");
    }
  }

  private async collectBriefingData(
    customerId: string
  ): Promise<MeetingBriefing> {
    const [profile, investments, meetings] = await Promise.all([
      this.db.collection("customerProfiles").findOne({ customerId }),
      this.db
        .collection("investments")
        .find<Investment>({ customerId })
        .sort({ date: -1 })
        .limit(5)
        .toArray(),
      this.db
        .collection("meetings")
        .find({ customerId })
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray(),
    ]);

    if (!profile) {
      throw new APIError(404, "Customer profile not found");
    }

    return {
      customerProfile: {
        name: profile.basicInfo.name,
        age: profile.basicInfo.age,
        occupation: profile.basicInfo.occupation,
        riskProfile: profile.financialProfile.riskProfile,
      },
      portfolioSummary: {
        totalInvestments: this.calculateTotalInvestments(investments),
        performance: {
          totalReturns: this.calculateTotalReturns(investments),
          annualizedReturns: this.calculateAnnualizedReturns(investments),
        },
        allocation: this.calculateAllocation(investments),
      },
      recentActivity: {
        lastMeetingDate: meetings[0]?.createdAt,
        lastMeetingSummary: meetings[0]?.summary,
        recentTransactions: investments.map((inv) => ({
          date: inv.date,
          type: inv.type,
          amount: inv.amount,
        })),
      },
      actionItems: await this.generateActionItems(profile, investments),
    };
  }

  private async collectReportData(meetingId: string): Promise<MeetingReport> {
    const meeting = await this.db.collection("meetings").findOne({
      _id: new ObjectId(meetingId),
    });

    if (!meeting) {
      throw new APIError(404, "Meeting not found");
    }

    const keyPoints = await this.extractKeyPoints(meeting.notes);

    return {
      meetingId,
      date: meeting.createdAt,
      summary: meeting.summary,
      keyPoints,
      nextSteps: this.parseNextSteps(meeting.nextSteps),
      attachments: meeting.audioUrl ? [meeting.audioUrl] : undefined,
    };
  }

  private async createBriefingPDF(data: MeetingBriefing): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { height } = page.getSize();

    // Add content to PDF using page.drawText()
    // Example:
    // page.drawText(data.customerProfile.name, { x: 50, y: height - 50 });

    return Buffer.from(await pdfDoc.save());
  }

  private async createReportPDF(data: MeetingReport): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { height } = page.getSize();

    // Add content to PDF using page.drawText()
    // Example:
    // page.drawText(data.summary, { x: 50, y: height - 50 });

    return Buffer.from(await pdfDoc.save());
  }

  private calculateTotalInvestments(investments: Investment[]): number {
    return investments.reduce((sum, inv) => sum + inv.amount, 0);
  }

  private calculateTotalReturns(investments: Investment[]): number {
    const totalInvested = this.calculateTotalInvestments(investments);
    const totalValue = investments.reduce(
      (sum, inv) => sum + inv.amount * (1 + (inv.details.returns || 0)),
      0
    );
    return ((totalValue - totalInvested) / totalInvested) * 100;
  }

  private calculateAnnualizedReturns(investments: Investment[]): number {
    if (!investments.length) return 0;

    // Calculate annualized returns
    const returns = investments.reduce(
      (total, inv) => total + (inv.details.returns || 0),
      0
    );
    return returns / investments.length;
  }

  private calculateAllocation(
    investments: Investment[]
  ): Record<string, number> {
    const total = this.calculateTotalInvestments(investments);
    const allocation: Record<string, number> = {};

    investments.forEach((inv) => {
      const sector = inv.details.sector || "Unclassified";
      allocation[sector] =
        (allocation[sector] || 0) + (inv.amount / total) * 100;
    });

    return allocation;
  }

  private async generateActionItems(
    profile: any,
    investments: Investment[]
  ): Promise<
    Array<{
      type: string;
      description: string;
      priority: "high" | "medium" | "low";
      dueDate?: Date;
    }>
  > {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "Generate action items based on the customer profile and investments.",
        },
        {
          role: "user",
          content: JSON.stringify({ profile, investments }),
        },
      ],
      temperature: 0.3,
    });

    return this.parseActionItems(response.choices[0].message.content || "");
  }

  private async extractKeyPoints(notes: string): Promise<string[]> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Extract key points from the meeting notes.",
        },
        {
          role: "user",
          content: notes,
        },
      ],
      temperature: 0.3,
    });

    return this.parseKeyPoints(response.choices[0].message.content || "");
  }

  private parseNextSteps(nextSteps: any): Array<{
    action: string;
    assignee: string;
    dueDate?: Date;
  }> {
    // In a real implementation, this would parse the structured next steps
    // This is a simplified version
    return nextSteps.actions.map((action: string) => ({
      action,
      assignee: "RM",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    }));
  }

  private parseActionItems(content: string): Array<{
    type: string;
    description: string;
    priority: "high" | "medium" | "low";
    dueDate?: Date;
  }> {
    // Parse action items from content
    // This is a placeholder implementation
    return [];
  }

  private parseKeyPoints(content: string): string[] {
    // In a real implementation, this would parse the OpenAI response
    // This is a simplified version
    return content.split("\n").filter((line) => line.trim());
  }

  private async storeBriefing(
    customerId: string,
    pdfBuffer: Buffer
  ): Promise<void> {
    // In a real implementation, this would store the PDF in a file storage service
    // and save the reference in the database
    console.log(`Storing briefing for customer ${customerId}`);
  }

  private async storeReport(
    meetingId: string,
    customerId: string,
    pdfBuffer: Buffer
  ): Promise<void> {
    // In a real implementation, this would store the PDF in a file storage service
    // and save the reference in the database
    console.log(`Storing report for meeting ${meetingId}`);
  }
}
