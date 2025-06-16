"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingReportAgent = void 0;
const pdf_lib_1 = require("pdf-lib");
const database_1 = require("../config/database");
const errorHandler_1 = require("../utils/errorHandler");
const openai_1 = require("openai");
const env_1 = require("../config/env");
const mongodb_1 = require("mongodb");
class MeetingReportAgent {
    constructor() {
        this.openai = new openai_1.OpenAI({
            apiKey: env_1.config.OPENAI_API_KEY,
        });
        this.db = (0, database_1.getDB)();
    }
    async generateBriefing(customerId) {
        try {
            const briefingData = await this.collectBriefingData(customerId);
            const pdfBuffer = await this.createBriefingPDF(briefingData);
            await this.storeBriefing(customerId, pdfBuffer);
            return pdfBuffer;
        }
        catch (error) {
            throw new errorHandler_1.APIError(500, "Failed to generate meeting briefing");
        }
    }
    async generateMeetingReport(meetingId, customerId) {
        try {
            const reportData = await this.collectReportData(meetingId);
            const pdfBuffer = await this.createReportPDF(reportData);
            await this.storeReport(meetingId, customerId, pdfBuffer);
            return pdfBuffer;
        }
        catch (error) {
            throw new errorHandler_1.APIError(500, "Failed to generate meeting report");
        }
    }
    async collectBriefingData(customerId) {
        const [profile, investments, meetings] = await Promise.all([
            this.db.collection("customerProfiles").findOne({ customerId }),
            this.db
                .collection("investments")
                .find({ customerId })
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
            throw new errorHandler_1.APIError(404, "Customer profile not found");
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
    async collectReportData(meetingId) {
        const meeting = await this.db.collection("meetings").findOne({
            _id: new mongodb_1.ObjectId(meetingId),
        });
        if (!meeting) {
            throw new errorHandler_1.APIError(404, "Meeting not found");
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
    async createBriefingPDF(data) {
        const pdfDoc = await pdf_lib_1.PDFDocument.create();
        const page = pdfDoc.addPage();
        const { height } = page.getSize();
        // Add content to PDF using page.drawText()
        // Example:
        // page.drawText(data.customerProfile.name, { x: 50, y: height - 50 });
        return Buffer.from(await pdfDoc.save());
    }
    async createReportPDF(data) {
        const pdfDoc = await pdf_lib_1.PDFDocument.create();
        const page = pdfDoc.addPage();
        const { height } = page.getSize();
        // Add content to PDF using page.drawText()
        // Example:
        // page.drawText(data.summary, { x: 50, y: height - 50 });
        return Buffer.from(await pdfDoc.save());
    }
    calculateTotalInvestments(investments) {
        return investments.reduce((sum, inv) => sum + inv.amount, 0);
    }
    calculateTotalReturns(investments) {
        const totalInvested = this.calculateTotalInvestments(investments);
        const totalValue = investments.reduce((sum, inv) => sum + inv.amount * (1 + (inv.details.returns || 0)), 0);
        return ((totalValue - totalInvested) / totalInvested) * 100;
    }
    calculateAnnualizedReturns(investments) {
        if (!investments.length)
            return 0;
        // Calculate annualized returns
        const returns = investments.reduce((total, inv) => total + (inv.details.returns || 0), 0);
        return returns / investments.length;
    }
    calculateAllocation(investments) {
        const total = this.calculateTotalInvestments(investments);
        const allocation = {};
        investments.forEach((inv) => {
            const sector = inv.details.sector || "Unclassified";
            allocation[sector] =
                (allocation[sector] || 0) + (inv.amount / total) * 100;
        });
        return allocation;
    }
    async generateActionItems(profile, investments) {
        const response = await this.openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "Generate action items based on the customer profile and investments.",
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
    async extractKeyPoints(notes) {
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
    parseNextSteps(nextSteps) {
        // In a real implementation, this would parse the structured next steps
        // This is a simplified version
        return nextSteps.actions.map((action) => ({
            action,
            assignee: "RM",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        }));
    }
    parseActionItems(content) {
        // Parse action items from content
        // This is a placeholder implementation
        return [];
    }
    parseKeyPoints(content) {
        // In a real implementation, this would parse the OpenAI response
        // This is a simplified version
        return content.split("\n").filter((line) => line.trim());
    }
    async storeBriefing(customerId, pdfBuffer) {
        // In a real implementation, this would store the PDF in a file storage service
        // and save the reference in the database
        console.log(`Storing briefing for customer ${customerId}`);
    }
    async storeReport(meetingId, customerId, pdfBuffer) {
        // In a real implementation, this would store the PDF in a file storage service
        // and save the reference in the database
        console.log(`Storing report for meeting ${meetingId}`);
    }
}
exports.MeetingReportAgent = MeetingReportAgent;
//# sourceMappingURL=MeetingReportAgent.js.map