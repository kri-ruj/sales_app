import { Request, Response } from 'express';
import Deal, { IDeal } from '../models/Deal';

export class DealController {
  // Get all deals with filtering and pagination
  async getAllDeals(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        stage,
        assignedTo,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query: any = {};
      
      // Add filters
      if (stage) {
        query.dealStage = stage;
      }
      
      if (assignedTo) {
        query.assignedTo = assignedTo;
      }
      
      // Add search functionality
      if (search) {
        query.$text = { $search: search as string };
      }

      const skip = (Number(page) - 1) * Number(limit);
      const sortOptions: any = {};
      sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

      const deals = await Deal.find(query)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit));

      const total = await Deal.countDocuments(query);

      res.json({
        deals,
        pagination: {
          current: Number(page),
          total: Math.ceil(total / Number(limit)),
          count: deals.length,
          totalDeals: total
        }
      });
    } catch (error) {
      console.error('Error fetching deals:', error);
      res.status(500).json({ error: 'Failed to fetch deals' });
    }
  }

  // Get single deal by ID
  async getDealById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const deal = await Deal.findById(id)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .populate('relatedActivities');

      if (!deal) {
        return res.status(404).json({ error: 'Deal not found' });
      }

      res.json(deal);
    } catch (error) {
      console.error('Error fetching deal:', error);
      res.status(500).json({ error: 'Failed to fetch deal' });
    }
  }

  // Create new deal
  async createDeal(req: Request, res: Response) {
    try {
      const dealData = req.body;
      
      // Add created by (in real app, get from JWT token)
      dealData.createdBy = dealData.createdBy || '507f1f77bcf86cd799439011'; // Mock user ID

      const deal = new Deal(dealData);
      await deal.save();

      const populatedDeal = await Deal.findById(deal._id)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');

      res.status(201).json(populatedDeal);
    } catch (error: any) {
      console.error('Error creating deal:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((err: any) => err.message);
        return res.status(400).json({ error: 'Validation failed', details: errors });
      }
      
      res.status(500).json({ error: 'Failed to create deal' });
    }
  }

  // Update deal
  async updateDeal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const deal = await Deal.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');

      if (!deal) {
        return res.status(404).json({ error: 'Deal not found' });
      }

      res.json(deal);
    } catch (error: any) {
      console.error('Error updating deal:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((err: any) => err.message);
        return res.status(400).json({ error: 'Validation failed', details: errors });
      }
      
      res.status(500).json({ error: 'Failed to update deal' });
    }
  }

  // Delete deal
  async deleteDeal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const deal = await Deal.findByIdAndDelete(id);
      
      if (!deal) {
        return res.status(404).json({ error: 'Deal not found' });
      }

      res.json({ message: 'Deal deleted successfully' });
    } catch (error) {
      console.error('Error deleting deal:', error);
      res.status(500).json({ error: 'Failed to delete deal' });
    }
  }

  // Auto-fill deal from transcription
  async autoFillFromTranscription(req: Request, res: Response) {
    try {
      const { dealId } = req.params;
      const { transcription, language = 'th' } = req.body;

      if (!transcription) {
        return res.status(400).json({ error: 'Transcription is required' });
      }

      // Extract CRM data from transcription using AI
      const extractedData = await this.extractCRMDataFromText(transcription, language);
      
      // Find existing deal
      const deal = await Deal.findById(dealId);
      if (!deal) {
        return res.status(404).json({ error: 'Deal not found' });
      }

      // Update deal with AI suggestions
      deal.aiSuggestions = {
        suggestedFields: extractedData,
        confidence: extractedData.confidence || 0.7,
        extractedAt: new Date(),
        approved: false
      };

      deal.lastRecordingTranscription = transcription;
      deal.lastRecordingDate = new Date();

      await deal.save();

      const populatedDeal = await Deal.findById(deal._id)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');

      res.json({
        deal: populatedDeal,
        suggestions: extractedData,
        message: 'AI suggestions generated successfully'
      });

    } catch (error) {
      console.error('Error in auto-fill from transcription:', error);
      res.status(500).json({ error: 'Failed to process transcription' });
    }
  }

  // Approve AI suggestions
  async approveAISuggestions(req: Request, res: Response) {
    try {
      const { dealId } = req.params;
      const { selectedFields } = req.body;

      const deal = await Deal.findById(dealId);
      if (!deal) {
        return res.status(404).json({ error: 'Deal not found' });
      }

      if (!deal.aiSuggestions) {
        return res.status(400).json({ error: 'No AI suggestions found' });
      }

      // Apply selected suggestions to deal
      if (selectedFields) {
        Object.keys(selectedFields).forEach(field => {
          if (selectedFields[field] && deal.aiSuggestions?.suggestedFields[field]) {
            (deal as any)[field] = deal.aiSuggestions.suggestedFields[field];
          }
        });
      } else {
        // Apply all suggestions
        Object.keys(deal.aiSuggestions.suggestedFields).forEach(field => {
          if (deal.aiSuggestions?.suggestedFields[field] !== undefined) {
            (deal as any)[field] = deal.aiSuggestions.suggestedFields[field];
          }
        });
      }

      // Mark suggestions as approved
      deal.aiSuggestions.approved = true;
      
      await deal.save();

      const populatedDeal = await Deal.findById(deal._id)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');

      res.json({
        deal: populatedDeal,
        message: 'AI suggestions applied successfully'
      });

    } catch (error) {
      console.error('Error approving AI suggestions:', error);
      res.status(500).json({ error: 'Failed to approve suggestions' });
    }
  }

  // Get deals statistics
  async getDealStats(req: Request, res: Response) {
    try {
      const stats = await Deal.aggregate([
        {
          $group: {
            _id: '$dealStage',
            count: { $sum: 1 },
            totalValue: { $sum: '$dealValue' },
            avgProbability: { $avg: '$probability' }
          }
        }
      ]);

      const totalDeals = await Deal.countDocuments();
      const totalValue = await Deal.aggregate([
        { $group: { _id: null, total: { $sum: '$dealValue' } } }
      ]);

      res.json({
        byStage: stats,
        totalDeals,
        totalValue: totalValue[0]?.total || 0
      });
    } catch (error) {
      console.error('Error fetching deal stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }

  // Private method to extract CRM data from text
  private async extractCRMDataFromText(text: string, language: string = 'th') {
    try {
      // Mock AI extraction - in real implementation, use OpenAI or other AI service
      const extractedData: any = {
        confidence: 0.8
      };

      // Simple text analysis for Thai content
      const lowerText = text.toLowerCase();

      // Extract company names (simplified)
      const companyPatterns = [
        /บริษัท\s+([^\s]+)/g,
        /บ\.\s*([^\s]+)/g,
        /ห้าง\s+([^\s]+)/g
      ];
      
      for (const pattern of companyPatterns) {
        const match = text.match(pattern);
        if (match) {
          extractedData.companyName = match[1];
          break;
        }
      }

      // Extract deal values
      const valuePatterns = [
        /(\d+(?:,\d+)*)\s*บาท/g,
        /(\d+(?:,\d+)*)\s*ล้าน/g,
        /มูลค่า\s*(\d+(?:,\d+)*)/g
      ];

      for (const pattern of valuePatterns) {
        const match = text.match(pattern);
        if (match) {
          let value = parseInt(match[1].replace(/,/g, ''));
          if (text.includes('ล้าน')) {
            value *= 1000000;
          }
          extractedData.dealValue = value;
          break;
        }
      }

      // Extract contact information
      const emailPattern = /[\w\.-]+@[\w\.-]+\.\w+/g;
      const emailMatch = text.match(emailPattern);
      if (emailMatch) {
        extractedData.contactEmail = emailMatch[0];
      }

      const phonePattern = /0[689]\d{8}/g;
      const phoneMatch = text.match(phonePattern);
      if (phoneMatch) {
        extractedData.contactPhone = phoneMatch[0];
      }

      // Extract names (simplified)
      const namePatterns = [
        /คุณ\s+([ก-ฮ]+(?:\s+[ก-ฮ]+)?)/g,
        /นาย\s+([ก-ฮ]+(?:\s+[ก-ฮ]+)?)/g,
        /นาง\s+([ก-ฮ]+(?:\s+[ก-ฮ]+)?)/g
      ];

      for (const pattern of namePatterns) {
        const match = text.match(pattern);
        if (match) {
          extractedData.contactPerson = match[1];
          break;
        }
      }

      // Determine deal stage based on keywords
      if (lowerText.includes('สนใจ') || lowerText.includes('ติดต่อ')) {
        extractedData.dealStage = 'prospect';
        extractedData.probability = 20;
      } else if (lowerText.includes('เสนอราคา') || lowerText.includes('ใบเสนอ')) {
        extractedData.dealStage = 'proposal';
        extractedData.probability = 50;
      } else if (lowerText.includes('ต่อรอง') || lowerText.includes('เจรจา')) {
        extractedData.dealStage = 'negotiation';
        extractedData.probability = 75;
      } else if (lowerText.includes('ปิดดีล') || lowerText.includes('ซื้อแล้ว')) {
        extractedData.dealStage = 'closed-won';
        extractedData.probability = 100;
      }

      return extractedData;

    } catch (error) {
      console.error('Error extracting CRM data:', error);
      return { confidence: 0.1 };
    }
  }
}

export default new DealController(); 