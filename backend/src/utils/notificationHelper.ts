import lineService from '../services/lineService';

// Default notification targets (can be configured per user/team)
const DEFAULT_TARGETS: any[] = [
  // Add your default LINE group/chat IDs here
  // { groupId: 'your-sales-team-group-id' },
  // { userId: 'your-manager-user-id' }
];

export class NotificationHelper {
  // Send activity notification
  static async notifyActivity(activity: any, customTargets?: any[]): Promise<void> {
    try {
      const targets = customTargets || DEFAULT_TARGETS;
      
      if (targets.length === 0) {
        console.log('No notification targets configured');
        return;
      }

      for (const target of targets) {
        await lineService.notifyActivity(activity, target);
      }
    } catch (error) {
      console.error('Failed to send activity notification:', error);
    }
  }

  // Send deal notification
  static async notifyDeal(deal: any, action: string, customTargets?: any[]): Promise<void> {
    try {
      const targets = customTargets || DEFAULT_TARGETS;
      
      if (targets.length === 0) {
        console.log('No notification targets configured');
        return;
      }

      for (const target of targets) {
        await lineService.notifyDeal(deal, action, target);
      }
    } catch (error) {
      console.error('Failed to send deal notification:', error);
    }
  }

  // Send customer notification
  static async notifyCustomer(customer: any, action: string, customTargets?: any[]): Promise<void> {
    try {
      const targets = customTargets || DEFAULT_TARGETS;
      
      if (targets.length === 0) {
        console.log('No notification targets configured');
        return;
      }

      for (const target of targets) {
        await lineService.notifyCustomer(customer, action, target);
      }
    } catch (error) {
      console.error('Failed to send customer notification:', error);
    }
  }

  // Send system notification
  static async notifySystem(message: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium', customTargets?: any[]): Promise<void> {
    try {
      const targets = customTargets || DEFAULT_TARGETS;
      
      if (targets.length === 0) {
        console.log('No notification targets configured');
        return;
      }

      for (const target of targets) {
        await lineService.notifySystem(message, target, priority);
      }
    } catch (error) {
      console.error('Failed to send system notification:', error);
    }
  }

  // Send daily report
  static async sendDailyReport(data: any, customTargets?: any[]): Promise<void> {
    try {
      const targets = customTargets || DEFAULT_TARGETS;
      
      if (targets.length === 0) {
        console.log('No notification targets configured');
        return;
      }

      const reportMessage = `📊 รายงานประจำวัน ${new Date().toLocaleDateString('th-TH')}

💰 ยอดขายวันนี้: ฿${data.dailySales?.toLocaleString() || '0'}
📈 เปรียบเทียบเมื่อวาน: ${data.growth >= 0 ? '+' : ''}${data.growth || 0}%
💼 ดีลปิดสำเร็จ: ${data.closedDeals || 0} รายการ
👥 ลูกค้าใหม่: ${data.newCustomers || 0} ราย
📝 กิจกรรมทั้งหมด: ${data.totalActivities || 0} รายการ

🎯 ความคืบหนาเป้าหมายเดือน: ${data.monthlyProgress || 0}%`;

      for (const target of targets) {
        await lineService.notifySystem(reportMessage, target, 'medium');
      }
    } catch (error) {
      console.error('Failed to send daily report:', error);
    }
  }

  // Send weekly report
  static async sendWeeklyReport(data: any, customTargets?: any[]): Promise<void> {
    try {
      const targets = customTargets || DEFAULT_TARGETS;
      
      if (targets.length === 0) {
        console.log('No notification targets configured');
        return;
      }

      const reportMessage = `📊 รายงานประจำสัปดาห์ 
สัปดาหที่ ${Math.ceil(new Date().getDate() / 7)} เดือน ${new Date().toLocaleDateString('th-TH', { month: 'long' })}

💰 ยอดขายรวม: ฿${data.weeklySales?.toLocaleString() || '0'}
📈 เติบโตจากสัปดาห์ที่แล้ว: ${data.weeklyGrowth >= 0 ? '+' : ''}${data.weeklyGrowth || 0}%
💼 ดีลปิดสำเร็จ: ${data.weeklyClosedDeals || 0} รายการ
👥 ลูกค้าใหม่: ${data.weeklyNewCustomers || 0} ราย
🏆 Top Performer: ${data.topPerformer || 'ไม่มีข้อมูล'}

📅 สัปดาหนี้มีดีลสำคัญ ${data.upcomingDeals || 0} รายการ`;

      for (const target of targets) {
        await lineService.notifySystem(reportMessage, target, 'medium');
      }
    } catch (error) {
      console.error('Failed to send weekly report:', error);
    }
  }
}

export default NotificationHelper;