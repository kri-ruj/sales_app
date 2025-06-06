// API Service for connecting frontend to backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface SalesActivity {
  id: string;
  _id?: string; // MongoDB ID
  title: string;
  description: string;
  customerName: string;
  contactInfo: string;
  activityType: 'call' | 'meeting' | 'email' | 'voice-note' | 'demo' | 'proposal' | 'negotiation' | 'follow-up-call' | 'site-visit';
  status: 'pending' | 'completed' | 'follow-up' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  audioUrl?: string;
  audioFileName?: string;
  transcription?: string;
  transcriptionLanguage?: string;
  transcriptionConfidence?: number;
  transcriptionDuration?: number;
  category?: 'prospecting' | 'qualification' | 'presentation' | 'negotiation' | 'closing' | 'follow-up' | 'support';
  activityScore?: number;
  actionItems: string[];
  tags?: string[];
  dueDate?: string;
  completedDate?: string;
  estimatedValue?: number;
  actualValue?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  _id: string;
  title: string;
  description: string;
  customerName: string;
  contactInfo: string;
  value: number;
  status: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost' | 'active';
  stage: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expectedCloseDate?: string;
  actualCloseDate?: string;
  probability: number;
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface TranscriptionResult {
  transcription: string;
  language?: string;
  duration?: number;
  confidence?: number;
  audioUrl?: string;
  filename?: string;
  uploadTime?: string;
  // Enhanced Gemini data
  enhanced?: boolean;
  customerInfo?: {
    name?: string;
    company?: string;
  };
  dealInfo?: {
    value?: string;
    status?: string;
  };
  actionItems?: string[];
  summary?: string;
}

export interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  status: 'lead' | 'prospect' | 'active_customer' | 'inactive_customer' | 'former_customer';
  source?: string;
  tags?: string[];
  notes?: string;
  totalValue?: number;
  lastContactDate?: string;
  assignedTo?: string;
  createdBy?: string;
  
  // Enhanced classification fields
  industry?: string;
  companySize?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  budget?: 'low' | 'medium' | 'high' | 'enterprise';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  leadScore?: number;
  region?: string;
  timezone?: string;
  preferredContactMethod?: 'email' | 'phone' | 'line' | 'meeting';
  decisionMaker?: boolean;
  painPoints?: string[];
  interests?: string[];
  competitors?: string[];
  nextFollowUp?: string;
  referredBy?: string;
  socialProfiles?: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    line?: string;
  };
  customFields?: { [key: string]: any };
  
  createdAt: string;
  updatedAt: string;
}

export class ApiService {
  
  // Health check
  static async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // Helper method to get auth headers
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Deals API
  static async getDeals(): Promise<ApiResponse<Deal[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/deals`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch deals:', error);
      throw error;
    }
  }

  static async getDeal(id: string): Promise<ApiResponse<Deal>> {
    try {
      const response = await fetch(`${API_BASE_URL}/deals/${id}`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch deal:', error);
      throw error;
    }
  }

  static async createDeal(deal: Partial<Deal>): Promise<ApiResponse<Deal>> {
    try {
      const response = await fetch(`${API_BASE_URL}/deals`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(deal)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to create deal:', error);
      throw error;
    }
  }

  static async updateDeal(id: string, deal: Partial<Deal>): Promise<ApiResponse<Deal>> {
    try {
      const response = await fetch(`${API_BASE_URL}/deals/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(deal)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to update deal:', error);
      throw error;
    }
  }

  static async deleteDeal(id: string): Promise<ApiResponse<Deal>> {
    try {
      const response = await fetch(`${API_BASE_URL}/deals/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to delete deal:', error);
      throw error;
    }
  }

  // Activities API
  static async getActivities(): Promise<ApiResponse<SalesActivity[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      throw error;
    }
  }

  static async createActivity(activity: Partial<SalesActivity>): Promise<ApiResponse<SalesActivity>> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(activity)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to create activity:', error);
      throw error;
    }
  }

  static async updateActivity(id: string, activity: Partial<SalesActivity>): Promise<ApiResponse<SalesActivity>> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(activity)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to update activity:', error);
      throw error;
    }
  }

  static async deleteActivity(id: string): Promise<ApiResponse<SalesActivity>> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to delete activity:', error);
      throw error;
    }
  }

  // Audio/Transcription API
  static async uploadAndTranscribeAudio(audioBlob: Blob): Promise<ApiResponse<TranscriptionResult>> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/audio/upload`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to upload and transcribe audio:', error);
      throw error;
    }
  }

  static async transcribeExistingAudio(audioPath: string): Promise<ApiResponse<TranscriptionResult>> {
    try {
      const response = await fetch(`${API_BASE_URL}/audio/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioPath })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to transcribe audio:', error);
      throw error;
    }
  }

  static async deleteAudioFile(filename: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/audio/${filename}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to delete audio file:', error);
      throw error;
    }
  }

  static async createActivityFromVoice(data: {
    audioUrl?: string;
    audioFileName?: string;
    transcription: string;
    transcriptionLanguage?: string;
    transcriptionConfidence?: number;
    transcriptionDuration?: number;
    title?: string;
    customerName?: string;
    extractedData?: any;
  }): Promise<ApiResponse<SalesActivity>> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/from-voice`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create activity from voice:', error);
      throw error;
    }
  }

  // Search API
  static async searchActivities(query: string): Promise<ApiResponse<SalesActivity[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/search/${encodeURIComponent(query)}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to search activities:', error);
      throw error;
    }
  }

  // Customer API methods
  static async getCustomers(): Promise<ApiResponse<Customer[]>> {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/customers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Please login with a sales account');
        } else if (response.status === 403) {
          throw new Error('Forbidden: Insufficient permissions');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      throw error;
    }
  }

  static async createCustomer(customerData: Omit<Customer, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Customer>> {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create customer:', error);
      throw error;
    }
  }

  static async updateCustomer(id: string, customerData: Partial<Customer>): Promise<ApiResponse<Customer>> {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to update customer:', error);
      throw error;
    }
  }

  static async deleteCustomer(id: string): Promise<ApiResponse<any>> {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to delete customer:', error);
      throw error;
    }
  }

  // Performance and Scoring API
  static async getUserPerformance(userId?: string, days: number = 30): Promise<ApiResponse<any>> {
    try {
      const url = userId 
        ? `${API_BASE_URL}/activities/performance/user/${userId}?days=${days}`
        : `${API_BASE_URL}/activities/performance/user?days=${days}`;
        
      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get user performance:', error);
      throw error;
    }
  }

  static async getActivityScore(activityId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/score/${activityId}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get activity score:', error);
      throw error;
    }
  }

  // AI Classification Confirmation API
  static async confirmAIClassification(activityId: string, confirmed: boolean, updates?: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/${activityId}/confirm-classification`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ confirmed, updates })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to confirm AI classification:', error);
      throw error;
    }
  }

  static async getPendingReviews(limit: number = 10): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/pending-review?limit=${limit}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get pending reviews:', error);
      throw error;
    }
  }

  // Analytics API
  static async getDashboardAnalytics(months: number = 12): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/activities/analytics/dashboard?months=${months}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get dashboard analytics:', error);
      throw error;
    }
  }

  // Kanban Board API
  static async initDefaultBoard(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/boards/init-default`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to initialize default board:', error);
      throw error;
    }
  }

  static async getBoards(type?: string): Promise<ApiResponse<any[]>> {
    try {
      const url = type ? `${API_BASE_URL}/boards?type=${type}` : `${API_BASE_URL}/boards`;
      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get boards:', error);
      throw error;
    }
  }

  static async getBoard(boardId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/boards/${boardId}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get board:', error);
      throw error;
    }
  }

  static async createBoard(boardData: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/boards`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(boardData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to create board:', error);
      throw error;
    }
  }

  static async updateBoard(boardId: string, boardData: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/boards/${boardId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(boardData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to update board:', error);
      throw error;
    }
  }

  static async deleteBoard(boardId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/boards/${boardId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to delete board:', error);
      throw error;
    }
  }

  // Tasks API
  static async getTasks(params?: { boardId?: string; status?: string; assigneeId?: string }): Promise<ApiResponse<any[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.boardId) queryParams.append('boardId', params.boardId);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.assigneeId) queryParams.append('assigneeId', params.assigneeId);
      
      const url = `${API_BASE_URL}/tasks${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get tasks:', error);
      throw error;
    }
  }

  static async getTask(taskId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get task:', error);
      throw error;
    }
  }

  static async createTask(taskData: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(taskData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  static async updateTask(taskId: string, taskData: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(taskData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }

  static async deleteTask(taskId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }

  // Users API (for task assignment)
  static async getUsers(): Promise<ApiResponse<any[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get users:', error);
      throw error;
    }
  }
}

export default ApiService; 