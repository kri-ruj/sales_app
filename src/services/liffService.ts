import liff from '@line/liff';

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LiffContext {
  type: 'utou' | 'room' | 'group' | 'square_group' | 'square_chat' | 'external' | 'none';
  groupId?: string;
  roomId?: string;
  squareGroupId?: string;
  utouId?: string;
}

class LiffService {
  private initialized = false;
  private liffId: string;

  constructor() {
    this.liffId = process.env.REACT_APP_LIFF_ID || '';
  }

  // Initialize LIFF
  async init(): Promise<boolean> {
    try {
      if (this.initialized) {
        return true;
      }

      if (!this.liffId) {
        console.warn('LIFF ID not configured. Running in web mode.');
        return false;
      }

      await liff.init({
        liffId: this.liffId,
        withLoginOnExternalBrowser: true
      });

      this.initialized = true;
      console.log('✅ LIFF initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ LIFF initialization failed:', error);
      return false;
    }
  }

  // Check if running in LINE app
  isInClient(): boolean {
    if (!this.initialized) return false;
    return liff.isInClient();
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    if (!this.initialized) return false;
    return liff.isLoggedIn();
  }

  // Get user profile
  async getProfile(): Promise<LiffProfile | null> {
    try {
      if (!this.initialized || !this.isLoggedIn()) {
        return null;
      }

      const profile = await liff.getProfile();
      return {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage
      };
    } catch (error) {
      console.error('Error getting LINE profile:', error);
      return null;
    }
  }

  // Get LIFF context (chat type, group ID, etc.)
  getContext(): LiffContext | null {
    try {
      if (!this.initialized) return null;

      const context = liff.getContext();
      if (!context) return null;

      return {
        type: context.type,
        groupId: context.groupId,
        roomId: context.roomId,
        squareGroupId: (context as any).squareChatId || (context as any).squareGroupId,
        utouId: context.utouId
      };
    } catch (error) {
      console.error('Error getting LIFF context:', error);
      return null;
    }
  }

  // Login with LINE
  async login(): Promise<void> {
    try {
      if (!this.initialized) {
        throw new Error('LIFF not initialized');
      }

      if (this.isLoggedIn()) {
        return;
      }

      liff.login({
        redirectUri: window.location.href
      });
    } catch (error) {
      console.error('Error during LINE login:', error);
      throw error;
    }
  }

  // Logout from LINE
  logout(): void {
    try {
      if (!this.initialized) return;
      liff.logout();
    } catch (error) {
      console.error('Error during LINE logout:', error);
    }
  }

  // Get access token
  getAccessToken(): string | null {
    try {
      if (!this.initialized || !this.isLoggedIn()) return null;
      return liff.getAccessToken();
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  // Send message to LINE chat
  async sendMessage(message: any): Promise<boolean> {
    try {
      if (!this.initialized || !this.isInClient()) {
        console.warn('Cannot send message: not in LINE client');
        return false;
      }

      await liff.sendMessages([message]);
      return true;
    } catch (error) {
      console.error('Error sending LINE message:', error);
      return false;
    }
  }

  // Share target picker
  async shareTargetPicker(messages: any[]): Promise<boolean> {
    try {
      if (!this.initialized || !this.isInClient()) {
        console.warn('Cannot share: not in LINE client');
        return false;
      }

      if (liff.isApiAvailable('shareTargetPicker')) {
        await liff.shareTargetPicker(messages);
        return true;
      } else {
        console.warn('shareTargetPicker is not available');
        return false;
      }
    } catch (error) {
      console.error('Error sharing via target picker:', error);
      return false;
    }
  }

  // Close LIFF window
  closeWindow(): void {
    try {
      if (!this.initialized || !this.isInClient()) return;
      liff.closeWindow();
    } catch (error) {
      console.error('Error closing LIFF window:', error);
    }
  }

  // Open external link
  openWindow(url: string, external: boolean = false): void {
    try {
      if (!this.initialized) {
        window.open(url, '_blank');
        return;
      }

      if (this.isInClient()) {
        liff.openWindow({
          url,
          external
        });
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error opening window:', error);
      window.open(url, '_blank');
    }
  }

  // Scan QR code (if available)
  async scanCode(): Promise<string | null> {
    try {
      if (!this.initialized || !this.isInClient()) {
        console.warn('QR scan not available: not in LINE client');
        return null;
      }

      if (liff.isApiAvailable('scanCodeV2')) {
        const result = await liff.scanCodeV2();
        return result.value;
      } else {
        console.warn('scanCodeV2 is not available');
        return null;
      }
    } catch (error) {
      console.error('Error scanning QR code:', error);
      return null;
    }
  }

  // Get device info
  getDeviceInfo(): any {
    try {
      if (!this.initialized) return null;
      
      return {
        isInClient: this.isInClient(),
        isLoggedIn: this.isLoggedIn(),
        os: liff.getOS(),
        language: liff.getLanguage(),
        version: liff.getVersion(),
        lineVersion: liff.getLineVersion(),
        isApiAvailable: {
          shareTargetPicker: liff.isApiAvailable('shareTargetPicker'),
          scanCodeV2: liff.isApiAvailable('scanCodeV2'),
          openWindow: liff.isApiAvailable('openWindow'),
          sendMessages: liff.isApiAvailable('sendMessages')
        }
      };
    } catch (error) {
      console.error('Error getting device info:', error);
      return null;
    }
  }

  // Create share message for activity
  createActivityShareMessage(activity: any): any {
    return {
      type: 'flex',
      altText: `📝 กิจกรรมใหม่: ${activity.title}`,
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '📝 กิจกรรมใหม่',
              weight: 'bold',
              size: 'lg',
              color: '#3B82F6'
            },
            {
              type: 'separator',
              margin: 'md'
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: activity.title,
                  weight: 'bold',
                  size: 'md',
                  wrap: true,
                  margin: 'md'
                },
                {
                  type: 'text',
                  text: `👤 ${activity.customerName}`,
                  size: 'sm',
                  color: '#666666',
                  margin: 'sm'
                },
                {
                  type: 'text',
                  text: `📋 ${this.getActivityTypeLabel(activity.activityType)}`,
                  size: 'sm',
                  color: '#666666',
                  margin: 'sm'
                }
              ]
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                label: '📱 เปิดแอป',
                uri: `${process.env.REACT_APP_BASE_URL || window.location.origin}/activities`
              },
              style: 'primary',
              color: '#3B82F6'
            }
          ]
        }
      }
    };
  }

  // Create share message for deal
  createDealShareMessage(deal: any): any {
    return {
      type: 'flex',
      altText: `💼 ดีล: ${deal.title}`,
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '💼 อัปเดตดีล',
              weight: 'bold',
              size: 'lg',
              color: '#10B981'
            },
            {
              type: 'separator',
              margin: 'md'
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: deal.title,
                  weight: 'bold',
                  size: 'md',
                  wrap: true,
                  margin: 'md'
                },
                {
                  type: 'text',
                  text: `🏢 ${deal.customerName}`,
                  size: 'sm',
                  color: '#666666',
                  margin: 'sm'
                },
                {
                  type: 'text',
                  text: `💰 ฿${deal.value?.toLocaleString() || '0'}`,
                  size: 'sm',
                  color: '#10B981',
                  weight: 'bold',
                  margin: 'sm'
                }
              ]
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                label: '📊 ดูดีล',
                uri: `${process.env.REACT_APP_BASE_URL || window.location.origin}/deals`
              },
              style: 'primary',
              color: '#10B981'
            }
          ]
        }
      }
    };
  }

  // Helper method for activity type labels
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
}

export default new LiffService();