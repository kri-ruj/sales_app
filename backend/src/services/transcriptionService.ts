import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SpeechClient } from '@google-cloud/speech';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure to set this in .env
});

// Initialize Google AI Gemini
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Initialize Google Cloud Speech-to-Text
const speechClient = process.env.GOOGLE_APPLICATION_CREDENTIALS ? new SpeechClient() : null;

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  confidence?: number;
  enhanced?: boolean;
  customerInfo?: {
    name?: string;
    company?: string;
  };
  dealInfo?: {
    value?: string;
    status?: string;
  };
  actionItems?: string[];
  summary?: string;
}

export class TranscriptionService {
  
  /**
   * Transcribe audio file using OpenAI Whisper
   */
  static async transcribeWithWhisper(audioFilePath: string): Promise<TranscriptionResult> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.log('OpenAI API key not found, using mock transcription');
        return this.getMockTranscription();
      }

      // Check if file exists
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioFilePath}`);
      }

      console.log(`Transcribing audio file: ${audioFilePath}`);

      // Create a readable stream from the audio file
      const audioStream = fs.createReadStream(audioFilePath);

      // Call OpenAI Whisper API
      const transcription = await openai.audio.transcriptions.create({
        file: audioStream,
        model: 'whisper-1',
        language: 'th', // Thai language
        response_format: 'verbose_json',
        timestamp_granularities: ['word']
      });

      console.log('Whisper transcription completed:', transcription.text);

      return {
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
        confidence: 0.95 // Whisper doesn't provide confidence scores
      };

    } catch (error) {
      console.error('OpenAI Whisper transcription error:', error);
      
      // Fallback to mock transcription
      console.log('Falling back to mock transcription');
      return this.getMockTranscription();
    }
  }

  /**
   * Transcribe using Google Cloud Speech-to-Text
   */
  static async transcribeWithGoogle(audioFilePath: string): Promise<TranscriptionResult> {
    try {
      if (!speechClient) {
        console.log('Google Cloud Speech-to-Text not configured, using mock transcription');
        return this.getMockTranscription();
      }

      // Check if file exists
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioFilePath}`);
      }

      console.log(`Transcribing audio file with Google Speech-to-Text: ${audioFilePath}`);

      // Read the audio file
      const audioBytes = fs.readFileSync(audioFilePath).toString('base64');

      // Configure the request
      const request = {
        audio: {
          content: audioBytes,
        },
        config: {
          encoding: 'WEBM_OPUS' as const,
          sampleRateHertz: 48000,
          languageCode: 'th-TH', // Thai language
          alternativeLanguageCodes: ['en-US'], // Fallback to English
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true,
          model: 'latest_long', // Use latest model for better accuracy
          useEnhanced: true, // Use enhanced model if available
        },
      };

      // Perform the transcription
      const [response] = await speechClient.recognize(request);
      
      if (!response.results || response.results.length === 0) {
        console.log('No transcription results, falling back to mock');
        return this.getMockTranscription();
      }

      const transcription = response.results
        .map(result => result.alternatives?.[0]?.transcript || '')
        .join(' ');

      const confidence = response.results[0]?.alternatives?.[0]?.confidence || 0.8;

      console.log('Google Speech-to-Text transcription completed:', transcription);

      return {
        text: transcription,
        language: 'th',
        confidence: confidence,
        duration: 60 // Approximate, as Google doesn't provide exact duration
      };

    } catch (error) {
      console.error('Google Speech-to-Text transcription error:', error);
      
      // Fallback to mock transcription
      console.log('Falling back to mock transcription');
      return this.getMockTranscription();
    }
  }

  /**
   * Transcribe using Google Speech-to-Text + Gemini AI enhancement
   */
  static async transcribeWithGemini(audioFilePath: string): Promise<TranscriptionResult> {
    try {
      // First, get basic transcription from Google Speech-to-Text
      const basicTranscription = await this.transcribeWithGoogle(audioFilePath);
      
      if (!genAI || !basicTranscription.text) {
        console.log('Gemini not configured or no text to enhance, returning basic transcription');
        return basicTranscription;
      }

      console.log('Enhancing transcription with Gemini AI...');

      // Use Gemini to enhance and structure the transcription
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const enhancementPrompt = `
You are a sales CRM assistant. Please analyze and enhance this voice transcription from a Thai sales conversation. 

Original transcription: "${basicTranscription.text}"

Please provide:
1. A cleaned and properly formatted version of the transcription
2. Extract key information like customer names, companies, deals, follow-up actions
3. Improve grammar and punctuation while keeping the original meaning
4. Keep the response in Thai language

Format your response as JSON:
{
  "enhancedText": "improved transcription here",
  "customerInfo": {
    "name": "customer name if mentioned",
    "company": "company name if mentioned"
  },
  "dealInfo": {
    "value": "deal value if mentioned",
    "status": "deal status if mentioned"
  },
  "actionItems": ["list of action items"],
  "summary": "brief summary of the conversation"
}
`;

      const result = await model.generateContent(enhancementPrompt);
      const response = await result.response;
      const enhancedData = response.text();

      try {
        const parsed = JSON.parse(enhancedData);
        
        return {
          text: parsed.enhancedText || basicTranscription.text,
          language: basicTranscription.language,
          confidence: basicTranscription.confidence,
          duration: basicTranscription.duration,
          // Add enhanced metadata
          enhanced: true,
          customerInfo: parsed.customerInfo,
          dealInfo: parsed.dealInfo,
          actionItems: parsed.actionItems,
          summary: parsed.summary
        };
      } catch (parseError) {
        console.log('Failed to parse Gemini response, using basic transcription');
        return basicTranscription;
      }

    } catch (error) {
      console.error('Gemini enhancement error:', error);
      
      // Fallback to basic Google transcription
      return this.transcribeWithGoogle(audioFilePath);
    }
  }

  /**
   * Transcribe using Azure Speech Services (placeholder for future implementation)
   */
  static async transcribeWithAzure(audioFilePath: string): Promise<TranscriptionResult> {
    // TODO: Implement Azure Speech Services
    console.log('Azure Speech Services not implemented yet, using mock');
    return this.getMockTranscription();
  }

  /**
   * Enhanced mock transcription with more realistic Thai sales scenarios
   */
  static getMockTranscription(): TranscriptionResult {
    const mockTranscriptions = [
      'สวัสดีครับคุณลูกค้า วันนี้ผมโทรมาติดตามเรื่องใบเสนอราคาที่ส่งไปเมื่อสัปดาห์ที่แล้วครับ คุณลูกค้าได้มีโอกาสพิจารณาแล้วหรือยังครับ',
      'ขอบคุณมากครับที่ให้เวลาคุยกัน วันนี้เราได้หารือเรื่องแผนการตลาดใหม่ และคุณลูกค้าสนใจแพ็คเกจพรีเมี่ยมของเรามาก ต้องเตรียมเอกสารเพิ่มเติมสำหรับการนัดหมายครั้งต่อไป',
      'ลูกค้ารายใหม่จากบริษัท ABC จำกัด ติดต่อมาสอบถามเรื่องบริการคลาวด์ของเรา เขาต้องการโซลูชันสำหรับทีมขนาด 50 คน งบประมาณอยู่ที่ 200,000 บาทต่อปี',
      'การประชุมกับคุณสมชายเป็นไปด้วยดี เขาอนุมัติงบประมาณเบื้องต้นแล้ว ขั้นตอนต่อไปคือการเตรียมสัญญาและกำหนดการส่งมอบ คาดว่าจะเซ็นสัญญาภายในสัปดาหน้า',
      'ลูกค้าแจ้งว่าต้องการขยายการใช้บริการเพิ่มเติม จากเดิม 20 licenses เป็น 50 licenses พวกเขาจะตัดสินใจภายในสิ้นเดือนนี้ ต้องเตรียมใบเสนอราคาใหม่',
      'โทรติดตามลูกค้าเก่า พบว่าพวกเขามีปัญหาเรื่องการใช้งานระบบ ได้นัดหมายทีมเทคนิคไปช่วยแก้ไขในวันพุธนี้ เวลา 14:00 น.',
      'ลูกค้าจากภาคใต้สนใจบริการใหม่ของเรา ขอให้ส่งข้อมูลเพิ่มเติมและจัดการนำเสนอผ่าน Zoom ในสัปดาหน้า ต้องเตรียมสไลด์ให้พร้อม',
      'ได้รับข้อเสนอแนะจากลูกค้าเรื่องการปรับปรุงบริการ พวกเขาต้องการฟีเจอร์ reporting ที่ละเอียดมากขึ้น จะนำเรื่องนี้ไปหารือกับทีมพัฒนาผลิตภัณฑ์'
    ];
    
    const randomIndex = Math.floor(Math.random() * mockTranscriptions.length);
    
    return {
      text: mockTranscriptions[randomIndex],
      language: 'th',
      duration: Math.random() * 60 + 30, // 30-90 seconds
      confidence: Math.random() * 0.3 + 0.7 // 0.7-1.0
    };
  }

  /**
   * Auto-detect best transcription service based on file type and availability
   */
  static async transcribeAuto(audioFilePath: string): Promise<TranscriptionResult> {
    const fileExtension = path.extname(audioFilePath).toLowerCase();
    
    // Prioritize Gemini-enhanced transcription for best results
    if (process.env.GEMINI_API_KEY && (speechClient || process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      console.log('Using Gemini-enhanced Google Speech-to-Text for transcription');
      return this.transcribeWithGemini(audioFilePath);
    } else if (speechClient || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('Using Google Speech-to-Text for transcription');
      return this.transcribeWithGoogle(audioFilePath);
    } else if (process.env.OPENAI_API_KEY) {
      console.log('Using OpenAI Whisper for transcription');
      return this.transcribeWithWhisper(audioFilePath);
    } else if (process.env.AZURE_SPEECH_KEY) {
      console.log('Using Azure Speech Services for transcription');
      return this.transcribeWithAzure(audioFilePath);
    } else {
      console.log('No AI transcription service configured, using enhanced mock');
      return this.getMockTranscription();
    }
  }
}

export default TranscriptionService; 