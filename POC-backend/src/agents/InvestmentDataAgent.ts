import { APIError } from "../utils/errorHandler";
import { FileParser } from "../utils/fileParser";
import { OpenAI } from "openai";
import { config } from "../config/env";
import { getDB } from "../config/database";
import { Db } from "mongodb";

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
    [key: string]: number; // sector/type -> percentage
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

export class InvestmentDataAgent {
  private fileParser: FileParser;
  private openai: OpenAI;
  private db: Db;

  constructor() {
    this.fileParser = new FileParser();
    this.openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
    this.db = getDB();
  }

  async processInvestmentFile(
    customerId: string,
    fileBuffer: Buffer,
    fileType: string
  ): Promise<InvestmentData[]> {
    try {
      const parsedData = await this.fileParser.parse(fileBuffer, fileType);
      const investments = this.transformToInvestmentData(parsedData);

      // Validate and store investments
      await this.validateInvestments(investments);
      await this.storeInvestments(customerId, investments);

      return investments;
    } catch (error) {
      throw new APIError(500, "Failed to process investment file");
    }
  }

  async analyzeInvestments(customerId: string): Promise<InvestmentAnalysis> {
    try {
      const investments = await this.getCustomerInvestments(customerId);

      const analysis: InvestmentAnalysis = {
        totalInvestments: this.calculateTotalInvestments(investments),
        portfolioAllocation: this.calculatePortfolioAllocation(investments),
        riskProfile: await this.analyzeRiskProfile(investments),
        performanceMetrics: this.calculatePerformanceMetrics(investments),
        recommendations: await this.generateRecommendations(investments),
      };

      await this.storeAnalysis(customerId, analysis);
      return analysis;
    } catch (error) {
      throw new APIError(500, "Failed to analyze investments");
    }
  }

  private transformToInvestmentData(rawData: any[]): InvestmentData[] {
    return rawData.map((item) => ({
      type: item.type || "Unknown",
      amount: parseFloat(item.amount) || 0,
      date: new Date(item.date),
      status: item.status || "Active",
      details: {
        instrument: item.instrument,
        sector: item.sector,
        risk: item.risk,
        term: item.term,
        returns: parseFloat(item.returns) || 0,
        fees: parseFloat(item.fees) || 0,
      },
    }));
  }

  private async validateInvestments(
    investments: InvestmentData[]
  ): Promise<void> {
    const errors: string[] = [];

    for (const inv of investments) {
      if (inv.amount <= 0) {
        errors.push(`Invalid amount for investment: ${inv.type}`);
      }
      if (inv.date > new Date()) {
        errors.push(`Future date not allowed: ${inv.date}`);
      }
      // Add more validation rules as needed
    }

    if (errors.length > 0) {
      throw new APIError(
        400,
        `Investment validation failed: ${errors.join(", ")}`
      );
    }
  }

  private async storeInvestments(
    customerId: string,
    investments: InvestmentData[]
  ): Promise<void> {
    const investmentsWithMetadata = investments.map((inv) => ({
      ...inv,
      customerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await this.db.collection("investments").insertMany(investmentsWithMetadata);
  }

  private async getCustomerInvestments(customerId: string) {
    return await this.db
      .collection("investments")
      .find({ customerId })
      .sort({ date: -1 })
      .toArray();
  }

  private calculateTotalInvestments(investments: any[]): number {
    return investments.reduce((sum, inv) => sum + inv.amount, 0);
  }

  private calculatePortfolioAllocation(
    investments: any[]
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

  private async analyzeRiskProfile(investments: any[]): Promise<{
    score: number;
    breakdown: Record<string, number>;
  }> {
    const riskFactors = {
      sectorConcentration: this.calculateSectorConcentration(investments),
      volatility: this.calculateVolatility(investments),
      instrumentRisk: this.calculateInstrumentRisk(investments),
    };

    const riskScore =
      riskFactors.sectorConcentration * 0.4 +
      riskFactors.volatility * 0.3 +
      riskFactors.instrumentRisk * 0.3;

    return {
      score: riskScore,
      breakdown: riskFactors,
    };
  }

  private calculateSectorConcentration(investments: any[]): number {
    const allocation = this.calculatePortfolioAllocation(investments);
    const maxConcentration = Math.max(...Object.values(allocation));
    return maxConcentration > 30 ? 1 : maxConcentration / 30;
  }

  private calculateVolatility(investments: any[]): number {
    // Simplified volatility calculation
    // In a real implementation, this would use standard deviation of returns
    return 0.5;
  }

  private calculateInstrumentRisk(investments: any[]): number {
    const riskScores = {
      "Government Bonds": 0.2,
      "Corporate Bonds": 0.4,
      "Mutual Funds": 0.6,
      Stocks: 0.8,
      Derivatives: 1.0,
    };

    const totalAmount = this.calculateTotalInvestments(investments);
    let weightedRisk = 0;

    investments.forEach((inv) => {
      const instrumentType = inv.details.instrument || "Unknown";
      const riskScore =
        riskScores[instrumentType as keyof typeof riskScores] || 0.5;
      weightedRisk += (inv.amount / totalAmount) * riskScore;
    });

    return weightedRisk;
  }

  private calculatePerformanceMetrics(investments: any[]): {
    totalReturns: number;
    annualizedReturns: number;
    volatility: number;
  } {
    // Simplified performance calculation
    // In a real implementation, this would use more sophisticated methods
    const totalInvested = this.calculateTotalInvestments(investments);
    const totalValue = investments.reduce(
      (sum, inv) => sum + inv.amount * (1 + (inv.details.returns || 0)),
      0
    );

    return {
      totalReturns: ((totalValue - totalInvested) / totalInvested) * 100,
      annualizedReturns: 8.5, // Placeholder
      volatility: 12.3, // Placeholder
    };
  }

  private async generateRecommendations(
    investments: any[]
  ): Promise<
    Array<{ type: string; reason: string; priority: "high" | "medium" | "low" }>
  > {
    const analysis = {
      allocation: this.calculatePortfolioAllocation(investments),
      risk: await this.analyzeRiskProfile(investments),
      performance: this.calculatePerformanceMetrics(investments),
    };

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a financial advisor. Generate investment recommendations based on the portfolio analysis.",
        },
        {
          role: "user",
          content: JSON.stringify(analysis),
        },
      ],
      temperature: 0.3,
    });

    return this.parseRecommendations(response.choices[0].message.content || "");
  }

  private parseRecommendations(content: string): Array<{
    type: string;
    reason: string;
    priority: "high" | "medium" | "low";
  }> {
    // In a real implementation, this would parse the OpenAI response
    // into structured recommendations. This is a simplified version.
    return [
      {
        type: "Diversification",
        reason: "High concentration in technology sector",
        priority: "high",
      },
      {
        type: "Risk Management",
        reason: "Consider adding more defensive assets",
        priority: "medium",
      },
    ];
  }

  private async storeAnalysis(
    customerId: string,
    analysis: InvestmentAnalysis
  ): Promise<void> {
    await this.db.collection("customerProfiles").updateOne(
      { customerId },
      {
        $set: {
          "financialProfile.investmentAnalysis": analysis,
          updatedAt: new Date(),
        },
      }
    );
  }
}
