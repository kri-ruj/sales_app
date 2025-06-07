import express, { Request, Response } from 'express';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// AI extraction endpoint for activity data
router.post('/extract-activity', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { transcription, audioUrl } = req.body;
    
    if (!transcription) {
      res.status(400).json({
        success: false,
        message: 'Transcription is required'
      });
      return;
    }

    // Mock AI extraction response
    // In production, this would call OpenAI or another AI service
    const extractedData = {
      title: `กิจกรรมจากการบันทึกเสียง`,
      description: transcription.substring(0, 200) + (transcription.length > 200 ? '...' : ''),
      customerName: extractCustomerName(transcription),
      contactInfo: extractContactInfo(transcription),
      activityType: detectActivityType(transcription),
      priority: detectPriority(transcription),
      category: detectCategory(transcription),
      actionItems: extractActionItems(transcription),
      tags: extractTags(transcription),
      estimatedValue: extractValue(transcription),
      notes: transcription,
      customerInfo: {
        name: extractCustomerName(transcription),
        company: extractCompany(transcription),
        phone: extractPhone(transcription),
        email: extractEmail(transcription)
      },
      dealInfo: {
        value: extractDealValue(transcription),
        status: detectDealStatus(transcription),
        probability: estimateProbability(transcription)
      },
      confidence: 0.75, // Mock confidence score
      suggestions: generateSuggestions(transcription)
    };

    res.json({
      success: true,
      data: extractedData
    });

  } catch (error) {
    console.error('AI extraction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extract activity data'
    });
  }
});

// Helper functions for extraction
function extractCustomerName(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Thai patterns
  const thaiPatterns = [
    /คุณ\s*([ก-๙a-zA-Z\s]+)/g,
    /นาย\s*([ก-๙a-zA-Z\s]+)/g,
    /นาง\s*([ก-๙a-zA-Z\s]+)/g,
    /พี่\s*([ก-๙a-zA-Z\s]+)/g,
    /ลูกค้า\s*([ก-๙a-zA-Z\s]+)/g,
  ];
  
  // English patterns
  const englishPatterns = [
    /mr\.?\s*([a-zA-Z\s]+)/gi,
    /ms\.?\s*([a-zA-Z\s]+)/gi,
    /mrs\.?\s*([a-zA-Z\s]+)/gi,
  ];
  
  const patterns = [...thaiPatterns, ...englishPatterns];
  
  for (const pattern of patterns) {
    const match = pattern.exec(lowerText);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return '';
}

function extractCompany(text: string): string {
  const companyPatterns = [
    /บริษัท\s*([ก-๙a-zA-Z\s]+)(?:จำกัด)?/g,
    /company\s*([a-zA-Z\s]+)/gi,
    /corp\s*([a-zA-Z\s]+)/gi,
    /องค์กร\s*([ก-๙a-zA-Z\s]+)/g,
  ];
  
  for (const pattern of companyPatterns) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return '';
}

function extractContactInfo(text: string): string {
  // Extract phone or email
  const phone = extractPhone(text);
  const email = extractEmail(text);
  
  return phone || email || '';
}

function extractPhone(text: string): string {
  const phonePattern = /(\d{2,3}[-.\s]?\d{3}[-.\s]?\d{4})/g;
  const match = phonePattern.exec(text);
  return match ? match[1] : '';
}

function extractEmail(text: string): string {
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const match = emailPattern.exec(text);
  return match ? match[1] : '';
}

function detectActivityType(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('โทร') || lowerText.includes('call') || lowerText.includes('phone')) {
    return 'call';
  } else if (lowerText.includes('ประชุม') || lowerText.includes('meeting') || lowerText.includes('พบ')) {
    return 'meeting';
  } else if (lowerText.includes('อีเมล') || lowerText.includes('email')) {
    return 'email';
  } else if (lowerText.includes('เสนอ') || lowerText.includes('proposal')) {
    return 'proposal';
  } else if (lowerText.includes('เจรจา') || lowerText.includes('negotiat')) {
    return 'negotiation';
  } else if (lowerText.includes('ติดตาม') || lowerText.includes('follow')) {
    return 'follow-up-call';
  } else if (lowerText.includes('เดโม') || lowerText.includes('demo')) {
    return 'demo';
  }
  
  return 'voice-note';
}

function detectCategory(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('หาลูกค้า') || lowerText.includes('prospect')) {
    return 'prospecting';
  } else if (lowerText.includes('คัดกรอง') || lowerText.includes('qualify')) {
    return 'qualification';
  } else if (lowerText.includes('นำเสนอ') || lowerText.includes('present')) {
    return 'presentation';
  } else if (lowerText.includes('เจรจา') || lowerText.includes('negotiat')) {
    return 'negotiation';
  } else if (lowerText.includes('ปิดดีล') || lowerText.includes('closing')) {
    return 'closing';
  } else if (lowerText.includes('ติดตาม') || lowerText.includes('follow')) {
    return 'follow-up';
  } else if (lowerText.includes('สนับสนุน') || lowerText.includes('support')) {
    return 'support';
  }
  
  return 'prospecting';
}

function detectPriority(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('ด่วน') || lowerText.includes('urgent') || lowerText.includes('เร่ง')) {
    return 'urgent';
  } else if (lowerText.includes('สำคัญ') || lowerText.includes('important') || lowerText.includes('high')) {
    return 'high';
  } else if (lowerText.includes('ธรรมดา') || lowerText.includes('normal') || lowerText.includes('medium')) {
    return 'medium';
  }
  
  return 'medium';
}

function extractActionItems(text: string): string[] {
  const actionItems: string[] = [];
  
  const actionPatterns = [
    /ต้อง([^.!?]+)/g,
    /ควร([^.!?]+)/g,
    /จะ([^.!?]+)/g,
    /need to ([^.!?]+)/gi,
    /should ([^.!?]+)/gi,
    /will ([^.!?]+)/gi,
  ];
  
  for (const pattern of actionPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (match[1] && match[1].trim().length > 3) {
        actionItems.push(match[1].trim());
      }
    }
  }
  
  return actionItems.slice(0, 5); // Limit to 5 items
}

function extractTags(text: string): string[] {
  const tags: string[] = [];
  const lowerText = text.toLowerCase();
  
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
    'hot': 'hot-lead',
    'qualified': 'qualified'
  };
  
  for (const [keyword, tag] of Object.entries(tagMappings)) {
    if (lowerText.includes(keyword.toLowerCase())) {
      tags.push(tag);
    }
  }
  
  return [...new Set(tags)]; // Remove duplicates
}

function extractValue(text: string): number | undefined {
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

function extractDealValue(text: string): string {
  const value = extractValue(text);
  return value ? value.toString() : '';
}

function detectDealStatus(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('สนใจ') || lowerText.includes('interested')) {
    return 'qualified';
  } else if (lowerText.includes('เจรจา') || lowerText.includes('negotiate')) {
    return 'negotiation';
  } else if (lowerText.includes('ปิดดีล') || lowerText.includes('close')) {
    return 'closing';
  }
  
  return '';
}

function estimateProbability(text: string): number {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('แน่ใจ') || lowerText.includes('certain')) {
    return 90;
  } else if (lowerText.includes('น่าจะ') || lowerText.includes('likely')) {
    return 70;
  } else if (lowerText.includes('อาจจะ') || lowerText.includes('maybe')) {
    return 50;
  }
  
  return 0;
}

function generateSuggestions(text: string): any[] {
  const suggestions = [];
  
  const customerName = extractCustomerName(text);
  if (customerName) {
    suggestions.push({
      field: 'customerName',
      value: customerName,
      confidence: 0.8,
      reason: 'ตรวจพบชื่อลูกค้าในการสนทนา'
    });
  }
  
  const value = extractValue(text);
  if (value) {
    suggestions.push({
      field: 'estimatedValue',
      value: value.toString(),
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

export default router;