import { Router, Request, Response } from 'express';
import SalesActivity, { ISalesActivity } from '../models/SalesActivity';
import User from '../models/User';
import AIClassificationService from '../services/aiClassificationService';
import ScoringService from '../services/scoringService';
import LogService from '../services/logService';
import lineService from '../services/lineService';

const router = Router();

// Get all activities
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, activityType, limit = 50, page = 1 } = req.query;
    
    // Build filter object
    const filter: any = {};
    if (status) filter.status = status;
    if (activityType) filter.activityType = activityType;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const activities = await SalesActivity
      .find(filter)
      .populate('createdBy', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip);
    
    const total = await SalesActivity.countDocuments(filter);
    
    res.json({
      success: true,
      data: activities,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    
    // Log error
    await LogService.error(
      'ACTIVITIES_FETCH_ERROR',
      `Failed to fetch activities: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        requestQuery: req.query,
        errorStack: error instanceof Error ? error.stack : null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );
    
    res.status(500).json({ 
      error: 'Failed to fetch activities',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get activity by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const activity = await SalesActivity
      .findById(id)
      .populate('createdBy', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username');
    
    if (!activity) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }
    
    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Failed to fetch activity:', error);
    res.status(500).json({ 
      error: 'Failed to fetch activity',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new activity
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      customerName,
      contactInfo,
      activityType,
      status = 'pending',
      priority = 'medium',
      audioUrl,
      audioFileName,
      transcription,
      transcriptionLanguage,
      transcriptionConfidence,
      transcriptionDuration,
      actionItems = [],
      tags = [],
      assignedTo,
      dueDate,
      estimatedValue,
      notes
    } = req.body;

    if (!title || !customerName || !activityType) {
      res.status(400).json({ 
        error: 'Missing required fields: title, customerName, activityType' 
      });
      return;
    }

    // For now, use the first admin user as createdBy
    // In a real app, this would come from authentication middleware
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      res.status(500).json({ error: 'No admin user found' });
      return;
    }

    const newActivity = new SalesActivity({
      title,
      description,
      customerName,
      contactInfo,
      activityType,
      status,
      priority,
      audioUrl,
      audioFileName,
      transcription,
      transcriptionLanguage,
      transcriptionConfidence,
      transcriptionDuration,
      actionItems,
      tags,
      assignedTo: assignedTo || adminUser._id,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      estimatedValue,
      notes,
      createdBy: adminUser._id
    });

    const savedActivity = await newActivity.save();
    
    // Log activity creation
    await LogService.info(
      'ACTIVITY_CREATED',
      `New activity created: ${savedActivity.title}`,
      {
        activityId: savedActivity._id,
        activityType: savedActivity.activityType,
        customerName: savedActivity.customerName,
        category: savedActivity.category,
        estimatedValue: savedActivity.estimatedValue,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      adminUser._id.toString()
    );
    
    // Populate the saved activity
    const populatedActivity = await SalesActivity
      .findById(savedActivity._id)
      .populate('createdBy', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username');

    // 🚀 LINE NOTIFICATION for regular activities
    try {
      // Check if this is a high-value or important activity
      const isImportant = estimatedValue > 100000 || 
                          priority === 'high' || 
                          ['demo', 'proposal', 'negotiation'].includes(activityType);

      if (isImportant) {
        // Find assigned user for notification
        const assignedUser = await User.findById(savedActivity.assignedTo);
        if (assignedUser?.lineUserId) {
          await lineService.sendMessageToUser(
            assignedUser.lineUserId,
            `🎯 กิจกรรมสำคัญใหม่
📋 ${savedActivity.title}
👤 ลูกค้า: ${savedActivity.customerName}
📊 ประเภท: ${activityType}
💰 มูลค่าประเมิน: ${estimatedValue ? estimatedValue.toLocaleString() + ' บาท' : 'ไม่ระบุ'}
⏰ กำหนดส่ง: ${dueDate ? new Date(dueDate).toLocaleDateString('th-TH') : 'ไม่ระบุ'}

🔗 ดูรายละเอียดในแอป CRM`
          );
          console.log(`✅ LINE notification sent for important activity: ${savedActivity.title}`);
        }
      }
    } catch (lineError) {
      console.error('❌ Failed to send LINE notification for activity:', lineError);
      // Don't fail the request if LINE notification fails
    }

    res.status(201).json({
      success: true,
      data: populatedActivity,
      message: 'Activity created successfully'
    });
  } catch (error) {
    console.error('Failed to create activity:', error);
    res.status(500).json({ 
      error: 'Failed to create activity',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update activity
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const updatedActivity = await SalesActivity
      .findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
      .populate('createdBy', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username');
    
    if (!updatedActivity) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }

    res.json({
      success: true,
      data: updatedActivity,
      message: 'Activity updated successfully'
    });
  } catch (error) {
    console.error('Failed to update activity:', error);
    res.status(500).json({ 
      error: 'Failed to update activity',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete activity
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const deletedActivity = await SalesActivity.findByIdAndDelete(id);
    
    if (!deletedActivity) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }

    res.json({
      success: true,
      data: deletedActivity,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete activity:', error);
    res.status(500).json({ 
      error: 'Failed to delete activity',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Search activities
router.get('/search/:query', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.params;
    const { limit = 20 } = req.query;
    
    const activities = await SalesActivity
      .find({
        $text: { $search: query }
      })
      .populate('createdBy', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username')
      .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: activities,
      total: activities.length,
      query
    });
  } catch (error) {
    console.error('Failed to search activities:', error);
    res.status(500).json({ 
      error: 'Failed to search activities',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create activity from voice recording with AI enhancement
router.post('/from-voice', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      audioUrl,
      audioFileName,
      audioFileSize,
      audioStoragePath,
      transcription,
      transcriptionLanguage,
      transcriptionConfidence,
      transcriptionDuration,
      isEnhanced,
      customerInfo,
      dealInfo,
      actionItems: extractedActionItems,
      summary,
      title,
      customerName,
      extractedData
    } = req.body;

    if (!transcription) {
      res.status(400).json({ error: 'Transcription is required' });
      return;
    }

    // Auto-generate title if not provided
    const autoTitle = title || `บันทึกเสียง - ${new Date().toLocaleDateString('th-TH')}`;
    
    // Auto-extract customer name from AI data or use provided
    const autoCustomerName = customerName || 
                             customerInfo?.name || 
                             extractedData?.customerName || 
                             'ลูกค้าจากการบันทึกเสียง';

    // Get admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      res.status(500).json({ error: 'No admin user found' });
      return;
    }

    // Create initial activity
    const newActivity = new SalesActivity({
      title: autoTitle,
      description: summary || transcription,
      customerName: autoCustomerName,
      contactInfo: customerInfo?.email || customerInfo?.phone || extractedData?.contactInfo || '',
      activityType: 'voice-note',
      status: 'pending',
      priority: extractedData?.priority || 'medium',
      
      // Enhanced audio storage
      audioUrl,
      audioFileName,
      audioFileSize,
      audioStoragePath,
      
      // Enhanced transcription data
      transcription,
      transcriptionLanguage: transcriptionLanguage || 'th',
      transcriptionConfidence,
      transcriptionDuration,
      isEnhanced: isEnhanced || false,
      customerInfo: customerInfo || {},
      dealInfo: dealInfo || {},
      
      // Initial category (will be updated by AI)
      category: 'qualification',
      activityScore: 0,
      
      actionItems: extractedActionItems || extractedData?.actionItems || [],
      tags: ['voice-recording', ...(extractedData?.tags || [])],
      estimatedValue: dealInfo?.value ? parseFloat(dealInfo.value.replace(/[^\d.]/g, '')) : extractedData?.estimatedValue,
      notes: extractedData?.notes || 'สร้างจากการบันทึกเสียงอัตโนมัติ',
      createdBy: adminUser._id,
      assignedTo: adminUser._id
    });

    // Apply AI classification and scoring
    try {
      const enhancedActivity = await AIClassificationService.updateActivityWithClassification(newActivity);
      const savedActivity = await enhancedActivity.save();
      
      // Log enhanced voice activity creation
      await LogService.info(
        'VOICE_ACTIVITY_CREATED',
        `Voice recording converted to activity with AI enhancement: ${savedActivity.title}`,
        {
          activityId: savedActivity._id,
          transcriptionLength: transcription.length,
          transcriptionConfidence,
          transcriptionDuration,
          audioFileName,
          aiClassification: savedActivity.aiClassification ? {
            category: savedActivity.aiClassification.suggestedCategory,
            confidence: savedActivity.aiClassification.confidence
          } : null,
          activityScore: savedActivity.activityScore,
          category: savedActivity.category,
          estimatedValue: savedActivity.estimatedValue,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        adminUser._id.toString()
      );
      
      // Populate the saved activity
      const populatedActivity = await SalesActivity
        .findById(savedActivity._id)
        .populate('createdBy', 'firstName lastName username')
        .populate('assignedTo', 'firstName lastName username');

      // 🚀 VOICE-TO-LINE NOTIFICATION PIPELINE
      try {
        // Notify the user who created the voice recording
        await lineService.notifyVoiceActivity({
          userId: savedActivity.createdBy,
          title: savedActivity.title,
          summary: summary || transcription.substring(0, 200),
          customerName: autoCustomerName,
          transcription: transcription,
          isImportant: savedActivity.activityScore > 70 || (savedActivity.estimatedValue && savedActivity.estimatedValue > 50000)
        });

        console.log(`✅ LINE notification sent for voice activity: ${savedActivity.title}`);
      } catch (lineError) {
        console.error('❌ Failed to send LINE notification for voice activity:', lineError);
        // Don't fail the request if LINE notification fails
      }

      res.status(201).json({
        success: true,
        data: populatedActivity,
        message: 'Enhanced activity created from voice recording successfully'
      });
      
    } catch (aiError) {
      console.log('AI enhancement failed, saving basic activity:', aiError);
      
      // Log AI enhancement failure
      await LogService.warning(
        'AI_ENHANCEMENT_FAILED',
        `AI enhancement failed for voice activity, saving basic version: ${aiError}`,
        {
          transcriptionLength: transcription.length,
          audioFileName,
          error: aiError instanceof Error ? aiError.message : String(aiError),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        adminUser._id.toString()
      );
      
      // Save basic activity without AI enhancement
      const savedActivity = await newActivity.save();
      
      // Log basic voice activity creation
      await LogService.info(
        'VOICE_ACTIVITY_CREATED_BASIC',
        `Voice recording converted to basic activity: ${savedActivity.title}`,
        {
          activityId: savedActivity._id,
          transcriptionLength: transcription.length,
          transcriptionDuration,
          audioFileName,
          category: savedActivity.category,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        adminUser._id.toString()
      );
      
      const populatedActivity = await SalesActivity
        .findById(savedActivity._id)
        .populate('createdBy', 'firstName lastName username')
        .populate('assignedTo', 'firstName lastName username');

      // 🚀 VOICE-TO-LINE NOTIFICATION PIPELINE (Basic Activity)
      try {
        // Notify the user who created the voice recording
        await lineService.notifyVoiceActivity({
          userId: savedActivity.createdBy,
          title: savedActivity.title,
          summary: summary || transcription.substring(0, 200),
          customerName: autoCustomerName,
          transcription: transcription,
          isImportant: savedActivity.estimatedValue && savedActivity.estimatedValue > 50000
        });

        console.log(`✅ LINE notification sent for basic voice activity: ${savedActivity.title}`);
      } catch (lineError) {
        console.error('❌ Failed to send LINE notification for basic voice activity:', lineError);
        // Don't fail the request if LINE notification fails
      }

      res.status(201).json({
        success: true,
        data: populatedActivity,
        message: 'Activity created from voice recording successfully'
      });
    }
    
  } catch (error) {
    console.error('Failed to create activity from voice:', error);
    res.status(500).json({ 
      error: 'Failed to create activity from voice recording',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user performance metrics
router.get('/performance/user/:userId?', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    
    // Use admin user if no userId provided
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      res.status(500).json({ error: 'No admin user found' });
      return;
    }
    
    const targetUserId = userId || adminUser._id;
    
    // Get activities for the user within the specified time period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    
    const activities = await SalesActivity
      .find({
        createdBy: targetUserId,
        createdAt: { $gte: startDate }
      })
      .sort({ createdAt: -1 });
    
    if (activities.length === 0) {
      res.json({
        success: true,
        data: {
          userId: targetUserId,
          totalScore: 0,
          averageActivityScore: 0,
          activityCount: 0,
          categoryScores: {},
          trends: { last7Days: 0, last30Days: 0, growth: 0 },
          rank: 0,
          level: 'Beginner'
        }
      });
      return;
    }
    
    // Calculate performance using scoring service
    const performance = ScoringService.calculateUserPerformance(activities);
    
    res.json({
      success: true,
      data: performance
    });
    
  } catch (error) {
    console.error('Failed to get user performance:', error);
    res.status(500).json({
      error: 'Failed to get user performance',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get activity scoring breakdown
router.get('/score/:activityId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { activityId } = req.params;
    
    const activity = await SalesActivity.findById(activityId);
    if (!activity) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }
    
    const scoreBreakdown = ScoringService.calculateActivityScore(activity);
    
    res.json({
      success: true,
      data: scoreBreakdown
    });
    
  } catch (error) {
    console.error('Failed to get activity score:', error);
    res.status(500).json({
      error: 'Failed to get activity score',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Confirm AI classification by human
router.put('/:id/confirm-classification', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { confirmed, updates } = req.body;
    
    const activity = await SalesActivity.findById(id);
    if (!activity) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }
    
    // Get admin user for reviewedBy field
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      res.status(500).json({ error: 'No admin user found' });
      return;
    }
    
    // Update AI classification confirmation
    if (activity.aiClassification) {
      activity.aiClassification.humanConfirmed = confirmed;
      activity.aiClassification.reviewedBy = adminUser._id as any;
      activity.aiClassification.reviewedAt = new Date();
      
      // Apply any manual updates
      if (updates) {
        if (updates.category) {
          activity.category = updates.category;
          activity.aiClassification.suggestedCategory = updates.category;
        }
        if (updates.subCategory) {
          activity.subCategory = updates.subCategory;
          activity.aiClassification.suggestedSubCategory = updates.subCategory;
        }
        if (updates.customerInfo) {
          activity.customerInfo = { ...activity.customerInfo, ...updates.customerInfo };
        }
        if (updates.dealInfo) {
          activity.dealInfo = { ...activity.dealInfo, ...updates.dealInfo };
        }
        if (updates.actionItems) {
          activity.actionItems = updates.actionItems;
        }
      }
    }
    
    // Recalculate score with updated data
    const scoreResult = ScoringService.calculateActivityScore(activity);
    activity.activityScore = scoreResult.totalScore;
    
    await activity.save();
    
    // Log AI classification confirmation
    await LogService.info(
      'AI_CLASSIFICATION_REVIEWED',
      `AI classification ${confirmed ? 'confirmed' : 'rejected'} for activity: ${activity.title}`,
      {
        activityId: activity._id,
        confirmed,
        reviewerUserId: adminUser._id,
        aiClassification: activity.aiClassification ? {
          suggestedCategory: activity.aiClassification.suggestedCategory,
          confidence: activity.aiClassification.confidence,
          previouslyConfirmed: activity.aiClassification.humanConfirmed
        } : null,
        updates: updates || null,
        newActivityScore: activity.activityScore,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      adminUser._id.toString()
    );
    
    const populatedActivity = await SalesActivity
      .findById(activity._id)
      .populate('createdBy', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username');
    
    res.json({
      success: true,
      data: populatedActivity,
      message: `AI classification ${confirmed ? 'confirmed' : 'rejected'} successfully`
    });
    
  } catch (error) {
    console.error('Failed to confirm AI classification:', error);
    res.status(500).json({
      error: 'Failed to confirm AI classification',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get pending AI classifications for review
router.get('/pending-review', async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;
    
    const pendingActivities = await SalesActivity
      .find({
        'aiClassification.humanConfirmed': false,
        'aiClassification': { $exists: true }
      })
      .populate('createdBy', 'firstName lastName username')
      .populate('assignedTo', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    
    res.json({
      success: true,
      data: pendingActivities,
      total: pendingActivities.length
    });
    
  } catch (error) {
    console.error('Failed to get pending classifications:', error);
    res.status(500).json({
      error: 'Failed to get pending classifications',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get dashboard analytics data
router.get('/analytics/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const { months = 12 } = req.query;
    
    // Get admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      res.status(500).json({ error: 'No admin user found' });
      return;
    }
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Number(months));
    
    // Get all activities within date range
    const activities = await SalesActivity.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: 1 });
    
    // Monthly data aggregation
    const monthlyData = [];
    for (let i = Number(months) - 1; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);
      
      const monthActivities = activities.filter(activity => {
        const activityDate = new Date(activity.createdAt);
        return activityDate >= monthStart && activityDate <= monthEnd;
      });
      
      const monthName = monthStart.toLocaleDateString('th-TH', { month: 'short' });
      const totalScore = monthActivities.reduce((sum, activity) => sum + (activity.activityScore || 0), 0);
      const averageScore = monthActivities.length > 0 ? totalScore / monthActivities.length : 0;
      const estimatedValue = monthActivities.reduce((sum, activity) => sum + (activity.estimatedValue || 0), 0);
      
      monthlyData.push({
        month: monthName,
        activityCount: monthActivities.length,
        averageScore: Math.round(averageScore),
        totalScore: Math.round(totalScore),
        estimatedValue: estimatedValue,
        completedActivities: monthActivities.filter(a => a.status === 'completed').length
      });
    }
    
    // Category breakdown
    const categoryBreakdown: any = {};
    activities.forEach(activity => {
      const category = activity.category || 'uncategorized';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          count: 0,
          totalScore: 0,
          averageScore: 0,
          estimatedValue: 0
        };
      }
      categoryBreakdown[category].count += 1;
      categoryBreakdown[category].totalScore += activity.activityScore || 0;
      categoryBreakdown[category].estimatedValue += activity.estimatedValue || 0;
    });
    
    // Calculate averages for categories
    Object.keys(categoryBreakdown).forEach(category => {
      const data = categoryBreakdown[category];
      data.averageScore = data.count > 0 ? Math.round(data.totalScore / data.count) : 0;
    });
    
    // Overall statistics
    const totalActivities = activities.length;
    const completedActivities = activities.filter(a => a.status === 'completed').length;
    const pendingActivities = activities.filter(a => a.status === 'pending').length;
    const totalEstimatedValue = activities.reduce((sum, a) => sum + (a.estimatedValue || 0), 0);
    const averageActivityScore = totalActivities > 0 ? 
      activities.reduce((sum, a) => sum + (a.activityScore || 0), 0) / totalActivities : 0;
    
    // Recent activity performance
    const last7Days = activities.filter(a => {
      const activityDate = new Date(a.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return activityDate >= weekAgo;
    });
    
    const last30Days = activities.filter(a => {
      const activityDate = new Date(a.createdAt);
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return activityDate >= monthAgo;
    });
    
    res.json({
      success: true,
      data: {
        overview: {
          totalActivities,
          completedActivities,
          pendingActivities,
          totalEstimatedValue,
          averageActivityScore: Math.round(averageActivityScore),
          completionRate: totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0
        },
        monthlyData,
        categoryBreakdown,
        trends: {
          last7Days: last7Days.length,
          last30Days: last30Days.length,
          growth: last30Days.length > 0 ? 
            Math.round(((last7Days.length - (last30Days.length - last7Days.length)) / (last30Days.length - last7Days.length)) * 100) : 0
        },
        recentActivities: activities.slice(-5).reverse().map(activity => ({
          id: activity._id,
          title: activity.title,
          customerName: activity.customerName,
          category: activity.category,
          activityScore: activity.activityScore,
          createdAt: activity.createdAt,
          status: activity.status
        }))
      }
    });
    
  } catch (error) {
    console.error('Failed to get dashboard analytics:', error);
    
    // Log analytics error
    await LogService.error(
      'DASHBOARD_ANALYTICS_ERROR',
      `Failed to get dashboard analytics: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        requestedMonths: req.query.months || 12,
        errorStack: error instanceof Error ? error.stack : null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );
    
    res.status(500).json({
      error: 'Failed to get dashboard analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 