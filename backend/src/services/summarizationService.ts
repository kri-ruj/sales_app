import OpenAI from 'openai';

// Initialize OpenAI client if API key is available
const openaiApiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI | null = null;
if (openaiApiKey) {
  openai = new OpenAI({
    apiKey: openaiApiKey,
  });
}

export interface SummarizationResult {
  summary: string;
  keywords?: string[];
  language?: string;
}

export class SummarizationService {
  /**
   * Summarize text using OpenAI (if available) or a mock implementation.
   */
  static async summarizeText(text: string, language: string = 'th'): Promise<SummarizationResult> {
    if (openai) {
      try {
        console.log(`Summarizing text with OpenAI for language: ${language}`);
        // Adjust prompt for better Thai summarization if needed
        const prompt = `Please summarize the following sales conversation text in ${language}. Extract key points and next actions. Text: "${text}"`;
        
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150, // Adjust as needed
          temperature: 0.5, // Adjust for more deterministic or creative summaries
        });

        const summary = response.choices[0]?.message?.content?.trim() || 'No summary generated.';
        console.log('OpenAI summarization completed:', summary);
        // Basic keyword extraction (can be improved)
        const keywords = summary.split(' ').slice(0, 5); 

        return {
          summary,
          keywords,
          language,
        };
      } catch (error) {
        console.error('OpenAI summarization error:', error);
        console.log('Falling back to mock summarization for text due to OpenAI error.');
        return this.getMockSummary(text, language);
      }
    } else {
      console.log('OpenAI API key not found, using mock summarization for text.');
      return this.getMockSummary(text, language);
    }
  }

  /**
   * Mock summarization for development when OpenAI is not available.
   */
  static getMockSummary(text: string, language: string = 'th'): SummarizationResult {
    let summary = 'สรุป (จำลอง): ';
    if (text.toLowerCase().includes('ลูกค้าสนใจ') || text.toLowerCase().includes('customer interested')) {
      summary += 'ลูกค้าแสดงความสนใจในผลิตภัณฑ์/บริการ ';
    } else {
      summary += 'เป็นการพูดคุยทั่วไปเกี่ยวกับผลิตภัณฑ์ ';
    }

    const keywords = ['ลูกค้า', 'ข้อเสนอ', 'ราคา', 'นัดหมาย', 'ติดตามผล'];
    const randomKeywords = [];
    for (let i = 0; i < 3; i++) {
      randomKeywords.push(keywords[Math.floor(Math.random() * keywords.length)]);
    }
    
    if (text.toLowerCase().includes('นัดหมาย') || text.toLowerCase().includes('meeting')) {
        summary += 'และมีการนัดหมายเพื่อหารือเพิ่มเติม ';
    } else if (text.toLowerCase().includes('เสนอราคา') || text.toLowerCase().includes('quotation')) {
        summary += 'มีการขอใบเสนอราคา ';
    }

    summary += `ต้องมีการติดตามผลในลำดับถัดไป`;

    return {
      summary: summary.slice(0, 200) + '...', // Keep it concise
      keywords: randomKeywords,
      language,
    };
  }
}

export default SummarizationService; 