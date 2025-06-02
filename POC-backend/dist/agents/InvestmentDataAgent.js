"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentDataAgent = void 0;
const errorHandler_1 = require("../utils/errorHandler");
const fileParser_1 = require("../utils/fileParser");
const openai_1 = require("openai");
const env_1 = require("../config/env");
const database_1 = require("../config/database");
class InvestmentDataAgent {
    constructor() {
        this.fileParser = new fileParser_1.FileParser();
        this.openai = new openai_1.OpenAI({
            apiKey: env_1.config.OPENAI_API_KEY,
        });
        this.db = (0, database_1.getDB)();
    }
    async processInvestmentFile(customerId, fileBuffer, fileType) {
        try {
            const parsedData = await this.fileParser.parse(fileBuffer, fileType);
            const investments = this.transformToInvestmentData(parsedData);
            // Validate and store investments
            await this.validateInvestments(investments);
            await this.storeInvestments(customerId, investments);
            return investments;
        }
        catch (error) {
            throw new errorHandler_1.APIError(500, "Failed to process investment file");
        }
    }
    async analyzeInvestments(customerId) {
        try {
            const investments = await this.getCustomerInvestments(customerId);
            const analysis = {
                totalInvestments: this.calculateTotalInvestments(investments),
                portfolioAllocation: this.calculatePortfolioAllocation(investments),
                riskProfile: await this.analyzeRiskProfile(investments),
                performanceMetrics: this.calculatePerformanceMetrics(investments),
                recommendations: await this.generateRecommendations(investments),
            };
            await this.storeAnalysis(customerId, analysis);
            return analysis;
        }
        catch (error) {
            throw new errorHandler_1.APIError(500, "Failed to analyze investments");
        }
    }
    transformToInvestmentData(rawData) {
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
    async validateInvestments(investments) {
        const errors = [];
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
            throw new errorHandler_1.APIError(400, `Investment validation failed: ${errors.join(", ")}`);
        }
    }
    async storeInvestments(customerId, investments) {
        const investmentsWithMetadata = investments.map((inv) => ({
            ...inv,
            customerId,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
        await this.db.collection("investments").insertMany(investmentsWithMetadata);
    }
    async getCustomerInvestments(customerId) {
        return await this.db
            .collection("investments")
            .find({ customerId })
            .sort({ date: -1 })
            .toArray();
    }
    calculateTotalInvestments(investments) {
        return investments.reduce((sum, inv) => sum + inv.amount, 0);
    }
    calculatePortfolioAllocation(investments) {
        const total = this.calculateTotalInvestments(investments);
        const allocation = {};
        investments.forEach((inv) => {
            const sector = inv.details.sector || "Unclassified";
            allocation[sector] =
                (allocation[sector] || 0) + (inv.amount / total) * 100;
        });
        return allocation;
    }
    async analyzeRiskProfile(investments) {
        const riskFactors = {
            sectorConcentration: this.calculateSectorConcentration(investments),
            volatility: this.calculateVolatility(investments),
            instrumentRisk: this.calculateInstrumentRisk(investments),
        };
        const riskScore = riskFactors.sectorConcentration * 0.4 +
            riskFactors.volatility * 0.3 +
            riskFactors.instrumentRisk * 0.3;
        return {
            score: riskScore,
            breakdown: riskFactors,
        };
    }
    calculateSectorConcentration(investments) {
        const allocation = this.calculatePortfolioAllocation(investments);
        const maxConcentration = Math.max(...Object.values(allocation));
        return maxConcentration > 30 ? 1 : maxConcentration / 30;
    }
    calculateVolatility(investments) {
        // Simplified volatility calculation
        // In a real implementation, this would use standard deviation of returns
        return 0.5;
    }
    calculateInstrumentRisk(investments) {
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
            const riskScore = riskScores[instrumentType] || 0.5;
            weightedRisk += (inv.amount / totalAmount) * riskScore;
        });
        return weightedRisk;
    }
    calculatePerformanceMetrics(investments) {
        // Simplified performance calculation
        // In a real implementation, this would use more sophisticated methods
        const totalInvested = this.calculateTotalInvestments(investments);
        const totalValue = investments.reduce((sum, inv) => sum + inv.amount * (1 + (inv.details.returns || 0)), 0);
        return {
            totalReturns: ((totalValue - totalInvested) / totalInvested) * 100,
            annualizedReturns: 8.5, // Placeholder
            volatility: 12.3, // Placeholder
        };
    }
    async generateRecommendations(investments) {
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
                    content: "You are a financial advisor. Generate investment recommendations based on the portfolio analysis.",
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
    parseRecommendations(content) {
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
    async storeAnalysis(customerId, analysis) {
        await this.db.collection("customerProfiles").updateOne({ customerId }, {
            $set: {
                "financialProfile.investmentAnalysis": analysis,
                updatedAt: new Date(),
            },
        });
    }
}
exports.InvestmentDataAgent = InvestmentDataAgent;
//# sourceMappingURL=InvestmentDataAgent.js.map