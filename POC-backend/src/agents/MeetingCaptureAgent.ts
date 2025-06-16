import { OpenAI } from "openai";
import { config } from "../config/env";
import { APIError } from "../utils/errorHandler";
import { AudioTranscriber } from "../utils/audioTranscriber";
import { getDB } from "../config/database";
import { Db } from "mongodb";

interface MeetingAnalysis {
  summary: string;
  sentiment: number;
  nextSteps: {
    actions: string[];
    followUpDate?: Date;
    priority: "high" | "medium" | "low";
  };
  keyTopics: string[];
  riskFactors?: string[];
}

interface TranscriptionResult {
  text: string;
  confidence: number;
  speakerLabels?: string[];
}

interface MeetingRecord {
  customerId: string;
  summary: string;
  notes: string;
  audioUrl?: string;
  sentiment: number;
  nextSteps: {
    actions: string[];
    followUpDate?: Date;
    priority: "high" | "medium" | "low";
  };
  createdAt: Date;
  updatedAt: Date;
}

export class MeetingCaptureAgent {
  private openai: OpenAI;
  private transcriber: AudioTranscriber;
  private db: Db;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
    this.transcriber = new AudioTranscriber();
    this.db = getDB();
  }

  async processAudioMeeting(
    customerId: string,
    audioFileUrl: string
  ): Promise<MeetingAnalysis> {
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
    } catch (error) {
      throw new APIError(500, "Failed to process meeting recording");
    }
  }

  async processTextMeeting(
    customerId: string,
    notes: string
  ): Promise<MeetingAnalysis> {
    try {
      const analysis = await this.analyzeMeeting(notes);

      await this.saveMeetingRecord(customerId, {
        summary: analysis.summary,
        notes,
        sentiment: analysis.sentiment,
        nextSteps: analysis.nextSteps,
      });

      return analysis;
    } catch (error) {
      throw new APIError(500, "Failed to process meeting notes");
    }
  }

  private async analyzeMeeting(text: string): Promise<MeetingAnalysis> {
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
    } catch (error) {
      throw new APIError(500, "Failed to analyze meeting content");
    }
  }

  private parseAnalysis(analysisText: string): MeetingAnalysis {
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

  private async saveMeetingRecord(
    customerId: string,
    meetingData: {
      summary: string;
      notes: string;
      audioUrl?: string;
      sentiment: number;
      nextSteps: any;
    }
  ): Promise<void> {
    const meeting: MeetingRecord = {
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
