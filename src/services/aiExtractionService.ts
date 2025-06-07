// AI Extraction Service for parsing transcriptions into structured activity data
export interface ExtractedActivityData {
  title: string;
  description: string;
  customerName?: string;
  contactInfo?: string;
  activityType: 'call' | 'meeting' | 'email' | 'voice-note' | 'demo' | 'proposal' | 'negotiation' | 'follow-up-call' | 'site-visit';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'prospecting' | 'qualification' | 'presentation' | 'negotiation' | 'closing' | 'follow-up' | 'support';
  actionItems: string[];
  tags: string[];
  estimatedValue?: number;
  notes?: string;
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
  confidence: number; // 0-1 confidence score
  suggestions: {
    field: string;
    value: string;
    confidence: number;
    reason: string;
  }[];
}

class AIExtractionService {
  private readonly API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

  // Extract structured data from transcription using AI
  async extractActivityData(transcription: string, audioUrl?: string): Promise<ExtractedActivityData> {
    try {
      // First try to use backend AI service if available
      const response = await fetch(`${this.API_BASE_URL}/ai/extract-activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ 
          transcription,
          audioUrl 
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return result.data;
        }
      }

      // Fallback to client-side AI extraction
      return this.fallbackExtraction(transcription);
    } catch (error) {
      console.warn('AI extraction service failed, using fallback:', error);
      return this.fallbackExtraction(transcription);
    }
  }

  // Client-side fallback extraction using pattern matching and NLP techniques
  private fallbackExtraction(transcription: string): ExtractedActivityData {
    const text = transcription.toLowerCase();
    
    // Extract customer information
    const customerInfo = this.extractCustomerInfo(transcription);
    
    // Extract deal information
    const dealInfo = this.extractDealInfo(transcription);
    
    // Determine activity type based on keywords
    const activityType = this.detectActivityType(text);
    
    // Determine category based on content
    const category = this.detectCategory(text);
    
    // Determine priority based on urgency indicators
    const priority = this.detectPriority(text);
    
    // Extract action items
    const actionItems = this.extractActionItems(transcription);
    
    // Extract tags
    const tags = this.extractTags(text);
    
    // Generate title and description
    const title = this.generateTitle(transcription, activityType, customerInfo?.name);
    const description = this.generateDescription(transcription);
    
    // Extract estimated value
    const estimatedValue = this.extractValue(text);
    
    return {
      title,
      description,
      customerName: customerInfo?.name,
      contactInfo: customerInfo?.phone || customerInfo?.email,
      activityType,
      priority,
      category,
      actionItems,
      tags,
      estimatedValue,
      notes: transcription,
      customerInfo,
      dealInfo,
      confidence: 0.7, // Fallback confidence
      suggestions: this.generateSuggestions(transcription, {
        activityType,
        category,
        priority,
        customerInfo,
        dealInfo
      })
    };
  }

  private extractCustomerInfo(text: string): ExtractedActivityData['customerInfo'] {
    const customerInfo: ExtractedActivityData['customerInfo'] = {};
    
    // Extract names (Thai and English patterns)
    const namePatterns = [
      /คุณ\s*([ก-๙a-zA-Z\s]+)/g,
      /นาย\s*([ก-๙a-zA-Z\s]+)/g,
      /นาง\s*([ก-๙a-zA-Z\s]+)/g,
      /พี่\s*([ก-๙a-zA-Z\s]+)/g,
      /ลูกค้า\s*([ก-๙a-zA-Z\s]+)/g,
      /mr\.?\s*([a-zA-Z\s]+)/gi,
      /ms\.?\s*([a-zA-Z\s]+)/gi,
    ];
    
    for (const pattern of namePatterns) {
      const match = pattern.exec(text);
      if (match && match[1]) {
        customerInfo.name = match[1].trim();
        break;
      }
    }
    
    // Extract company names
    const companyPatterns = [
      /บริษัท\s*([ก-๙a-zA-Z\s]+)(?:จำกัด)?/g,
      /company\s*([a-zA-Z\s]+)/gi,
      /corp\s*([a-zA-Z\s]+)/gi,
      /องค์กร\s*([ก-๙a-zA-Z\s]+)/g,
    ];
    
    for (const pattern of companyPatterns) {
      const match = pattern.exec(text);
      if (match && match[1]) {
        customerInfo.company = match[1].trim();
        break;
      }
    }
    
    // Extract phone numbers
    const phonePattern = /(\d{2,3}[-.\s]?\d{3}[-.\s]?\d{4})/g;
    const phoneMatch = phonePattern.exec(text);
    if (phoneMatch) {
      customerInfo.phone = phoneMatch[1];
    }
    
    // Extract email addresses
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const emailMatch = emailPattern.exec(text);
    if (emailMatch) {
      customerInfo.email = emailMatch[1];
    }
    
    return customerInfo;
  }

  private extractDealInfo(text: string): ExtractedActivityData['dealInfo'] {
    const dealInfo: ExtractedActivityData['dealInfo'] = {};
    
    // Extract monetary values (Thai and English)
    const valuePatterns = [
      /(\d+(?:,\d{3})*)\s*บาท/g,
      /(\d+(?:,\d{3})*)\s*ล้าน/g,
      /(\d+(?:,\d{3})*)\s*หมื่น/g,
      /\$(\d+(?:,\d{3})*)/g,
      /(\d+(?:,\d{3})*)\s*dollars?/gi,
    ];
    
    for (const pattern of valuePatterns) {
      const match = pattern.exec(text);
      if (match && match[1]) {
        dealInfo.value = match[1];
        break;
      }
    }
    
    // Extract deal status
    if (text.includes('สนใจ') || text.includes('interested')) {
      dealInfo.status = 'qualified';
    } else if (text.includes('เจรจา') || text.includes('negotiate')) {
      dealInfo.status = 'negotiation';
    } else if (text.includes('ปิดดีล') || text.includes('close')) {
      dealInfo.status = 'closing';
    }
    
    // Extract probability indicators
    if (text.includes('แน่ใจ') || text.includes('certain')) {
      dealInfo.probability = 90;
    } else if (text.includes('น่าจะ') || text.includes('likely')) {
      dealInfo.probability = 70;
    } else if (text.includes('อาจจะ') || text.includes('maybe')) {
      dealInfo.probability = 50;
    }
    
    return dealInfo;
  }

  private detectActivityType(text: string): ExtractedActivityData['activityType'] {
    if (text.includes('โทร') || text.includes('call') || text.includes('phone')) {
      return 'call';
    } else if (text.includes('ประชุม') || text.includes('meeting') || text.includes('พบ')) {
      return 'meeting';
    } else if (text.includes('อีเมล') || text.includes('email')) {
      return 'email';
    } else if (text.includes('เสนอ') || text.includes('proposal')) {
      return 'proposal';
    } else if (text.includes('เจรจา') || text.includes('negotiat')) {
      return 'negotiation';
    } else if (text.includes('ติดตาม') || text.includes('follow')) {
      return 'follow-up-call';
    } else if (text.includes('เดโม') || text.includes('demo')) {
      return 'demo';
    }
    return 'voice-note';
  }

  private detectCategory(text: string): ExtractedActivityData['category'] {
    if (text.includes('หาลูกค้า') || text.includes('prospect')) {
      return 'prospecting';
    } else if (text.includes('คัดกรอง') || text.includes('qualify')) {
      return 'qualification';
    } else if (text.includes('นำเสนอ') || text.includes('present')) {
      return 'presentation';
    } else if (text.includes('เจรจา') || text.includes('negotiat')) {
      return 'negotiation';
    } else if (text.includes('ปิดดีล') || text.includes('closing')) {
      return 'closing';
    } else if (text.includes('ติดตาม') || text.includes('follow')) {
      return 'follow-up';
    } else if (text.includes('สนับสนุน') || text.includes('support')) {
      return 'support';
    }
    return 'prospecting';
  }

  private detectPriority(text: string): ExtractedActivityData['priority'] {
    if (text.includes('ด่วน') || text.includes('urgent') || text.includes('เร่ง')) {
      return 'urgent';
    } else if (text.includes('สำคัญ') || text.includes('important') || text.includes('high')) {
      return 'high';
    } else if (text.includes('ธรรมดา') || text.includes('normal') || text.includes('medium')) {
      return 'medium';
    }
    return 'medium';
  }

  private extractActionItems(text: string): string[] {
    const actionItems: string[] = [];
    
    // Pattern for action items in Thai and English
    const actionPatterns = [
      /ต้อง([^.!?]+)/g,
      /ควร([^.!?]+)/g,
      /จะ([^.!?]+)/g,
      /need to ([^.!?]+)/gi,
      /should ([^.!?]+)/gi,
      /will ([^.!?]+)/gi,
      /todo ([^.!?]+)/gi,
      /action ([^.!?]+)/gi,
    ];
    
    for (const pattern of actionPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1] && match[1].trim().length > 3) {
          actionItems.push(match[1].trim());
        }
      }
    }
    
    return actionItems.slice(0, 5); // Limit to 5 action items
  }

  private extractTags(text: string): string[] {
    const tags: string[] = [];
    
    // Common business tags
    const tagMappings: { [key: string]: string } = {
      'ซื้อ': 'purchase',
      'ขาย': 'sales',
      'เทคโนโลยี': 'technology',
      'software': 'software',
      'hardware': 'hardware',
      'service': 'service',
      'บริการ': 'service',
      'ปรึกษา': 'consultation',
      'ฝึกอบรม': 'training',
      'สนใจ': 'interested',
      'hot-lead': 'hot-lead',
      'qualified': 'qualified'
    };
    
    for (const [keyword, tag] of Object.entries(tagMappings)) {
      if (text.includes(keyword.toLowerCase())) {
        tags.push(tag);
      }
    }
    
    return Array.from(new Set(tags)); // Remove duplicates
  }

  private generateTitle(text: string, activityType: string, customerName?: string): string {
    const customer = customerName || 'ลูกค้า';
    const activityTypeMap: { [key: string]: string } = {
      'call': 'โทรหา',
      'meeting': 'ประชุมกับ',
      'email': 'ส่งอีเมลถึง',
      'voice-note': 'บันทึกเสียงเกี่ยวกับ',
      'demo': 'เดโมให้',
      'proposal': 'เสนอราคาให้',
      'negotiation': 'เจรจากับ',
      'follow-up-call': 'ติดตามกับ',
      'site-visit': 'เยี่ยมชม'
    };
    
    const activityText = activityTypeMap[activityType] || 'กิจกรรมกับ';
    return `${activityText} ${customer}`;
  }

  private generateDescription(text: string): string {
    // Take first 200 characters as description
    return text.length > 200 ? text.substring(0, 200) + '...' : text;
  }

  private extractValue(text: string): number | undefined {
    // Extract monetary values and convert to numbers
    const valuePatterns = [
      /(\d+(?:,\d{3})*)\s*บาท/g,
      /(\d+(?:,\d{3})*)\s*ล้าน/g,
      /(\d+(?:,\d{3})*)\s*หมื่น/g,
      /\$(\d+(?:,\d{3})*)/g,
    ];
    
    for (const pattern of valuePatterns) {
      const match = pattern.exec(text);
      if (match && match[1]) {
        const numStr = match[1].replace(/,/g, '');
        let value = parseInt(numStr);
        
        if (text.includes('ล้าน')) {
          value *= 1000000;
        } else if (text.includes('หมื่น')) {
          value *= 10000;
        }
        
        return value;
      }
    }
    
    return undefined;
  }

  private generateSuggestions(
    text: string, 
    extracted: {
      activityType: string;
      category: string;
      priority: string;
      customerInfo?: any;
      dealInfo?: any;
    }
  ): ExtractedActivityData['suggestions'] {
    const suggestions: ExtractedActivityData['suggestions'] = [];
    
    // Suggest improvements based on content analysis
    if (extracted.customerInfo?.name) {
      suggestions.push({
        field: 'customerName',
        value: extracted.customerInfo.name,
        confidence: 0.8,
        reason: 'ตรวจพบชื่อลูกค้าในการสนทนา'
      });
    }
    
    if (extracted.dealInfo?.value) {
      suggestions.push({
        field: 'estimatedValue',
        value: extracted.dealInfo.value,
        confidence: 0.7,
        reason: 'ตรวจพบมูลค่าดีลในการสนทนา'
      });
    }
    
    if (text.includes('ติดตาม') || text.includes('follow')) {
      suggestions.push({
        field: 'dueDate',
        value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        confidence: 0.6,
        reason: 'แนะนำให้ติดตามภายใน 7 วัน'
      });
    }
    
    return suggestions;
  }
}

export default new AIExtractionService();