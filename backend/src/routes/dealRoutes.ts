import { Router, Request, Response } from 'express';
import Deal from '../models/Deal';
import SummarizationService from '../services/summarizationService';
import User from '../models/User';
import lineService from '../services/lineService';

const router = Router();

// Get all deals with filtering and pagination
router.get('/', async (req: Request, res: Response): Promise<void> => {
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
      success: true,
      data: deals,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        count: deals.length,
        totalDeals: total
      }
    });
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ 
      error: 'Failed to fetch deals',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get deal statistics
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
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
      success: true,
      data: {
        byStage: stats,
        totalDeals,
        totalValue: totalValue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching deal stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get single deal by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const deal = await Deal.findById(id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('relatedActivities');

    if (!deal) {
      res.status(404).json({ error: 'Deal not found' });
      return;
    }

    res.json({
      success: true,
      data: deal
    });
  } catch (error) {
    console.error('Error fetching deal:', error);
    res.status(500).json({ 
      error: 'Failed to fetch deal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new deal
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const dealData = req.body;
    
    // Add created by (in real app, get from JWT token)
    dealData.createdBy = dealData.createdBy || '507f1f77bcf86cd799439011'; // Mock user ID

    const deal = new Deal(dealData);
    await deal.save();

    const populatedDeal = await Deal.findById(deal._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    // 🚀 LINE NOTIFICATION for new deal creation
    try {
      if (populatedDeal && dealData.dealValue > 50000) { // Only notify for deals > 50k
        // Notify assigned user
        const assignedUser = await User.findById(populatedDeal.assignedTo);
        if (assignedUser?.lineUserId) {
          await lineService.notifyDealUpdate(
            populatedDeal,
            assignedUser._id.toString(),
            'created'
          );
          console.log(`✅ LINE notification sent for new deal: ${populatedDeal.dealName}`);
        }

        // Notify team group if high value deal (>200k)
        if (dealData.dealValue > 200000 && assignedUser?.teamLineGroupId) {
          await lineService.sendMessageToGroup(
            assignedUser.teamLineGroupId,
            `🎉 ดีลใหม่มูลค่าสูง!
💼 ${populatedDeal.dealName || 'ดีลใหม่'}
💰 มูลค่า: ${dealData.dealValue.toLocaleString()} บาท
👤 รับผิดชอบ: ${assignedUser.firstName} ${assignedUser.lastName}
📊 โอกาสสำเร็จ: ${dealData.probability || 50}%

🚀 ขอให้โชคดี!`
          );
        }
      }
    } catch (lineError) {
      console.error('❌ Failed to send LINE notification for new deal:', lineError);
      // Don't fail the request if LINE notification fails
    }

    res.status(201).json({
      success: true,
      data: populatedDeal,
      message: 'Deal created successfully'
    });
  } catch (error: any) {
    console.error('Error creating deal:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ 
        error: 'Validation failed', 
        details: errors,
        message: error.message 
      });
      return;
    }
    
    res.status(500).json({ 
      error: 'Failed to create deal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update deal
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Get original deal to compare changes
    const originalDeal = await Deal.findById(id);
    if (!originalDeal) {
      res.status(404).json({ error: 'Deal not found' });
      return;
    }

    const deal = await Deal.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!deal) {
      res.status(404).json({ error: 'Deal not found' });
      return;
    }

    // 🚀 LINE NOTIFICATION for deal updates
    try {
      // Check for significant changes that warrant notifications
      const significantChanges = [];
      
      // Check for status/stage changes
      if (originalDeal.dealStage !== deal.dealStage) {
        significantChanges.push('stage');
        
        // Special notifications for closed deals
        if (deal.dealStage === 'closed-won') {
          if (deal.assignedTo && typeof deal.assignedTo === 'object' && 'toString' in deal.assignedTo) {
          await lineService.notifyDealUpdate(deal, deal.assignedTo.toString(), 'won');
        }
          
          // Celebrate high-value wins with team
          if (deal.dealValue > 100000) {
            const assignedUser = await User.findById(deal.assignedTo);
            if (assignedUser?.teamLineGroupId) {
              await lineService.sendMessageToGroup(
                assignedUser.teamLineGroupId,
                `🎉🍾 ปิดดีลสำเร็จ!
💼 ${deal.dealName}
💰 มูลค่า: ${deal.dealValue.toLocaleString()} บาท
🏆 ${assignedUser.firstName} ${assignedUser.lastName}

🎊 ยินดีด้วย! 🎊`
              );
            }
          }
        } else if (deal.dealStage === 'closed-lost') {
          if (deal.assignedTo && typeof deal.assignedTo === 'object' && 'toString' in deal.assignedTo) {
            await lineService.notifyDealUpdate(deal, deal.assignedTo.toString(), 'lost');
          }
        } else {
          if (deal.assignedTo && typeof deal.assignedTo === 'object' && 'toString' in deal.assignedTo) {
            await lineService.notifyDealUpdate(deal, deal.assignedTo.toString(), 'status_changed');
          }
        }
      }

      // Check for probability changes (significant = >20% change)
      if (Math.abs((originalDeal.probability || 0) - (deal.probability || 0)) >= 20) {
        significantChanges.push('probability');
        
        if (!significantChanges.includes('stage')) { // Don't double notify
          if (deal.assignedTo && typeof deal.assignedTo === 'object' && 'toString' in deal.assignedTo) {
            await lineService.notifyDealUpdate(deal, deal.assignedTo.toString(), 'updated');
          }
        }
      }

      // Check for value changes (significant = >10% change)
      const originalValue = originalDeal.dealValue || 0;
      const newValue = deal.dealValue || 0;
      if (originalValue > 0 && Math.abs(originalValue - newValue) / originalValue > 0.1) {
        significantChanges.push('value');
        
        if (!significantChanges.includes('stage') && !significantChanges.includes('probability')) {
          if (deal.assignedTo && typeof deal.assignedTo === 'object' && 'toString' in deal.assignedTo) {
            await lineService.notifyDealUpdate(deal, deal.assignedTo.toString(), 'updated');
          }
        }
      }

      if (significantChanges.length > 0) {
        console.log(`✅ LINE notification sent for deal update: ${deal.dealName} (${significantChanges.join(', ')} changed)`);
      }
      
    } catch (lineError) {
      console.error('❌ Failed to send LINE notification for deal update:', lineError);
      // Don't fail the request if LINE notification fails
    }

    res.json({
      success: true,
      data: deal,
      message: 'Deal updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating deal:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ 
        error: 'Validation failed', 
        details: errors,
        message: error.message 
      });
      return;
    }
    
    res.status(500).json({ 
      error: 'Failed to update deal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete deal
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const deal = await Deal.findByIdAndDelete(id);
    
    if (!deal) {
      res.status(404).json({ error: 'Deal not found' });
      return;
    }

    res.json({
      success: true,
      data: deal,
      message: 'Deal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting deal:', error);
    res.status(500).json({ 
      error: 'Failed to delete deal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Auto-fill deal from transcription
router.post('/:dealId/auto-fill', async (req: Request, res: Response): Promise<void> => {
  try {
    const { dealId } = req.params;
    const { transcription, language = 'th' } = req.body;

    if (!transcription) {
      res.status(400).json({ error: 'Transcription is required' });
      return;
    }

    // Extract CRM data from transcription using AI
    const extractedData = await extractCRMDataFromText(transcription, language);
    
    // Find existing deal
    const deal = await Deal.findById(dealId);
    if (!deal) {
      res.status(404).json({ error: 'Deal not found' });
      return;
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
      success: true,
      data: populatedDeal,
      suggestions: extractedData,
      message: 'AI suggestions generated successfully'
    });

  } catch (error) {
    console.error('Error in auto-fill from transcription:', error);
    res.status(500).json({ 
      error: 'Failed to process transcription',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Approve AI suggestions
router.post('/:dealId/approve-suggestions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { dealId } = req.params;
    const { selectedFields } = req.body;

    const deal = await Deal.findById(dealId);
    if (!deal) {
      res.status(404).json({ error: 'Deal not found' });
      return;
    }

    if (!deal.aiSuggestions) {
      res.status(400).json({ error: 'No AI suggestions found' });
      return;
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
      success: true,
      data: populatedDeal,
      message: 'AI suggestions applied successfully'
    });

  } catch (error) {
    console.error('Error approving AI suggestions:', error);
    res.status(500).json({ 
      error: 'Failed to approve suggestions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/deals/:dealId/summary - Get AI-generated summary for a deal
router.get('/:dealId/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const { dealId } = req.params;
    const deal = await Deal.findById(dealId);

    if (!deal) {
      res.status(404).json({ success: false, error: 'Deal not found' });
      return;
    }

    if (!deal.lastRecordingTranscription) {
      res.status(400).json({ success: false, error: 'No transcription available for this deal to summarize.'});
      return;
    }

    const language = deal.aiSuggestions?.suggestedFields?.language || 'th'; // Infer language or default
    const summarizationResult = await SummarizationService.summarizeText(deal.lastRecordingTranscription, language);

    // Optionally, save the summary to the deal document
    // deal.aiSuggestions = {
    //   ...(deal.aiSuggestions || { suggestedFields: {}, confidence: 0, extractedAt: new Date(), approved: false}),
    //   summary: summarizationResult.summary,
    //   summaryKeywords: summarizationResult.keywords
    // };
    // await deal.save(); // Uncomment if you want to persist the summary

    res.json({
      success: true,
      data: summarizationResult,
      message: 'Transcription summarized successfully'
    });

  } catch (error: any) {
    console.error('Error generating deal summary:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate summary',
      message: error.message 
    });
  }
});

// Helper function to extract CRM data from text
async function extractCRMDataFromText(text: string, language: string = 'th') {
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

export default router; 