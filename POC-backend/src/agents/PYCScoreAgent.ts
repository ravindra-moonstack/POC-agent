import { getDB } from "../config/database";
import { APIError } from "../utils/errorHandler";
import { Db } from "mongodb";

interface ScoreWeights {
  financial: number;
  personal: number;
  investment: number;
  lifestyle: number;
  emotional: number;
}

interface ScoreFactors {
  financial: {
    creditScore?: number;
    netWorth?: number;
    incomeStability?: number;
    debtToIncome?: number;
  };
  personal: {
    age?: number;
    education?: number;
    occupation?: number;
    familySize?: number;
  };
  investment: {
    portfolioSize?: number;
    riskTolerance?: number;
    investmentKnowledge?: number;
    pastPerformance?: number;
  };
  lifestyle: {
    location?: number;
    interests?: number;
    travelFrequency?: number;
    luxuryPreference?: number;
  };
  emotional: {
    meetingSentiment?: number;
    communicationStyle?: number;
    decisionMaking?: number;
    trustLevel?: number;
  };
}

export class PYCScoreAgent {
  private readonly weights: ScoreWeights = {
    financial: 0.3,
    personal: 0.2,
    investment: 0.2,
    lifestyle: 0.15,
    emotional: 0.15,
  };

  private db: Db;

  constructor() {
    this.db = getDB();
  }

  async calculateScore(customerId: string): Promise<number> {
    try {
      const profile = await this.getCustomerProfile(customerId);
      const meetings = await this.getCustomerMeetings(customerId);
      const investments = await this.getCustomerInvestments(customerId);

      const scoreFactors = await this.aggregateFactors(
        profile,
        meetings,
        investments
      );

      const score = this.computeScore(scoreFactors);
      await this.updateProfileScore(customerId, score);

      return score;
    } catch (error) {
      throw new APIError(500, "Failed to calculate PYC score");
    }
  }

  private async getCustomerProfile(customerId: string) {
    return await this.db.collection("customerProfiles").findOne({ customerId });
  }

  private async getCustomerMeetings(customerId: string) {
    return await this.db
      .collection("meetings")
      .find({ customerId })
      .sort({ createdAt: -1 })
      .limit(5) // Consider last 5 meetings
      .toArray();
  }

  private async getCustomerInvestments(customerId: string) {
    return await this.db
      .collection("investments")
      .find({ customerId })
      .toArray();
  }

  private async aggregateFactors(
    profile: any,
    meetings: any[],
    investments: any[]
  ): Promise<ScoreFactors> {
    return {
      financial: this.calculateFinancialFactors(profile),
      personal: this.calculatePersonalFactors(profile),
      investment: this.calculateInvestmentFactors(investments),
      lifestyle: this.calculateLifestyleFactors(profile),
      emotional: this.calculateEmotionalFactors(meetings),
    };
  }

  private calculateFinancialFactors(profile: any) {
    return {
      creditScore: this.normalizeScore(
        profile.financialProfile.creditScore,
        300,
        900
      ),
      netWorth: this.normalizeAmount(profile.financialProfile.netWorth),
      incomeStability: 0.8, // Placeholder
      debtToIncome: 0.7, // Placeholder
    };
  }

  private calculatePersonalFactors(profile: any) {
    return {
      age: this.normalizeAge(profile.basicInfo.age),
      education: 0.8, // Placeholder
      occupation: 0.7, // Placeholder
      familySize: 0.6, // Placeholder
    };
  }

  private calculateInvestmentFactors(investments: any[]) {
    return {
      portfolioSize: this.normalizeAmount(
        investments.reduce((sum, inv) => sum + inv.amount, 0)
      ),
      riskTolerance: 0.7, // Placeholder
      investmentKnowledge: 0.6, // Placeholder
      pastPerformance: 0.8, // Placeholder
    };
  }

  private calculateLifestyleFactors(profile: any) {
    return {
      location: 0.7, // Placeholder
      interests: 0.8, // Placeholder
      travelFrequency: 0.6, // Placeholder
      luxuryPreference: 0.7, // Placeholder
    };
  }

  private calculateEmotionalFactors(meetings: any[]) {
    const avgSentiment =
      meetings.reduce((sum, m) => sum + (m.sentiment || 0), 0) /
      meetings.length;

    return {
      meetingSentiment: this.normalizeSentiment(avgSentiment),
      communicationStyle: 0.8, // Placeholder
      decisionMaking: 0.7, // Placeholder
      trustLevel: 0.9, // Placeholder
    };
  }

  private computeScore(factors: ScoreFactors): number {
    const financialScore = this.computeCategoryScore(factors.financial);
    const personalScore = this.computeCategoryScore(factors.personal);
    const investmentScore = this.computeCategoryScore(factors.investment);
    const lifestyleScore = this.computeCategoryScore(factors.lifestyle);
    const emotionalScore = this.computeCategoryScore(factors.emotional);

    const weightedScore =
      financialScore * this.weights.financial +
      personalScore * this.weights.personal +
      investmentScore * this.weights.investment +
      lifestyleScore * this.weights.lifestyle +
      emotionalScore * this.weights.emotional;

    // Convert to 0-100 scale
    return Math.round(weightedScore * 100);
  }

  private computeCategoryScore(
    factors: Record<string, number | undefined>
  ): number {
    const validFactors = Object.values(factors).filter(
      (value): value is number => typeof value === "number"
    );

    if (validFactors.length === 0) return 0;

    return (
      validFactors.reduce((sum, value) => sum + value, 0) / validFactors.length
    );
  }

  private normalizeScore(value: number, min: number, max: number): number {
    return (value - min) / (max - min);
  }

  private normalizeAmount(amount: number): number {
    // Normalize based on logarithmic scale
    const log = Math.log10(amount + 1);
    const maxLog = Math.log10(1000000000); // 1 billion
    return log / maxLog;
  }

  private normalizeAge(age: number): number {
    // Peak score at age 45-55
    if (age >= 45 && age <= 55) return 1;
    if (age < 45) return age / 45;
    return Math.max(0, 1 - (age - 55) / 30);
  }

  private normalizeSentiment(sentiment: number): number {
    // Convert -1 to 1 scale to 0 to 1
    return (sentiment + 1) / 2;
  }

  private async updateProfileScore(
    customerId: string,
    score: number
  ): Promise<void> {
    await this.db
      .collection("customerProfiles")
      .updateOne({ customerId }, { $set: { pycScore: score } });
  }
}
