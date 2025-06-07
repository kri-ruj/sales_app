import { IDeal } from '../../backend/src/models/Deal'; // Adjust path as needed

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    current: number;
    total: number;
    count: number;
    totalDeals: number;
  };
  error?: string;
  details?: any;
}

export interface SummarizationResult {
  summary: string;
  keywords?: string[];
  language?: string;
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const data = await response.json();
  if (!response.ok) {
    console.error('API Error:', data);
    return { 
      success: false, 
      data: null as T, // Explicitly type null as T
      error: data.error || 'An unknown error occurred', 
      message: data.message, 
      details: data.details 
    };
  }
  return { success: true, ...data };
}

// Get all deals
export const getAllDeals = async (params: any = {}): Promise<ApiResponse<IDeal[]>> => {
  const queryParams = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/deals?${queryParams}`);
  return handleResponse<IDeal[]>(response);
};

// Get a single deal by ID
export const getDealById = async (id: string): Promise<ApiResponse<IDeal>> => {
  const response = await fetch(`${API_BASE_URL}/deals/${id}`);
  return handleResponse<IDeal>(response);
};

// Create a new deal
export const createDeal = async (dealData: Partial<IDeal>): Promise<ApiResponse<IDeal>> => {
  const response = await fetch(`${API_BASE_URL}/deals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dealData),
  });
  return handleResponse<IDeal>(response);
};

// Update an existing deal
export const updateDeal = async (id: string, dealData: Partial<IDeal>): Promise<ApiResponse<IDeal>> => {
  const response = await fetch(`${API_BASE_URL}/deals/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dealData),
  });
  return handleResponse<IDeal>(response);
};

// Delete a deal
export const deleteDeal = async (id: string): Promise<ApiResponse<null>> => {
  const response = await fetch(`${API_BASE_URL}/deals/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<null>(response);
};

// Get deal statistics
export const getDealStats = async (): Promise<ApiResponse<any>> => {
  const response = await fetch(`${API_BASE_URL}/deals/stats`);
  return handleResponse<any>(response);
};

// Get AI-generated summary for a deal
export const getDealSummary = async (dealId: string): Promise<ApiResponse<SummarizationResult>> => {
  const response = await fetch(`${API_BASE_URL}/deals/${dealId}/summary`);
  return handleResponse<SummarizationResult>(response);
};

// Auto-fill deal from transcription
export const autoFillFromTranscription = async (dealId: string, transcription: string, language: string = 'th'): Promise<ApiResponse<any>> => {
  const response = await fetch(`${API_BASE_URL}/deals/${dealId}/auto-fill`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transcription, language }),
  });
  return handleResponse<any>(response);
};

// Approve AI suggestions
export const approveAISuggestions = async (dealId: string, selectedFields: Record<string, boolean>): Promise<ApiResponse<IDeal>> => {
  const response = await fetch(`${API_BASE_URL}/deals/${dealId}/approve-suggestions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ selectedFields }),
  });
  return handleResponse<IDeal>(response);
}; 