import { Client, Message, FlexMessage, FlexBox, FlexText, FlexButton, FlexImage, FlexSeparator } from '@line/bot-sdk';
import { Request, Response } from 'express';

// LINE Bot configuration
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || 'dummy-token-for-development',
  channelSecret: process.env.LINE_CHANNEL_SECRET || 'dummy-secret-for-development',
};

// Only create client if we have real credentials
const client = process.env.LINE_CHANNEL_ACCESS_TOKEN ? new Client(config) : null;

export interface NotificationData {
  type: 'activity' | 'deal' | 'customer' | 'system';
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
}

export interface FlexNotificationOptions {
  groupId?: string;
  userId?: string;
  chatRoomId?: string;
}

class LineService {
  private client: Client | null;

  constructor() {
    this.client = client;
  }

  // Send notification to LINE group/chat with Flex Message
  async sendNotification(
    notification: NotificationData,
    options: FlexNotificationOptions
  ): Promise<boolean> {
    try {
      if (!this.client) {
        console.warn('⚠️ LINE client not configured - notification skipped');
        return false;
      }

      const flexMessage = this.createFlexMessage(notification);
      
      if (options.groupId) {
        await this.client.pushMessage(options.groupId, flexMessage);
      } else if (options.userId) {
        await this.client.pushMessage(options.userId, flexMessage);
      } else if (options.chatRoomId) {
        await this.client.pushMessage(options.chatRoomId, flexMessage);
      } else {
        throw new Error('No target specified for notification');
      }

      console.log('✅ LINE notification sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to send LINE notification:', error);
      return false;
    }
  }

  // Create Flex Message for different notification types
  private createFlexMessage(notification: NotificationData): FlexMessage {
    const { type, title, message, data, priority = 'medium', actionUrl } = notification;
    
    const priorityColors = {
      low: '#6B7280',
      medium: '#3B82F6',
      high: '#F59E0B',
      urgent: '#EF4444'
    };

    const priorityIcons = {
      low: '📋',
      medium: '📊',
      high: '⚠️',
      urgent: '🚨'
    };

    const typeIcons = {
      activity: '🎤',
      deal: '💼',
      customer: '👥',
      system: '⚙️'
    };

    const headerColor = priorityColors[priority];
    const priorityIcon = priorityIcons[priority];
    const typeIcon = typeIcons[type];

    // Basic flex message structure
    const flexContent: FlexBox = {
      type: 'box',
      layout: 'vertical',
      contents: [
        // Header
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: `${typeIcon} ${title}`,
              weight: 'bold',
              size: 'lg',
              color: '#FFFFFF',
              flex: 1
            },
            {
              type: 'text',
              text: priorityIcon,
              size: 'lg',
              align: 'end'
            }
          ],
          backgroundColor: headerColor,
          paddingAll: '15px',
          cornerRadius: '8px'
        },
        
        // Content
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: message,
              wrap: true,
              size: 'md',
              color: '#333333',
              margin: 'md'
            }
          ],
          paddingAll: '15px'
        }
      ],
      backgroundColor: '#FFFFFF',
      cornerRadius: '10px'
    };

    // Add data section if available
    if (data) {
      const dataContents = this.createDataSection(type, data);
      if (dataContents.length > 0) {
        flexContent.contents.push(
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: dataContents,
            paddingAll: '15px'
          }
        );
      }
    }

    // Add action button if URL provided
    if (actionUrl) {
      flexContent.contents.push(
        {
          type: 'separator',
          margin: 'md'
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                label: '📱 เปิดแอป',
                uri: actionUrl
              },
              style: 'primary',
              color: headerColor,
              flex: 1
            }
          ],
          paddingAll: '15px'
        }
      );
    }

    // Add timestamp
    flexContent.contents.push(
      {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'text',
            text: `🕐 ${new Date().toLocaleString('th-TH')}`,
            size: 'xs',
            color: '#999999',
            align: 'end'
          }
        ],
        paddingAll: '10px'
      }
    );

    return {
      type: 'flex',
      altText: `${typeIcon} ${title}: ${message}`,
      contents: {
        type: 'bubble',
        body: flexContent
      }
    };
  }

  // Create data section based on notification type
  private createDataSection(type: string, data: any): any[] {
    const contents: any[] = [];

    switch (type) {
      case 'activity':
        if (data.customerName) {
          contents.push({
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '👤 ลูกค้า:',
                size: 'sm',
                color: '#666666',
                flex: 1
              },
              {
                type: 'text',
                text: data.customerName,
                size: 'sm',
                weight: 'bold',
                flex: 2,
                wrap: true
              }
            ],
            margin: 'sm'
          });
        }

        if (data.activityType) {
          contents.push({
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '📋 ประเภท:',
                size: 'sm',
                color: '#666666',
                flex: 1
              },
              {
                type: 'text',
                text: this.getActivityTypeLabel(data.activityType),
                size: 'sm',
                flex: 2
              }
            ],
            margin: 'sm'
          });
        }

        if (data.estimatedValue) {
          contents.push({
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '💰 มูลค่า:',
                size: 'sm',
                color: '#666666',
                flex: 1
              },
              {
                type: 'text',
                text: `฿${data.estimatedValue.toLocaleString()}`,
                size: 'sm',
                weight: 'bold',
                color: '#10B981',
                flex: 2
              }
            ],
            margin: 'sm'
          });
        }
        break;

      case 'deal':
        if (data.customerName) {
          contents.push({
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '🏢 ลูกค้า:',
                size: 'sm',
                color: '#666666',
                flex: 1
              },
              {
                type: 'text',
                text: data.customerName,
                size: 'sm',
                weight: 'bold',
                flex: 2,
                wrap: true
              }
            ],
            margin: 'sm'
          });
        }

        if (data.value) {
          contents.push({
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '💵 มูลค่า:',
                size: 'sm',
                color: '#666666',
                flex: 1
              },
              {
                type: 'text',
                text: `฿${data.value.toLocaleString()}`,
                size: 'sm',
                weight: 'bold',
                color: '#10B981',
                flex: 2
              }
            ],
            margin: 'sm'
          });
        }

        if (data.status) {
          contents.push({
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '📊 สถานะ:',
                size: 'sm',
                color: '#666666',
                flex: 1
              },
              {
                type: 'text',
                text: this.getDealStatusLabel(data.status),
                size: 'sm',
                flex: 2
              }
            ],
            margin: 'sm'
          });
        }

        if (data.probability) {
          contents.push({
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '🎯 โอกาส:',
                size: 'sm',
                color: '#666666',
                flex: 1
              },
              {
                type: 'text',
                text: `${data.probability}%`,
                size: 'sm',
                weight: 'bold',
                color: data.probability >= 70 ? '#10B981' : data.probability >= 40 ? '#F59E0B' : '#EF4444',
                flex: 2
              }
            ],
            margin: 'sm'
          });
        }
        break;

      case 'customer':
        if (data.name) {
          contents.push({
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '👤 ชื่อ:',
                size: 'sm',
                color: '#666666',
                flex: 1
              },
              {
                type: 'text',
                text: data.name,
                size: 'sm',
                weight: 'bold',
                flex: 2,
                wrap: true
              }
            ],
            margin: 'sm'
          });
        }

        if (data.company) {
          contents.push({
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '🏢 บริษัท:',
                size: 'sm',
                color: '#666666',
                flex: 1
              },
              {
                type: 'text',
                text: data.company,
                size: 'sm',
                flex: 2,
                wrap: true
              }
            ],
            margin: 'sm'
          });
        }

        if (data.status) {
          contents.push({
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '📊 สถานะ:',
                size: 'sm',
                color: '#666666',
                flex: 1
              },
              {
                type: 'text',
                text: this.getCustomerStatusLabel(data.status),
                size: 'sm',
                flex: 2
              }
            ],
            margin: 'sm'
          });
        }
        break;
    }

    return contents;
  }

  // Helper methods for labels
  private getActivityTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'call': '📞 โทรศัพท์',
      'meeting': '🤝 ประชุม',
      'email': '📧 อีเมล',
      'voice-note': '🎙️ บันทึกเสียง',
      'demo': '💻 เดโม',
      'proposal': '📄 เสนอราคา',
      'negotiation': '🤝 เจรจา',
      'follow-up-call': '📞 ติดตาม',
      'site-visit': '🏢 เยี่ยมชม'
    };
    return labels[type] || type;
  }

  private getDealStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'lead': '🎯 ลีด',
      'qualified': '✅ คัดกรองแล้ว',
      'proposal': '📄 เสนอราคา',
      'negotiation': '🤝 เจรจา',
      'won': '🎉 ปิดสำเร็จ',
      'lost': '❌ เสียโอกาส',
      'active': '🔄 ดำเนินการ'
    };
    return labels[status] || status;
  }

  private getCustomerStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'lead': '🎯 ลีด',
      'prospect': '👀 Prospect',
      'active_customer': '✅ ลูกค้า',
      'inactive_customer': '😴 ไม่ใช้งาน',
      'former_customer': '👋 ลูกค้าเก่า'
    };
    return labels[status] || status;
  }

  // Send activity notification
  async notifyActivity(activity: any, options: FlexNotificationOptions): Promise<boolean> {
    const notification: NotificationData = {
      type: 'activity',
      title: 'กิจกรรมใหม่',
      message: `${activity.title} - ${activity.description}`,
      data: {
        customerName: activity.customerName,
        activityType: activity.activityType,
        estimatedValue: activity.estimatedValue
      },
      priority: activity.priority || 'medium',
      actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3999'}/activities`
    };

    return this.sendNotification(notification, options);
  }

  // Send deal notification
  async notifyDeal(deal: any, action: string, options: FlexNotificationOptions): Promise<boolean> {
    const actionLabels: { [key: string]: string } = {
      'created': 'สร้างดีลใหม่',
      'updated': 'อัปเดตดีล',
      'status_changed': 'เปลี่ยนสถานะดีล',
      'won': 'ปิดดีลสำเร็จ',
      'lost': 'เสียโอกาสดีล'
    };

    const notification: NotificationData = {
      type: 'deal',
      title: actionLabels[action] || 'อัปเดตดีล',
      message: `${deal.title} - ${deal.description}`,
      data: {
        customerName: deal.customerName,
        value: deal.value,
        status: deal.status,
        probability: deal.probability
      },
      priority: action === 'won' ? 'high' : action === 'lost' ? 'medium' : 'medium',
      actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3999'}/deals`
    };

    return this.sendNotification(notification, options);
  }

  // Send customer notification
  async notifyCustomer(customer: any, action: string, options: FlexNotificationOptions): Promise<boolean> {
    const actionLabels: { [key: string]: string } = {
      'created': 'เพิ่มลูกค้าใหม่',
      'updated': 'อัปเดตข้อมูลลูกค้า',
      'status_changed': 'เปลี่ยนสถานะลูกค้า'
    };

    const notification: NotificationData = {
      type: 'customer',
      title: actionLabels[action] || 'อัปเดตลูกค้า',
      message: `${customer.name} ${customer.company ? `- ${customer.company}` : ''}`,
      data: {
        name: customer.name,
        company: customer.company,
        status: customer.status
      },
      priority: 'medium',
      actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3999'}/customers`
    };

    return this.sendNotification(notification, options);
  }

  // Send system notification
  async notifySystem(message: string, options: FlexNotificationOptions, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'): Promise<boolean> {
    const notification: NotificationData = {
      type: 'system',
      title: 'การแจ้งเตือนระบบ',
      message,
      priority,
      actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3999'}`
    };

    return this.sendNotification(notification, options);
  }

  // Handle LINE webhook events
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const events = req.body.events;

      for (const event of events) {
        await this.handleEvent(event);
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('❌ LINE webhook error:', error);
      res.status(500).send('Error');
    }
  }

  // Handle individual LINE events
  async handleEvent(event: any): Promise<void> {
    console.log('📨 LINE event received:', event.type);

    switch (event.type) {
      case 'message':
        await this.handleMessage(event);
        break;
      case 'follow':
        await this.handleFollow(event);
        break;
      case 'unfollow':
        await this.handleUnfollow(event);
        break;
      case 'join':
        await this.handleJoin(event);
        break;
      case 'leave':
        await this.handleLeave(event);
        break;
      default:
        console.log('🤷‍♂️ Unknown event type:', event.type);
    }
  }

  // Handle incoming messages with advanced AI command processing
  private async handleMessage(event: any): Promise<void> {
    const { message, source, replyToken } = event;
    
    if (message.type === 'text') {
      const text = message.text.trim();
      const userId = source.userId;
      
      try {
        // Find user by LINE ID for advanced features
        const User = require('../models/User').default;
        const user = await User.findOne({ lineUserId: userId });
        
        if (!user && !this.isBasicCommand(text)) {
          await this.replyMessage(replyToken, 'กรุณาลงทะเบียนผู้ใช้ในระบบ CRM ก่อนใช้งาน\n\nติดต่อผู้ดูแลระบบเพื่อเชื่อมโยง LINE ID ของคุณ\nLINE ID: ' + userId);
          return;
        }

        // Process advanced commands if user is registered
        if (user) {
          const response = await this.processAdvancedCommand(text, user, replyToken);
          if (response) return; // Command was handled
        }

        // Fall back to basic commands
        await this.processBasicCommand(text.toLowerCase(), source, replyToken);
        
      } catch (error) {
        console.error('Error handling message:', error);
        await this.replyMessage(replyToken, 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    }
  }

  // Check if command is basic (doesn't require user registration)
  private isBasicCommand(text: string): boolean {
    const basicCommands = ['สถานะ', 'status', 'รายงาน', 'report', 'ช่วยเหลือ', 'help'];
    const lowerText = text.toLowerCase();
    return basicCommands.some(cmd => lowerText.includes(cmd));
  }

  // Process advanced AI commands
  private async processAdvancedCommand(text: string, user: any, replyToken: string): Promise<boolean> {
    const command = text.toLowerCase();

    // Help command
    if (command === '/help' || command === '/ช่วยเหลือ' || command.includes('ช่วยเหลือ')) {
      await this.replyMessage(replyToken, this.getAdvancedHelpMessage());
      return true;
    }

    // Customer query: /ลูกค้า [ชื่อ] or /customer [name]
    if (command.startsWith('/ลูกค้า ') || command.startsWith('/customer ')) {
      const customerName = command.replace(/^\/(ลูกค้า|customer)\s+/, '');
      const response = await this.getCustomer360(customerName, user);
      await this.replyMessage(replyToken, response);
      return true;
    }

    // Deal query: /ดีล [ชื่อ] or /deal [name]
    if (command.startsWith('/ดีล ') || command.startsWith('/deal ')) {
      const dealName = command.replace(/^\/(ดีล|deal)\s+/, '');
      const response = await this.getDealStatus(dealName, user);
      await this.replyMessage(replyToken, response);
      return true;
    }

    // Log activity: /บันทึก [รายละเอียด] or /log [details]
    if (command.startsWith('/บันทึก ') || command.startsWith('/log ')) {
      const activityDetails = command.replace(/^\/(บันทึก|log)\s+/, '');
      const response = await this.logActivity(activityDetails, user);
      await this.replyMessage(replyToken, response);
      return true;
    }

    // Performance report: /รายงาน or /report
    if (command === '/รายงาน' || command === '/report') {
      const response = await this.getPerformanceReport(user);
      await this.replyMessage(replyToken, response);
      return true;
    }

    // Team leaderboard (managers only)
    if (command === '/ลีดเดอร์บอร์ด' || command === '/leaderboard') {
      if (user.role === 'admin' || user.role === 'manager') {
        const response = await this.getTeamLeaderboard(user);
        await this.replyMessage(replyToken, response);
      } else {
        await this.replyMessage(replyToken, 'คำสั่งนี้ใช้ได้เฉพาะผู้จัดการทีมเท่านั้น');
      }
      return true;
    }

    // AI insights: /คะแนน or /score
    if (command === '/คะแนน' || command === '/score') {
      const response = await this.getAIInsights(user);
      await this.replyMessage(replyToken, response);
      return true;
    }

    // AI forecast: /พยากรณ์ or /forecast
    if (command === '/พยากรณ์' || command === '/forecast') {
      const response = await this.getAIForecast(user);
      await this.replyMessage(replyToken, response);
      return true;
    }

    // Next action suggestions: /แนะนำ or /suggest
    if (command === '/แนะนำ' || command === '/suggest') {
      const response = await this.getNextActionSuggestions(user);
      await this.replyMessage(replyToken, response);
      return true;
    }

    return false; // Command not handled
  }

  // Process basic commands (for non-registered users)
  private async processBasicCommand(text: string, source: any, replyToken: string): Promise<void> {
    const target = source.userId || source.groupId;
    
    if (text.includes('สถานะ') || text.includes('status')) {
      await this.sendStatusUpdate(target);
    } else if (text.includes('รายงาน') || text.includes('report')) {
      await this.sendReportSummary(target);
    } else if (text.includes('ช่วยเหลือ') || text.includes('help')) {
      await this.sendHelpMessage(target);
    } else {
      // Unrecognized command
      await this.replyMessage(replyToken, 'ไม่เข้าใจคำสั่ง พิมพ์ "ช่วยเหลือ" เพื่อดูคำสั่งที่ใช้ได้');
    }
  }

  // Handle follow event
  private async handleFollow(event: any): Promise<void> {
    if (!this.client) return;

    const welcomeMessage = {
      type: 'text' as const,
      text: '🎉 ยินดีต้อนรับสู่ Bright Sales!\n\nแอปพลิเคชัน CRM สำหรับทีมขาย\n\n📝 คำสั่งที่ใช้ได้:\n• "สถานะ" - ดูสถานะระบบ\n• "รายงาน" - ดูสรุปยอดขาย\n• "ช่วยเหลือ" - ดูคำสั่งทั้งหมด'
    };

    await this.client.replyMessage(event.replyToken, welcomeMessage);
  }

  // Handle unfollow event
  private async handleUnfollow(event: any): Promise<void> {
    console.log('👋 User unfollowed:', event.source.userId);
  }

  // Handle join group event
  private async handleJoin(event: any): Promise<void> {
    if (!this.client) return;

    const welcomeMessage = {
      type: 'text' as const,
      text: '🎉 สวัสดีครับ! ผมคือ Bright Sales Bot\n\nผมจะช่วยแจ้งเตือนเกี่ยวกับ:\n• 📝 กิจกรรมการขายใหม่\n• 💼 อัปเดตดีล\n• 👥 ลูกค้าใหม่\n• 📊 รายงานประจำวัน\n\nพิมพ์ "ช่วยเหลือ" เพื่อดูคำสั่งทั้งหมด'
    };

    await this.client.replyMessage(event.replyToken, welcomeMessage);
  }

  // Handle leave group event
  private async handleLeave(event: any): Promise<void> {
    console.log('👋 Bot left group:', event.source.groupId);
  }

  // Send status update
  private async sendStatusUpdate(target: string): Promise<void> {
    try {
      if (!this.client) return;

      // This would typically fetch real data from your database
      const statusMessage = {
        type: 'text' as const,
        text: '📊 สถานะระบบ Bright Sales\n\n✅ ระบบทำงานปกติ\n📱 ผู้ใช้ออนไลน์: 5 คน\n💼 ดีลใหม่วันนี้: 3 รายการ\n📈 ยอดขายเดือนนี้: ฿125,000\n\n🕐 อัปเดตล่าสุด: ' + new Date().toLocaleString('th-TH')
      };

      await this.client.pushMessage(target, statusMessage);
    } catch (error) {
      console.error('❌ Error sending status update:', error);
    }
  }

  // Send report summary
  private async sendReportSummary(target: string): Promise<void> {
    try {
      if (!this.client) return;

      const reportMessage = {
        type: 'text' as const,
        text: '📊 สรุปยอดขายประจำวัน\n\n💰 ยอดขายวันนี้: ฿85,000\n📈 เพิ่มขึ้น: +15%\n💼 ดีลปิดสำเร็จ: 2 รายการ\n👥 ลูกค้าใหม่: 1 ราย\n📝 กิจกรรม: 8 รายการ\n\n🎯 เป้าหมายเดือน: 65% ✅'
      };

      await this.client.pushMessage(target, reportMessage);
    } catch (error) {
      console.error('❌ Error sending report:', error);
    }
  }

  // Send help message
  private async sendHelpMessage(target: string): Promise<void> {
    try {
      if (!this.client) return;

      const helpMessage = {
        type: 'text' as const,
        text: '🤖 คำสั่ง Bright Sales Bot\n\n📊 "สถานะ" - ดูสถานะระบบ\n📈 "รายงาน" - ดูสรุปยอดขาย\n💡 "ช่วยเหลือ" - ดูคำสั่งนี้\n\n🔗 เปิดแอป: ' + (process.env.FRONTEND_URL || 'http://localhost:3999')
      };

      await this.client.pushMessage(target, helpMessage);
    } catch (error) {
      console.error('❌ Error sending help message:', error);
    }
  }

  // Advanced help message for registered users
  private getAdvancedHelpMessage(): string {
    return `🤖 คำสั่งขั้นสูง Bright Sales Bot

📊 ข้อมูลลูกค้า & ดีล
/ลูกค้า [ชื่อ] - ดูข้อมูลลูกค้า 360°
/ดีล [ชื่อ] - ดูสถานะดีลและแนะนำขั้นตอนถัดไป

📝 บันทึกข้อมูล
/บันทึก [รายละเอียด] - บันทึกกิจกรรม
ตอย: /log call with ABC company discussed pricing

📈 รายงานและวิเคราะห์
/รายงาน - ดูผลงานส่วนตัว
/คะแนน - ดูคะแนน AI และข้อเสนอแนะ
/พยากรณ์ - วิเคราะห์แนวโน้มการขาย
/แนะนำ - แนะนำขั้นตอนถัดไป

👥 สำหรับผู้จัดการ
/ลีดเดอร์บอร์ด - ดูอันดับทีม

🌍 ภาษาอังกฤษ
คำสั่งทุกตัวใช้ภาษาอังกฤษได้ เช่น:
/customer, /deal, /log, /report, /score

💡 เคล็ดลับ:
• ใช้ได้ทั้งภาษาไทยและอังกฤษ
• สามารถใช้ภาษาธรรมดาในการบันทึก
• AI จะช่วยแปลและจัดหมวดหมู่ให้อัตโนมัติ`;
  }

  // Reply to message
  private async replyMessage(replyToken: string, message: string | FlexMessage): Promise<void> {
    try {
      if (!this.client) {
        console.warn('⚠️ LINE client not configured - reply skipped');
        return;
      }

      if (typeof message === 'string') {
        await this.client.replyMessage(replyToken, {
          type: 'text',
          text: message
        });
      } else {
        await this.client.replyMessage(replyToken, message);
      }
    } catch (error) {
      console.error('❌ Error replying message:', error);
    }
  }

  // Send message to specific user
  async sendMessageToUser(userId: string, message: string): Promise<boolean> {
    try {
      if (!this.client) {
        console.warn('⚠️ LINE client not configured - message skipped');
        return false;
      }

      const lineMessage: Message = {
        type: 'text',
        text: message
      };
      
      await this.client.pushMessage(userId, lineMessage);
      console.log(`✅ LINE message sent to user: ${userId}`);
      return true;
    } catch (error) {
      console.error('Error sending message to user:', error);
      return false;
    }
  }

  // Send message to group
  async sendMessageToGroup(groupId: string, message: string): Promise<boolean> {
    try {
      if (!this.client) {
        console.warn('⚠️ LINE client not configured - message skipped');
        return false;
      }

      const lineMessage: Message = {
        type: 'text',
        text: message
      };
      
      await this.client.pushMessage(groupId, lineMessage);
      console.log(`✅ LINE message sent to group: ${groupId}`);
      return true;
    } catch (error) {
      console.error('Error sending message to group:', error);
      return false;
    }
  }

  // Get customer 360° view
  private async getCustomer360(customerName: string, user: any): Promise<FlexMessage | string> {
    try {
      const Customer = require('../models/Customer').default;
      const Deal = require('../models/Deal').default;
      const SalesActivity = require('../models/SalesActivity').default;

      const customer = await Customer.findOne({
        $or: [
          { name: new RegExp(customerName, 'i') },
          { company: new RegExp(customerName, 'i') }
        ]
      });

      if (!customer) {
        return `ไม่พบลูกค้า "${customerName}" ในระบบ`;
      }

      const deals = await Deal.find({ customerId: customer._id })
        .sort({ updatedAt: -1 })
        .limit(3);

      const recentActivities = await SalesActivity.find({ customerId: customer._id })
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('userId', 'name');

      const totalDealValue = deals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);
      const activeDealCount = deals.filter((d: any) => d.status !== 'won' && d.status !== 'lost').length;

      return this.createCustomer360FlexMessage(customer, deals, recentActivities, totalDealValue, activeDealCount);
    } catch (error) {
      console.error('Error getting customer 360:', error);
      return 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า';
    }
  }

  // Get deal status and AI next actions
  private async getDealStatus(dealName: string, user: any): Promise<string> {
    try {
      const Deal = require('../models/Deal').default;
      const SalesActivity = require('../models/SalesActivity').default;

      const deal = await Deal.findOne({
        title: new RegExp(dealName, 'i')
      }).populate('customerId', 'name company');

      if (!deal) {
        return `ไม่พบดีล "${dealName}" ในระบบ`;
      }

      // Get recent activities for this deal
      const recentActivities = await SalesActivity.find({ dealId: deal._id })
        .sort({ createdAt: -1 })
        .limit(3);

      const nextAction = await this.getAINextAction(deal, recentActivities);
      const riskScore = this.calculateDealRisk(deal, recentActivities);
      
      return `🎯 ดีล: ${deal.title}
💰 มูลค่า: ${deal.value?.toLocaleString()} บาท
📊 สถานะ: ${this.getDealStatusLabel(deal.status)}
👤 ลูกค้า: ${(deal.customerId as any)?.name}
📅 วันปิดคาดการณ์: ${deal.expectedCloseDate?.toLocaleDateString('th-TH')}
🎯 โอกาสสำเร็จ: ${deal.probability || 50}%
⚠️ ระดับความเสี่ยง: ${riskScore}/10

🤖 แนะนำขั้นตอนถัดไป:
${nextAction}

📋 กิจกรรมล่าสุด:
${recentActivities.slice(0, 2).map((a: any) => `• ${a.type}: ${a.title}`).join('\n') || 'ยังไม่มีกิจกรรม'}`;
    } catch (error) {
      console.error('Error getting deal status:', error);
      return 'เกิดข้อผิดพลาดในการดึงข้อมูลดีล';
    }
  }

  // Log activity via natural language
  private async logActivity(activityDetails: string, user: any): Promise<string> {
    try {
      const SalesActivity = require('../models/SalesActivity').default;
      const Customer = require('../models/Customer').default;
      const Deal = require('../models/Deal').default;

      // Parse activity details using AI
      const parsedActivity = await this.parseActivityText(activityDetails);
      
      // Try to find customer if mentioned
      let customerId = null;
      let dealId = null;
      
      if (parsedActivity.customerName) {
        const customer = await Customer.findOne({
          $or: [
            { name: new RegExp(parsedActivity.customerName, 'i') },
            { company: new RegExp(parsedActivity.customerName, 'i') }
          ]
        });
        if (customer) {
          customerId = customer._id;
          
          // Find active deal for this customer
          const activeDeal = await Deal.findOne({
            customerId: customer._id,
            status: { $nin: ['won', 'lost'] }
          });
          if (activeDeal) dealId = activeDeal._id;
        }
      }

      const activity = new SalesActivity({
        type: parsedActivity.type || 'call',
        title: parsedActivity.title || 'กิจกรรมจาก LINE',
        description: activityDetails,
        summary: parsedActivity.summary || activityDetails.substring(0, 200),
        userId: user._id,
        customerId: customerId,
        dealId: dealId,
        estimatedValue: parsedActivity.estimatedValue,
        nextFollowUp: parsedActivity.nextFollowUp,
        createdAt: new Date()
      });

      await activity.save();
      
      // Notify team if important
      if (parsedActivity.isImportant && user.teamLineGroupId) {
        await this.notifyTeamActivity({
          userName: user.name,
          title: activity.title,
          customerName: parsedActivity.customerName,
          isImportant: true
        }, user.teamLineGroupId);
      }
      
      return `✅ บันทึกกิจกรรมสำเร็จ
📝 ประเภท: ${this.getActivityTypeLabel(activity.type)}
🎯 รายละเอียด: ${activityDetails.substring(0, 100)}${activityDetails.length > 100 ? '...' : ''}
${customerId ? `👤 ลูกค้า: ${parsedActivity.customerName}` : ''}
${dealId ? `💼 เชื่อมโยงกับดีลอัตโนมัติ` : ''}`;
    } catch (error) {
      console.error('Error logging activity:', error);
      return 'เกิดข้อผิดพลาดในการบันทึกกิจกรรม';
    }
  }

  // Get performance report
  private async getPerformanceReport(user: any): Promise<string> {
    try {
      const Deal = require('../models/Deal').default;
      const SalesActivity = require('../models/SalesActivity').default;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      
      const [monthlyDeals, weeklyDeals, monthlyActivities, totalWonValue, avgDealSize] = await Promise.all([
        Deal.countDocuments({ 
          userId: user._id,
          createdAt: { $gte: startOfMonth }
        }),
        Deal.countDocuments({
          userId: user._id,
          createdAt: { $gte: startOfWeek }
        }),
        SalesActivity.countDocuments({
          userId: user._id,
          createdAt: { $gte: startOfMonth }
        }),
        Deal.aggregate([
          {
            $match: {
              userId: user._id,
              status: 'won',
              updatedAt: { $gte: startOfMonth }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$value' }
            }
          }
        ]),
        Deal.aggregate([
          {
            $match: {
              userId: user._id,
              status: 'won',
              updatedAt: { $gte: startOfMonth }
            }
          },
          {
            $group: {
              _id: null,
              avgValue: { $avg: '$value' }
            }
          }
        ])
      ]);

      const totalWon = totalWonValue[0]?.total || 0;
      const avgDeal = avgDealSize[0]?.avgValue || 0;

      // Calculate performance score
      const score = this.calculatePerformanceScore(monthlyDeals, monthlyActivities, totalWon);

      return `📊 รายงานผลงาน ${user.name}
📅 ${now.toLocaleDateString('th-TH')}

📈 เดือนนี้
🎯 ดีลใหม่: ${monthlyDeals} ดีล
💰 ยอดขายปิด: ${totalWon.toLocaleString()} บาท
📝 กิจกรรม: ${monthlyActivities} ครั้ง
💸 ขนาดดีลเฉลี่ย: ${avgDeal.toLocaleString()} บาท

📊 สัปดาห์นี้
🎯 ดีลใหม่: ${weeklyDeals} ดีล

🏆 คะแนนประสิทธิภาพ: ${score}/100
${score >= 80 ? '🌟 ยอดเยี่ยม!' : score >= 60 ? '👍 ดีมาก!' : '💪 เร่งความเร็ว!'}

🚀 เป้าหมายถัดไป: ${this.getNextGoal(score)}`;
    } catch (error) {
      console.error('Error getting performance report:', error);
      return 'เกิดข้อผิดพลาดในการดึงรายงานผลงาน';
    }
  }

  // Get team leaderboard (managers only)
  private async getTeamLeaderboard(user: any): Promise<string> {
    try {
      const Deal = require('../models/Deal').default;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const leaderboard = await Deal.aggregate([
        {
          $match: {
            status: 'won',
            updatedAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: '$userId',
            totalValue: { $sum: '$value' },
            dealCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $sort: { totalValue: -1 }
        },
        {
          $limit: 10
        }
      ]);

      let leaderboardText = `🏆 อันดับทีมขาย ${now.toLocaleDateString('th-TH')}\n`;
      leaderboardText += `📊 ยอดขายเดือนนี้\n\n`;
      
      leaderboard.forEach((entry: any, index: any) => {
        const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        leaderboardText += `${emoji} ${entry.user.name}\n`;
        leaderboardText += `    💰 ${entry.totalValue.toLocaleString()} บาท (${entry.dealCount} ดีล)\n\n`;
      });

      if (leaderboard.length === 0) {
        leaderboardText += '📝 ยังไม่มีดีลปิดในเดือนนี้';
      }

      return leaderboardText;
    } catch (error) {
      console.error('Error getting team leaderboard:', error);
      return 'เกิดข้อผิดพลาดในการดึงอันดับทีม';
    }
  }

  // Get AI insights and recommendations
  private async getAIInsights(user: any): Promise<string> {
    try {
      const SalesActivity = require('../models/SalesActivity').default;
      const Deal = require('../models/Deal').default;

      const activities = await SalesActivity.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(20);

      const deals = await Deal.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(10);

      const insights = [];
      
      // Activity analysis
      if (activities.length < 5) {
        insights.push('💡 เพิ่มการบันทึกกิจกรรมเพื่อข้อมูลที่ดีขึ้น');
      }

      const callActivities = activities.filter((a: any) => a.type === 'call').length;
      const emailActivities = activities.filter((a: any) => a.type === 'email').length;
      const meetingActivities = activities.filter((a: any) => a.type === 'meeting').length;
      
      if (callActivities > emailActivities * 2) {
        insights.push('📞 คุณใช้โทรศัพท์เป็นหลัก ลองเพิ่มอีเมลเป็นทางเลือก');
      }

      if (meetingActivities === 0 && deals.length > 5) {
        insights.push('🤝 ลองนัดหมายพบลูกค้าเพื่อเพิ่มโอกาสปิดดีล');
      }

      // Deal velocity analysis
      const avgDealAge = this.calculateAverageDealAge(deals);
      if (avgDealAge > 30) {
        insights.push('⏰ ดีลใช้เวลานานเกินไป ลองเร่งการติดตาม');
      }

      // Win rate analysis
      const winRate = this.calculateWinRate(deals);
      if (winRate < 30) {
        insights.push('🎯 อัตราการปิดดีลต่ำ ลองปรับกลยุทธ์การขาย');
      }

      if (insights.length === 0) {
        insights.push('🌟 ผลงานของคุณดีมาก! รักษาจังหวะนี้ไว้');
      }

      const performanceScore = this.calculateDetailedPerformanceScore(activities, deals);

      return `🤖 AI Insights สำหรับ ${user.name}

📊 การวิเคราะห์
${insights.join('\n')}

📈 คะแนนประสิทธิภาพ: ${performanceScore}/100

📋 สถิติ
📞 โทรศัพท์: ${callActivities} ครั้ง
📧 อีเมล: ${emailActivities} ครั้ง  
🤝 ประชุม: ${meetingActivities} ครั้ง
🎯 อัตราปิดดีล: ${winRate.toFixed(1)}%
⏱️ เวลาเฉลี่ยต่อดีล: ${avgDealAge} วัน

🚀 แนะนำการปรับปรุง:
${this.getImprovementSuggestions(insights, winRate, avgDealAge)}`;
    } catch (error) {
      console.error('Error getting AI insights:', error);
      return 'เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล';
    }
  }

  // Get AI forecast
  private async getAIForecast(user: any): Promise<string> {
    try {
      const Deal = require('../models/Deal').default;

      const activeDeal = await Deal.find({
        userId: user._id,
        status: { $nin: ['won', 'lost'] }
      });

      const forecastValue = activeDeal.reduce((sum: any, deal: any) => {
        const probability = deal.probability || 50;
        return sum + (deal.value || 0) * (probability / 100);
      }, 0);

      const highProbabilityDeals = activeDeal.filter((d: any) => (d.probability || 50) >= 70);
      const mediumProbabilityDeals = activeDeal.filter((d: any) => (d.probability || 50) >= 40 && (d.probability || 50) < 70);
      const lowProbabilityDeals = activeDeal.filter((d: any) => (d.probability || 50) < 40);

      const nextMonthForecast = forecastValue * 1.2; // Simple growth assumption

      return `🔮 AI Sales Forecast - ${user.name}

📊 Pipeline ปัจจุบัน
💰 มูลค่ารวม: ${activeDeal.reduce((sum: any, d: any) => sum + (d.value || 0), 0).toLocaleString()} บาท
🎯 คาดการณ์ปิดสำเร็จ: ${forecastValue.toLocaleString()} บาท

📈 แยกตามโอกาส
🟢 สูง (≥70%): ${highProbabilityDeals.length} ดีล
🟡 ปานกลาง (40-69%): ${mediumProbabilityDeals.length} ดีล  
🔴 ต่ำ (<40%): ${lowProbabilityDeals.length} ดีล

🔮 พยากรณ์เดือนหน้า
💰 ${nextMonthForecast.toLocaleString()} บาท

⚠️ ความเสี่ยง
${this.getForecastRisks(activeDeal)}

💡 คำแนะนำ
${this.getForecastRecommendations(activeDeal, forecastValue)}`;
    } catch (error) {
      console.error('Error getting AI forecast:', error);
      return 'เกิดข้อผิดพลาดในการพยากรณ์';
    }
  }

  // Get next action suggestions
  private async getNextActionSuggestions(user: any): Promise<string> {
    try {
      const Deal = require('../models/Deal').default;
      const SalesActivity = require('../models/SalesActivity').default;

      const activeDeal = await Deal.find({
        userId: user._id,
        status: { $nin: ['won', 'lost'] }
      }).sort({ updatedAt: 1 }); // Oldest first

      const suggestions = [];

      for (const deal of activeDeal.slice(0, 3)) {
        const lastActivity = await SalesActivity.findOne({
          dealId: deal._id
        }).sort({ createdAt: -1 });

        const daysSinceLastActivity = lastActivity 
          ? Math.floor((new Date().getTime() - lastActivity.createdAt.getTime()) / (1000 * 3600 * 24))
          : 999;

        const suggestion = this.generateActionSuggestion(deal, daysSinceLastActivity, lastActivity);
        if (suggestion) suggestions.push(suggestion);
      }

      if (suggestions.length === 0) {
        return '🎉 ยอดเยี่ยม! ไม่มีงานที่รอดำเนินการ\n\nแนะนำ:\n• สร้างดีลใหม่\n• ติดต่อลูกค้าเก่า\n• อัพเดท pipeline';
      }

      return `🎯 แนะนำการดำเนินการ

${suggestions.join('\n\n')}

💡 เคล็ดลับ: ดำเนินการตามลำดับความสำคัญ`;
    } catch (error) {
      console.error('Error getting next action suggestions:', error);
      return 'เกิดข้อผิดพลาดในการวิเคราะห์';
    }
  }

  // Helper methods for AI calculations and analysis

  // Create customer 360° Flex message
  private createCustomer360FlexMessage(customer: any, deals: any[], activities: any[], totalValue: number, activeDeals: number): FlexMessage {
    return {
      type: 'flex',
      altText: `ข้อมูลลูกค้า: ${customer.name}`,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: customer.name,
              weight: 'bold',
              size: 'xl',
              color: '#ffffff'
            },
            {
              type: 'text',
              text: customer.company || 'บริษัท',
              size: 'sm',
              color: '#ffffff'
            }
          ],
          backgroundColor: '#0066cc',
          paddingAll: '20px'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '📞 ' + (customer.phone || 'ไม่ระบุ'),
              size: 'sm',
              margin: 'md'
            },
            {
              type: 'text',
              text: '📧 ' + (customer.email || 'ไม่ระบุ'),
              size: 'sm'
            },
            {
              type: 'separator',
              margin: 'lg'
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: `💼 ดีลทั้งหมด: ${deals.length}`,
                  size: 'sm',
                  margin: 'md'
                },
                {
                  type: 'text',
                  text: `🔄 ดีลที่ใช้งาน: ${activeDeals}`,
                  size: 'sm'
                },
                {
                  type: 'text',
                  text: `💰 มูลค่ารวม: ${totalValue.toLocaleString()} บาท`,
                  size: 'sm',
                  color: '#10B981',
                  weight: 'bold'
                }
              ]
            }
          ],
          paddingAll: '20px'
        }
      }
    };
  }

  // Enhanced AI next action with recent activities context
  private async getAINextAction(deal: any, recentActivities: any[]): Promise<string> {
    // Analyze deal context and suggest next action
    const daysSinceLastActivity = recentActivities.length > 0 
      ? Math.floor((new Date().getTime() - recentActivities[0].createdAt.getTime()) / (1000 * 3600 * 24))
      : 999;

    const actions = [];

    if (daysSinceLastActivity > 7) {
      actions.push('📞 โทรติดตามลูกค้า - ไม่มีการติดต่อมา ' + daysSinceLastActivity + ' วัน');
    }

    if (deal.status === 'proposal') {
      actions.push('📄 ตรวจสอบสถานะข้อเสนอและติดตามผลตอบรับ');
    } else if (deal.status === 'negotiation') {
      actions.push('🤝 เจรจาเงื่อนไขและเตรียมปิดดีล');
    } else if (deal.status === 'qualified') {
      actions.push('📋 ส่งข้อเสนอราคาและนัดนำเสนอ');
    }

    const lastActivityType = recentActivities[0]?.type;
    if (lastActivityType === 'call') {
      actions.push('📧 ส่งอีเมลสรุปการสนทนาและขั้นตอนถัดไป');
    } else if (lastActivityType === 'email') {
      actions.push('📞 โทรติดตามการตอบรับอีเมล');
    }

    if (deal.probability && deal.probability < 30) {
      actions.push('⚠️ ทบทวนความต้องการและปรับกลยุทธ์');
    }

    return actions.length > 0 ? actions[0] : 'ติดตามความคืบหน้าตามปกติ';
  }

  // Calculate deal risk score
  private calculateDealRisk(deal: any, activities: any[]): number {
    let risk = 0;

    // Time since last activity
    const daysSinceLastActivity = activities.length > 0 
      ? Math.floor((new Date().getTime() - activities[0].createdAt.getTime()) / (1000 * 3600 * 24))
      : 999;

    if (daysSinceLastActivity > 14) risk += 3;
    else if (daysSinceLastActivity > 7) risk += 2;
    else if (daysSinceLastActivity > 3) risk += 1;

    // Deal age
    const dealAge = Math.floor((new Date().getTime() - deal.createdAt.getTime()) / (1000 * 3600 * 24));
    if (dealAge > 90) risk += 3;
    else if (dealAge > 60) risk += 2;
    else if (dealAge > 30) risk += 1;

    // Probability
    const probability = deal.probability || 50;
    if (probability < 30) risk += 2;
    else if (probability < 50) risk += 1;

    // Activity frequency
    if (activities.length < 3) risk += 2;
    else if (activities.length < 5) risk += 1;

    return Math.min(risk, 10);
  }

  // Enhanced activity text parsing with AI
  private async parseActivityText(text: string): Promise<any> {
    const activity: any = {};
    const lowerText = text.toLowerCase();
    
    // Extract activity type
    if (lowerText.includes('call') || lowerText.includes('โทร')) {
      activity.type = 'call';
      activity.title = 'โทรติดต่อลูกค้า';
    } else if (lowerText.includes('email') || lowerText.includes('อีเมล') || lowerText.includes('ส่ง')) {
      activity.type = 'email';
      activity.title = 'ส่งอีเมล';
    } else if (lowerText.includes('meeting') || lowerText.includes('ประชุม') || lowerText.includes('นัด')) {
      activity.type = 'meeting';
      activity.title = 'ประชุมกับลูกค้า';
    } else if (lowerText.includes('demo') || lowerText.includes('เดโม') || lowerText.includes('นำเสนอ')) {
      activity.type = 'demo';
      activity.title = 'นำเสนอผลิตภัณฑ์';
    } else if (lowerText.includes('proposal') || lowerText.includes('เสนอราคา') || lowerText.includes('ใบเสนอ')) {
      activity.type = 'proposal';
      activity.title = 'ส่งใบเสนอราคา';
    } else {
      activity.type = 'other';
      activity.title = 'กิจกรรมอื่นๆ';
    }

    // Extract customer name (simple pattern matching)
    const customerPatterns = [
      /with\s+([A-Za-z\u0E00-\u0E7F\s]+?)(?:\s|$|discussed|about)/i,
      /กับ\s*([ก-๙\s]+?)(?:\s|$|เรื่อง|เกี่ยวกับ)/,
      /ลูกค้า\s*([ก-๙\s]+?)(?:\s|$|เรื่อง|เกี่ยวกับ)/
    ];

    for (const pattern of customerPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        activity.customerName = match[1].trim();
        break;
      }
    }

    // Extract value if mentioned
    const valueMatch = text.match(/(\d+(?:,\d+)*)\s*(?:บาท|baht|฿)/i);
    if (valueMatch) {
      activity.estimatedValue = parseInt(valueMatch[1].replace(/,/g, ''));
    }

    // Check if important
    const importantKeywords = ['urgent', 'important', 'สำคัญ', 'ด่วน', 'hot', 'high priority'];
    activity.isImportant = importantKeywords.some(keyword => lowerText.includes(keyword));

    // Extract follow-up date
    const followUpMatch = text.match(/(next|follow.?up|ติดตาม|หน้า)\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday|จันทร์|อังคาร|พุธ|พฤหัส|ศุกร์|เสาร์|อาทิตย์|\d+)/i);
    if (followUpMatch) {
      activity.nextFollowUp = followUpMatch[0];
    }

    activity.summary = text.length > 200 ? text.substring(0, 200) + '...' : text;

    return activity;
  }

  // Calculate performance score
  private calculatePerformanceScore(deals: number, activities: number, revenue: number): number {
    let score = 0;

    // Activity score (30 points)
    if (activities >= 20) score += 30;
    else if (activities >= 15) score += 25;
    else if (activities >= 10) score += 20;
    else if (activities >= 5) score += 15;
    else score += activities * 3;

    // Deal score (40 points)
    if (deals >= 10) score += 40;
    else if (deals >= 5) score += 30;
    else if (deals >= 3) score += 20;
    else score += deals * 10;

    // Revenue score (30 points)
    if (revenue >= 500000) score += 30;
    else if (revenue >= 200000) score += 25;
    else if (revenue >= 100000) score += 20;
    else if (revenue >= 50000) score += 15;
    else score += Math.floor(revenue / 5000);

    return Math.min(score, 100);
  }

  // Get next goal suggestion
  private getNextGoal(currentScore: number): string {
    if (currentScore >= 90) return 'รักษาระดับนี้และเป็นที่ปรึกษาให้ทีม';
    if (currentScore >= 80) return 'เพิ่มขนาดดีลเฉลี่ยให้สูงขึ้น';
    if (currentScore >= 60) return 'เพิ่มการติดตามลูกค้าให้สม่ำเสมอ';
    return 'เพิ่มกิจกรรมการขายและการบันทึกข้อมูล';
  }

  // Calculate average deal age
  private calculateAverageDealAge(deals: any[]): number {
    if (deals.length === 0) return 0;
    
    const activeDeals = deals.filter(d => d.status !== 'won' && d.status !== 'lost');
    if (activeDeals.length === 0) return 0;

    const totalAge = activeDeals.reduce((sum, deal) => {
      const age = Math.floor((new Date().getTime() - deal.createdAt.getTime()) / (1000 * 3600 * 24));
      return sum + age;
    }, 0);

    return Math.floor(totalAge / activeDeals.length);
  }

  // Calculate win rate
  private calculateWinRate(deals: any[]): number {
    if (deals.length === 0) return 0;
    
    const wonDeals = deals.filter(d => d.status === 'won').length;
    const closedDeals = deals.filter(d => d.status === 'won' || d.status === 'lost').length;
    
    return closedDeals > 0 ? (wonDeals / closedDeals) * 100 : 0;
  }

  // Calculate detailed performance score
  private calculateDetailedPerformanceScore(activities: any[], deals: any[]): number {
    const activityTypes = activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {});

    let score = 0;

    // Diversity score
    const diversityScore = Object.keys(activityTypes).length * 5;
    score += Math.min(diversityScore, 25);

    // Volume score
    const volumeScore = Math.min(activities.length * 2, 40);
    score += volumeScore;

    // Win rate score
    const winRate = this.calculateWinRate(deals);
    score += Math.min(winRate, 35);

    return Math.min(score, 100);
  }

  // Get improvement suggestions
  private getImprovementSuggestions(insights: string[], winRate: number, avgDealAge: number): string {
    const suggestions = [];

    if (winRate < 30) {
      suggestions.push('• ปรับปรุงการคัดกรองลูกค้าให้มีคุณภาพ');
      suggestions.push('• เพิ่มทักษะการนำเสนอและการปิดดีล');
    }

    if (avgDealAge > 45) {
      suggestions.push('• สร้างความเร่งด่วนในการตัดสินใจ');
      suggestions.push('• ติดตามลูกค้าให้สม่ำเสมอมากขึ้น');
    }

    if (suggestions.length === 0) {
      suggestions.push('• ขยายเครือข่ายลูกค้าใหม่');
      suggestions.push('• เพิ่มขนาดดีลเฉลี่ย');
    }

    return suggestions.join('\n');
  }

  // Get forecast risks
  private getForecastRisks(deals: any[]): string {
    const risks = [];

    const staleDeal = deals.filter(d => {
      const age = Math.floor((new Date().getTime() - d.createdAt.getTime()) / (1000 * 3600 * 24));
      return age > 60;
    });

    if (staleDeal.length > 0) {
      risks.push(`• ${staleDeal.length} ดีลค้างนานเกิน 60 วัน`);
    }

    const lowProbabilityValue = deals
      .filter(d => (d.probability || 50) < 40)
      .reduce((sum, d) => sum + (d.value || 0), 0);

    if (lowProbabilityValue > 0) {
      risks.push(`• มูลค่า ${lowProbabilityValue.toLocaleString()} บาท มีโอกาสต่ำ`);
    }

    return risks.length > 0 ? risks.join('\n') : '• ไม่พบความเสี่ยงสำคัญ';
  }

  // Get forecast recommendations
  private getForecastRecommendations(deals: any[], forecastValue: number): string {
    const recommendations = [];

    const highValueDeals = deals.filter(d => (d.value || 0) > 100000);
    if (highValueDeals.length > 0) {
      recommendations.push(`• โฟกัสที่ดีลมูลค่าสูง ${highValueDeals.length} ดีล`);
    }

    const urgentDeals = deals.filter(d => {
      const closeDate = new Date(d.expectedCloseDate);
      const daysToClose = Math.floor((closeDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return daysToClose <= 30 && daysToClose > 0;
    });

    if (urgentDeals.length > 0) {
      recommendations.push(`• เร่งปิด ${urgentDeals.length} ดีลที่ใกล้ deadline`);
    }

    if (forecastValue < 100000) {
      recommendations.push('• สร้างดีลใหม่เพิ่มเติมเพื่อเข้าเป้า');
    }

    return recommendations.length > 0 ? recommendations.join('\n') : '• รักษาจังหวะปัจจุบัน';
  }

  // Generate specific action suggestion for a deal
  private generateActionSuggestion(deal: any, daysSinceLastActivity: number, lastActivity: any): string {
    let priority = '🟡';
    if (daysSinceLastActivity > 14) priority = '🔴';
    else if (daysSinceLastActivity > 7) priority = '🟠';
    else if (daysSinceLastActivity <= 3) priority = '🟢';

    let action = '';
    if (daysSinceLastActivity > 14) {
      action = 'โทรติดตามด่วน - เสี่ยงเสียโอกาส';
    } else if (daysSinceLastActivity > 7) {
      action = 'ติดตามความคืบหน้า';
    } else if (deal.status === 'negotiation') {
      action = 'เร่งการเจรจาและปิดดีล';
    } else if (deal.status === 'proposal') {
      action = 'ติดตามผลการพิจารณาข้อเสนอ';
    } else {
      action = 'ดำเนินการตามแผน';
    }

    return `${priority} ${deal.title}
💰 ${(deal.value || 0).toLocaleString()} บาท
📊 ${this.getDealStatusLabel(deal.status)}
⏰ ${daysSinceLastActivity} วันที่แล้ว
🎯 ${action}`;
  }

  // Proactive notification methods for voice-to-LINE integration
  async notifyVoiceActivity(activity: any): Promise<void> {
    try {
      const User = require('../models/User').default;
      const user = await User.findById(activity.userId);
      
      if (user?.lineUserId && activity.summary) {
        const message = `🎤 สรุปการบันทึกเสียง
👤 ${user.name}
🎯 ${activity.title}
💼 ลูกค้า: ${activity.customerName || 'ไม่ระบุ'}

📝 สรุป:
${activity.summary.substring(0, 200)}${activity.summary.length > 200 ? '...' : ''}

${activity.transcription ? '🔗 ดูรายละเอียดในแอป' : ''}`;
        
        await this.sendMessageToUser(user.lineUserId, message);
        
        // Notify team if important
        if (activity.isImportant && user.teamLineGroupId) {
          await this.notifyTeamActivity({
            userName: user.name,
            title: activity.title,
            customerName: activity.customerName,
            summary: activity.summary,
            isImportant: true
          }, user.teamLineGroupId);
        }
      }
    } catch (error) {
      console.error('Error notifying voice activity:', error);
    }
  }

  async notifyTeamActivity(activity: any, teamGroupId: string): Promise<void> {
    try {
      if (teamGroupId && activity.isImportant) {
        const message = `🔥 กิจกรรมสำคัญจากทีม

👤 ${activity.userName}
🎯 ${activity.title}
💼 ลูกค้า: ${activity.customerName || 'ไม่ระบุ'}

${activity.summary ? `📝 ${activity.summary.substring(0, 150)}...` : ''}`;
        
        await this.sendMessageToGroup(teamGroupId, message);
      }
    } catch (error) {
      console.error('Error notifying team activity:', error);
    }
  }

  // Enhanced deal update notification
  async notifyDealUpdate(deal: any, userId: string, changeType: string = 'updated'): Promise<void> {
    try {
      const User = require('../models/User').default;
      const user = await User.findById(userId);
      
      if (user?.lineUserId) {
        let emoji = '💼';
        let actionText = 'อัพเดท';
        
        switch (changeType) {
          case 'won':
            emoji = '🎉';
            actionText = 'ปิดสำเร็จ';
            break;
          case 'lost':
            emoji = '😔';
            actionText = 'เสียโอกาส';
            break;
          case 'status_changed':
            emoji = '📊';
            actionText = 'เปลี่ยนสถานะ';
            break;
        }

        const message = `${emoji} ${actionText}ดีล: ${deal.title}
💰 มูลค่า: ${(deal.value || 0).toLocaleString()} บาท
📊 สถานะใหม่: ${this.getDealStatusLabel(deal.status)}
👤 ลูกค้า: ${deal.customerName || 'ไม่ระบุ'}
🎯 โอกาสสำเร็จ: ${deal.probability || 50}%

${changeType === 'won' ? '🍾 ยินดีด้วย!' : changeType === 'lost' ? '💪 สู้ต่อไป!' : '📈 เก็บข้อมูลให้ครบถ้วน'}`;
        
        await this.sendMessageToUser(user.lineUserId, message);
      }
    } catch (error) {
      console.error('Error notifying deal update:', error);
    }
  }
}

export default new LineService();