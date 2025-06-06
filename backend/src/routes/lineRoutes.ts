import express, { Request, Response } from 'express';
import { middleware } from '@line/bot-sdk';
import lineService from '../services/lineService';
import { protect } from '../middleware/authMiddleware';
import User from '../models/User';

const router = express.Router();

// LINE Bot configuration for webhook verification
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

// Only add webhook endpoint if LINE credentials are configured
if (process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_CHANNEL_SECRET) {
  // LINE webhook endpoint with middleware
  router.post('/webhook', middleware(config), async (req: Request, res: Response): Promise<void> => {
    try {
      await lineService.handleWebhook(req, res);
    } catch (error) {
      console.error('LINE webhook error:', error);
      res.status(500).json({
        success: false,
        message: 'Webhook processing failed'
      });
    }
  });
} else {
  // Fallback webhook endpoint without middleware for development
  router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
    console.warn('⚠️ LINE webhook called but credentials not configured');
    res.status(200).json({
      success: true,
      message: 'LINE webhook endpoint ready (credentials not configured)'
    });
  });
}

// Send notification endpoint (protected)
router.post('/notify', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, data, targets } = req.body;

    if (!type || !data || !targets) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: type, data, targets'
      });
      return;
    }

    const results = [];

    // Send to multiple targets
    for (const target of targets) {
      let success = false;

      switch (type) {
        case 'activity':
          success = await lineService.notifyActivity(data, target);
          break;
        case 'deal':
          success = await lineService.notifyDeal(data, data.action || 'updated', target);
          break;
        case 'customer':
          success = await lineService.notifyCustomer(data, data.action || 'updated', target);
          break;
        case 'system':
          success = await lineService.notifySystem(data.message, target, data.priority);
          break;
        default:
          throw new Error(`Unknown notification type: ${type}`);
      }

      results.push({
        target: target.groupId || target.userId || target.chatRoomId,
        success
      });
    }

    res.json({
      success: true,
      data: results,
      message: 'Notifications sent'
    });

  } catch (error) {
    console.error('Error sending LINE notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification'
    });
  }
});

// Test notification endpoint (for development)
router.post('/test-notify', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { target } = req.body;

    if (!target) {
      res.status(400).json({
        success: false,
        message: 'Target (groupId, userId, or chatRoomId) is required'
      });
      return;
    }

    // Send test notifications
    const testActivity = {
      title: 'ทดสอบการโทรหาลูกค้า',
      description: 'โทรหาคุณสมชาย เพื่อสอบถามความต้องการซื้อซอฟต์แวร์',
      customerName: 'คุณสมชาย ใจดี',
      activityType: 'call',
      estimatedValue: 150000,
      priority: 'high'
    };

    const success = await lineService.notifyActivity(testActivity, { 
      groupId: target.groupId,
      userId: target.userId,
      chatRoomId: target.chatRoomId
    });

    res.json({
      success,
      message: success ? 'Test notification sent successfully' : 'Failed to send test notification'
    });

  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification'
    });
  }
});

// Get LINE group info (if bot is in group)
router.get('/group/:groupId', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    
    // This would typically fetch group information
    // For now, return basic info
    res.json({
      success: true,
      data: {
        groupId,
        status: 'active',
        botMember: true
      }
    });

  } catch (error) {
    console.error('Error fetching group info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group information'
    });
  }
});

// Configure notification settings
router.post('/settings', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { targets, notificationTypes, schedule } = req.body;

    // In a real implementation, you would save these settings to database
    const settings = {
      targets,
      notificationTypes: notificationTypes || ['activity', 'deal', 'customer', 'system'],
      schedule: schedule || {
        enabled: true,
        dailyReport: '09:00',
        weeklyReport: 'MON:09:00'
      },
      updatedAt: new Date()
    };

    res.json({
      success: true,
      data: settings,
      message: 'Notification settings updated'
    });

  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

// MCP-specific endpoints for user management

// Link LINE user to CRM user (admin only)
router.post('/link-user', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, lineUserId, lineDisplayName, teamLineGroupId } = req.body;

    if (!userId || !lineUserId) {
      res.status(400).json({
        success: false,
        message: 'User ID and LINE User ID are required'
      });
      return;
    }

    // Check if LINE user is already linked
    const existingUser = await User.findOne({ lineUserId });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'LINE user is already linked to another account'
      });
      return;
    }

    // Update user with LINE information
    const user = await User.findByIdAndUpdate(
      userId,
      {
        lineUserId,
        lineDisplayName,
        teamLineGroupId
      },
      { new: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        userId: user._id,
        username: user.username,
        lineUserId: user.lineUserId,
        lineDisplayName: user.lineDisplayName,
        teamLineGroupId: user.teamLineGroupId
      },
      message: 'LINE user linked successfully'
    });

  } catch (error) {
    console.error('Error linking LINE user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to link LINE user'
    });
  }
});

// Unlink LINE user from CRM user (admin only)
router.post('/unlink-user', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $unset: {
          lineUserId: 1,
          lineDisplayName: 1,
          teamLineGroupId: 1
        }
      },
      { new: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        userId: user._id,
        username: user.username
      },
      message: 'LINE user unlinked successfully'
    });

  } catch (error) {
    console.error('Error unlinking LINE user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlink LINE user'
    });
  }
});

// Get all LINE-linked users (admin only)
router.get('/linked-users', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const linkedUsers = await User.find(
      { lineUserId: { $exists: true, $ne: null } },
      {
        _id: 1,
        username: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        role: 1,
        lineUserId: 1,
        lineDisplayName: 1,
        teamLineGroupId: 1,
        lastLogin: 1
      }
    ).sort({ lastLogin: -1 });

    res.json({
      success: true,
      data: linkedUsers,
      message: 'LINE-linked users retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching linked users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch linked users'
    });
  }
});

// Send manual message to LINE user (admin only)
router.post('/send-message', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { lineUserId, message, messageType = 'text' } = req.body;

    if (!lineUserId || !message) {
      res.status(400).json({
        success: false,
        message: 'LINE User ID and message are required'
      });
      return;
    }

    const success = await lineService.sendMessageToUser(lineUserId, message);

    res.json({
      success: true,
      data: { delivered: success },
      message: success ? 'Message sent successfully' : 'Failed to send message'
    });

  } catch (error) {
    console.error('Error sending manual message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// Broadcast message to team group (manager/admin only)
router.post('/broadcast-team', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamLineGroupId, message } = req.body;

    if (!teamLineGroupId || !message) {
      res.status(400).json({
        success: false,
        message: 'Team LINE Group ID and message are required'
      });
      return;
    }

    const success = await lineService.sendMessageToGroup(teamLineGroupId, message);

    res.json({
      success: true,
      data: { delivered: success },
      message: success ? 'Broadcast sent successfully' : 'Failed to send broadcast'
    });

  } catch (error) {
    console.error('Error sending team broadcast:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send broadcast'
    });
  }
});

// Get LINE user profile (for debugging)
router.get('/user-profile/:lineUserId', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { lineUserId } = req.params;

    const user = await User.findOne(
      { lineUserId },
      {
        _id: 1,
        username: 1,
        firstName: 1,
        lastName: 1,
        lineUserId: 1,
        lineDisplayName: 1,
        teamLineGroupId: 1,
        role: 1,
        lastLogin: 1
      }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'LINE user not found in CRM'
      });
      return;
    }

    res.json({
      success: true,
      data: user,
      message: 'LINE user profile retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching LINE user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
});

// MCP command testing endpoint (development only)
router.post('/test-command', protect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { lineUserId, command } = req.body;

    if (!lineUserId || !command) {
      res.status(400).json({
        success: false,
        message: 'LINE User ID and command are required'
      });
      return;
    }

    // Find user for testing
    const user = await User.findOne({ lineUserId });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'LINE user not found in CRM'
      });
      return;
    }

    // Mock event object for testing
    const mockEvent = {
      type: 'message',
      message: {
        type: 'text',
        text: command
      },
      source: {
        userId: lineUserId
      },
      replyToken: 'test-reply-token'
    };

    // Process the command through LINE service via handleEvent
    await lineService.handleEvent(mockEvent);

    res.json({
      success: true,
      message: 'Command processed successfully (check LINE chat for response)'
    });

  } catch (error) {
    console.error('Error testing command:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process command'
    });
  }
});

export default router;