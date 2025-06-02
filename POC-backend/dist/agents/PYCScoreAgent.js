"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PYCScoreAgent = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../utils/errorHandler");
class PYCScoreAgent {
    constructor() {
        this.weights = {
            financial: 0.3,
            personal: 0.2,
            investment: 0.2,
            lifestyle: 0.15,
            emotional: 0.15,
        };
        this.db = (0, database_1.getDB)();
    }
    async calculateScore(customerId) {
        try {
            const profile = await this.getCustomerProfile(customerId);
            const meetings = await this.getCustomerMeetings(customerId);
            const investments = await this.getCustomerInvestments(customerId);
            const scoreFactors = await this.aggregateFactors(profile, meetings, investments);
            const score = this.computeScore(scoreFactors);
            await this.updateProfileScore(customerId, score);
            return score;
        }
        catch (error) {
            throw new errorHandler_1.APIError(500, "Failed to calculate PYC score");
        }
    }
    async getCustomerProfile(customerId) {
        return await this.db.collection("customerProfiles").findOne({ customerId });
    }
    async getCustomerMeetings(customerId) {
        return await this.db
            .collection("meetings")
            .find({ customerId })
            .sort({ createdAt: -1 })
            .limit(5) // Consider last 5 meetings
            .toArray();
    }
    async getCustomerInvestments(customerId) {
        return await this.db
            .collection("investments")
            .find({ customerId })
            .toArray();
    }
    async aggregateFactors(profile, meetings, investments) {
        return {
            financial: this.calculateFinancialFactors(profile),
            personal: this.calculatePersonalFactors(profile),
            investment: this.calculateInvestmentFactors(investments),
            lifestyle: this.calculateLifestyleFactors(profile),
            emotional: this.calculateEmotionalFactors(meetings),
        };
    }
    calculateFinancialFactors(profile) {
        return {
            creditScore: this.normalizeScore(profile.financialProfile.creditScore, 300, 900),
            netWorth: this.normalizeAmount(profile.financialProfile.netWorth),
            incomeStability: 0.8, // Placeholder
            debtToIncome: 0.7, // Placeholder
        };
    }
    calculatePersonalFactors(profile) {
        return {
            age: this.normalizeAge(profile.basicInfo.age),
            education: 0.8, // Placeholder
            occupation: 0.7, // Placeholder
            familySize: 0.6, // Placeholder
        };
    }
    calculateInvestmentFactors(investments) {
        return {
            portfolioSize: this.normalizeAmount(investments.reduce((sum, inv) => sum + inv.amount, 0)),
            riskTolerance: 0.7, // Placeholder
            investmentKnowledge: 0.6, // Placeholder
            pastPerformance: 0.8, // Placeholder
        };
    }
    calculateLifestyleFactors(profile) {
        return {
            location: 0.7, // Placeholder
            interests: 0.8, // Placeholder
            travelFrequency: 0.6, // Placeholder
            luxuryPreference: 0.7, // Placeholder
        };
    }
    calculateEmotionalFactors(meetings) {
        const avgSentiment = meetings.reduce((sum, m) => sum + (m.sentiment || 0), 0) /
            meetings.length;
        return {
            meetingSentiment: this.normalizeSentiment(avgSentiment),
            communicationStyle: 0.8, // Placeholder
            decisionMaking: 0.7, // Placeholder
            trustLevel: 0.9, // Placeholder
        };
    }
    computeScore(factors) {
        const financialScore = this.computeCategoryScore(factors.financial);
        const personalScore = this.computeCategoryScore(factors.personal);
        const investmentScore = this.computeCategoryScore(factors.investment);
        const lifestyleScore = this.computeCategoryScore(factors.lifestyle);
        const emotionalScore = this.computeCategoryScore(factors.emotional);
        const weightedScore = financialScore * this.weights.financial +
            personalScore * this.weights.personal +
            investmentScore * this.weights.investment +
            lifestyleScore * this.weights.lifestyle +
            emotionalScore * this.weights.emotional;
        // Convert to 0-100 scale
        return Math.round(weightedScore * 100);
    }
    computeCategoryScore(factors) {
        const validFactors = Object.values(factors).filter((value) => typeof value === "number");
        if (validFactors.length === 0)
            return 0;
        return (validFactors.reduce((sum, value) => sum + value, 0) / validFactors.length);
    }
    normalizeScore(value, min, max) {
        return (value - min) / (max - min);
    }
    normalizeAmount(amount) {
        // Normalize based on logarithmic scale
        const log = Math.log10(amount + 1);
        const maxLog = Math.log10(1000000000); // 1 billion
        return log / maxLog;
    }
    normalizeAge(age) {
        // Peak score at age 45-55
        if (age >= 45 && age <= 55)
            return 1;
        if (age < 45)
            return age / 45;
        return Math.max(0, 1 - (age - 55) / 30);
    }
    normalizeSentiment(sentiment) {
        // Convert -1 to 1 scale to 0 to 1
        return (sentiment + 1) / 2;
    }
    async updateProfileScore(customerId, score) {
        await this.db
            .collection("customerProfiles")
            .updateOne({ customerId }, { $set: { pycScore: score } });
    }
}
exports.PYCScoreAgent = PYCScoreAgent;
//# sourceMappingURL=PYCScoreAgent.js.map