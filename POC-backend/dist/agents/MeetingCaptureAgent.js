"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingCaptureAgent = void 0;
const openai_1 = require("openai");
const env_1 = require("../config/env");
const errorHandler_1 = require("../utils/errorHandler");
const audioTranscriber_1 = require("../utils/audioTranscriber");
const database_1 = require("../config/database");
class MeetingCaptureAgent {
    constructor() {
        this.openai = new openai_1.OpenAI({
            apiKey: env_1.config.OPENAI_API_KEY,
        });
        this.transcriber = new audioTranscriber_1.AudioTranscriber();
        this.db = (0, database_1.getDB)();
    }
    async processAudioMeeting(customerId, audioFileUrl) {
        try {
            // Transcribe audio
            const transcription = await this.transcriber.transcribe(audioFileUrl);
            // Analyze transcription
            const analysis = await this.analyzeMeeting(transcription.text);
            // Save meeting record
            await this.saveMeetingRecord(customerId, {
                summary: analysis.summary,
                notes: transcription.text,
                audioUrl: audioFileUrl,
                sentiment: analysis.sentiment,
                nextSteps: analysis.nextSteps,
            });
            return analysis;
        }
        catch (error) {
            throw new errorHandler_1.APIError(500, "Failed to process meeting recording");
        }
    }
    async processTextMeeting(customerId, notes) {
        try {
            const analysis = await this.analyzeMeeting(notes);
            await this.saveMeetingRecord(customerId, {
                summary: analysis.summary,
                notes,
                sentiment: analysis.sentiment,
                nextSteps: analysis.nextSteps,
            });
            return analysis;
        }
        catch (error) {
            throw new errorHandler_1.APIError(500, "Failed to process meeting notes");
        }
    }
    async analyzeMeeting(text) {
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: `You are a financial advisor's assistant. Analyze the following meeting notes and provide:
              1. A concise summary
              2. Sentiment score (-1 to 1)
              3. Key topics discussed
              4. Next steps and actions
              5. Any risk factors identified`,
                    },
                    {
                        role: "user",
                        content: text,
                    },
                ],
                temperature: 0.3,
            });
            const analysis = response.choices[0].message.content;
            return this.parseAnalysis(analysis || "");
        }
        catch (error) {
            throw new errorHandler_1.APIError(500, "Failed to analyze meeting content");
        }
    }
    parseAnalysis(analysisText) {
        // In a real implementation, this would parse the OpenAI response
        // into a structured format. This is a simplified version.
        return {
            summary: "Meeting summary placeholder",
            sentiment: 0.5,
            nextSteps: {
                actions: ["Follow up on investment strategy"],
                priority: "medium",
            },
            keyTopics: ["Investment", "Risk Assessment"],
        };
    }
    async saveMeetingRecord(customerId, meetingData) {
        const meeting = {
            customerId,
            summary: meetingData.summary,
            notes: meetingData.notes,
            audioUrl: meetingData.audioUrl,
            sentiment: meetingData.sentiment,
            nextSteps: meetingData.nextSteps,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await this.db.collection("meetings").insertOne(meeting);
    }
}
exports.MeetingCaptureAgent = MeetingCaptureAgent;
//# sourceMappingURL=MeetingCaptureAgent.js.map