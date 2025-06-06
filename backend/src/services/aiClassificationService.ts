import { GoogleGenerativeAI } from '@google/generative-ai';
import { ISalesActivity } from '../models/SalesActivity';
import ScoringService from './scoringService';

// Initialize Google AI Gemini
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export interface ClassificationResult {
  category: 'prospecting' | 'qualification' | 'presentation' | 'negotiation' | 'closing' | 'follow-up' | 'support';
  subCategory: string;
  confidence: number;
  extractedData: {
    customerInfo?: {
      name?: string;
      company?: string;
      position?: string;
      email?: string;
      phone?: string;
    };
    dealInfo?: {
      value?: string;
      status?: string;
      probability?: number;
      expectedCloseDate?: string;
    };
    actionItems?: string[];
    nextSteps?: string[];
    painPoints?: string[];
    decisionMakers?: string[];
    competitors?: string[];
    timeline?: string;
    budget?: string;
  };
  reasoning: string;
  qualityScore: number;
}

export class AIClassificationService {
  
  /**
   * Classify sales activity using Gemini AI
   */
  static async classifyActivity(transcription: string, activityType?: string): Promise<ClassificationResult> {
    try {
      if (!genAI) {
        console.log('Gemini not configured, using rule-based classification');
        return this.getRuleBasedClassification(transcription, activityType);
      }

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const classificationPrompt = `
You are an expert sales AI assistant. Analyze this Thai/English sales conversation and provide a comprehensive classification.

Conversation: "${transcription}"
Activity Type: ${activityType || 'unknown'}

Please analyze and provide the following in JSON format:

{
  "category": "one of: prospecting, qualification, presentation, negotiation, closing, follow-up, support",
  "subCategory": "specific sub-category (e.g., cold-call, demo, proposal-review, price-negotiation, contract-signing, etc.)",
  "confidence": 0.0-1.0,
  "extractedData": {
    "customerInfo": {
      "name": "customer name if mentioned",
      "company": "company name if mentioned", 
      "position": "job title if mentioned",
      "email": "email if mentioned",
      "phone": "phone if mentioned"
    },
    "dealInfo": {
      "value": "deal value/budget if mentioned",
      "status": "current deal status",
      "probability": 0-100,
      "expectedCloseDate": "if mentioned"
    },
    "actionItems": ["list of follow-up actions"],
    "nextSteps": ["planned next steps"],
    "painPoints": ["customer problems/challenges mentioned"],
    "decisionMakers": ["decision makers mentioned"],
    "competitors": ["competitors mentioned"],
    "timeline": "project/decision timeline",
    "budget": "budget information"
  },
  "reasoning": "explanation of why this category was chosen",
  "qualityScore": 0-100
}

Category Guidelines:
- prospecting: Initial outreach, cold calls, research
- qualification: Discovery calls, needs assessment, BANT qualification
- presentation: Product demos, solution presentations, capability overview
- negotiation: Price discussions, terms negotiation, objection handling
- closing: Final proposals, contract signing, deal finalization
- follow-up: Post-meeting follow-ups, check-ins, relationship building
- support: Customer service, troubleshooting, account management

Quality Score Factors:
- Conversation depth and engagement
- Clear outcomes and next steps
- Customer information gathered
- Pain points identified
- Decision process understanding

Respond only with valid JSON.
`;

      const result = await model.generateContent(classificationPrompt);
      const response = await result.response;
      const aiResponse = response.text();

      try {
        // Clean the response to extract JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate and sanitize the response
        return this.validateClassificationResult(parsed);

      } catch (parseError) {
        console.log('Failed to parse Gemini classification response:', parseError);
        return this.getRuleBasedClassification(transcription, activityType);
      }

    } catch (error) {
      console.error('Gemini classification error:', error);
      return this.getRuleBasedClassification(transcription, activityType);
    }
  }

  /**
   * Validate and sanitize classification result
   */
  private static validateClassificationResult(parsed: any): ClassificationResult {
    const validCategories = ['prospecting', 'qualification', 'presentation', 'negotiation', 'closing', 'follow-up', 'support'];
    
    return {
      category: validCategories.includes(parsed.category) ? parsed.category : 'qualification',
      subCategory: parsed.subCategory || 'general',
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.7)),
      extractedData: {
        customerInfo: parsed.extractedData?.customerInfo || {},
        dealInfo: parsed.extractedData?.dealInfo || {},
        actionItems: Array.isArray(parsed.extractedData?.actionItems) ? parsed.extractedData.actionItems : [],
        nextSteps: Array.isArray(parsed.extractedData?.nextSteps) ? parsed.extractedData.nextSteps : [],
        painPoints: Array.isArray(parsed.extractedData?.painPoints) ? parsed.extractedData.painPoints : [],
        decisionMakers: Array.isArray(parsed.extractedData?.decisionMakers) ? parsed.extractedData.decisionMakers : [],
        competitors: Array.isArray(parsed.extractedData?.competitors) ? parsed.extractedData.competitors : [],
        timeline: parsed.extractedData?.timeline || '',
        budget: parsed.extractedData?.budget || ''
      },
      reasoning: parsed.reasoning || 'Automated classification based on conversation content',
      qualityScore: Math.max(0, Math.min(100, parsed.qualityScore || 50))
    };
  }

  /**
   * Fallback rule-based classification when AI is not available
   */
  private static getRuleBasedClassification(transcription: string, activityType?: string): ClassificationResult {
    const text = transcription.toLowerCase();
    
    // Simple keyword-based classification
    let category: any = 'qualification'; // default
    let subCategory = 'general';
    let confidence = 0.6;
    let qualityScore = 50;

    // Prospecting indicators
    if (text.includes('สวัสดี') && (text.includes('แนะนำ') || text.includes('บริษัท') || text.includes('ผลิตภัณฑ์'))) {
      category = 'prospecting';
      subCategory = 'introduction';
      confidence = 0.7;
    }

    // Qualification indicators
    if (text.includes('ความต้องการ') || text.includes('งบประมาณ') || text.includes('ปัญหา') || text.includes('ใช้งาน')) {
      category = 'qualification';
      subCategory = 'needs-assessment';
      confidence = 0.8;
    }

    // Presentation indicators
    if (text.includes('demo') || text.includes('นำเสนอ') || text.includes('แสดง') || text.includes('ฟีเจอร์')) {
      category = 'presentation';
      subCategory = 'product-demo';
      confidence = 0.8;
    }

    // Negotiation indicators
    if (text.includes('ราคา') || text.includes('เงื่อนไข') || text.includes('ส่วนลด') || text.includes('ต่อรอง')) {
      category = 'negotiation';
      subCategory = 'price-discussion';
      confidence = 0.8;
    }

    // Closing indicators
    if (text.includes('สัญญา') || text.includes('เซ็น') || text.includes('ตกลง') || text.includes('ยืนยัน')) {
      category = 'closing';
      subCategory = 'contract-discussion';
      confidence = 0.9;
    }

    // Follow-up indicators
    if (text.includes('ติดตาม') || text.includes('นัดหมาย') || text.includes('ครั้งต่อไป') || text.includes('สัปดาหน้า')) {
      category = 'follow-up';
      subCategory = 'appointment-setting';
      confidence = 0.7;
    }

    // Extract basic information
    const extractedData = this.extractBasicInfo(transcription);

    // Calculate quality score based on conversation length and content
    if (transcription.length > 500) qualityScore += 20;
    if (extractedData.actionItems && extractedData.actionItems.length > 0) qualityScore += 15;
    if (extractedData.customerInfo?.name || extractedData.customerInfo?.company) qualityScore += 15;

    return {
      category,
      subCategory,
      confidence,
      extractedData,
      reasoning: `Rule-based classification based on keywords and content analysis`,
      qualityScore: Math.min(100, qualityScore)
    };
  }

  /**
   * Extract basic information using simple pattern matching
   */
  private static extractBasicInfo(transcription: string): any {
    const actionItemPatterns = [
      /ต้อง(.*?)(?=[\.。]|$)/g,
      /จะ(.*?)(?=[\.。]|$)/g,
      /ควร(.*?)(?=[\.。]|$)/g
    ];

    const actionItems: string[] = [];
    actionItemPatterns.forEach(pattern => {
      const matches = transcription.match(pattern);
      if (matches) {
        actionItems.push(...matches.map(match => match.trim()));
      }
    });

    // Extract company names (basic pattern)
    const companyPattern = /บริษัท\s+([^\s]+(?:\s+[^\s]+)*?)(?:\s+จำกัด)?/g;
    const companyMatches = transcription.match(companyPattern);
    const company = companyMatches ? companyMatches[0] : undefined;

    // Extract names (very basic)
    const namePattern = /คุณ\s+([^\s]+)/g;
    const nameMatches = transcription.match(namePattern);
    const name = nameMatches ? nameMatches[0].replace('คุณ ', '') : undefined;

    // Extract values/budget
    const valuePattern = /(\d+(?:,\d+)*)\s*(?:บาท|baht|thousand|million|ล้าน|พัน)/gi;
    const valueMatches = transcription.match(valuePattern);
    const value = valueMatches ? valueMatches[0] : undefined;

    return {
      customerInfo: {
        name,
        company
      },
      dealInfo: {
        value
      },
      actionItems: actionItems.slice(0, 5) // Limit to first 5
    };
  }

  /**
   * Update activity with AI classification
   */
  static async updateActivityWithClassification(activity: ISalesActivity): Promise<ISalesActivity> {
    if (!activity.transcription) {
      return activity;
    }

    try {
      const classification = await this.classifyActivity(activity.transcription, activity.activityType);
      
      // Update activity with classification data
      activity.category = classification.category;
      activity.subCategory = classification.subCategory;
      
      // Update customer info if extracted
      if (classification.extractedData.customerInfo) {
        activity.customerInfo = {
          ...activity.customerInfo,
          ...classification.extractedData.customerInfo
        };
      }

      // Update deal info if extracted
      if (classification.extractedData.dealInfo) {
        activity.dealInfo = {
          ...activity.dealInfo,
          ...classification.extractedData.dealInfo
        };
      }

      // Add action items if extracted
      if (classification.extractedData.actionItems && classification.extractedData.actionItems.length > 0) {
        activity.actionItems = [
          ...activity.actionItems,
          ...classification.extractedData.actionItems
        ];
      }

      // Set AI classification metadata
      activity.aiClassification = {
        suggestedCategory: classification.category,
        suggestedSubCategory: classification.subCategory,
        confidence: classification.confidence,
        extractedData: classification.extractedData,
        humanConfirmed: false
      };

      // Calculate and set activity score
      const scoreResult = ScoringService.calculateActivityScore(activity);
      activity.activityScore = scoreResult.totalScore;

      if (!activity.qualityMetrics) {
        activity.qualityMetrics = {
          duration: activity.transcriptionDuration || 0,
          engagement: Math.floor(classification.qualityScore / 10),
          outcomes: classification.extractedData.actionItems?.length || 0,
          followUpCompleted: false
        };
      }

      return activity;

    } catch (error) {
      console.error('Error updating activity with classification:', error);
      return activity;
    }
  }
}

export default AIClassificationService;