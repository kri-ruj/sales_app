import { ApiService, ApiResponse } from './apiService'; // Assuming apiService.ts is in the same directory or adjust path

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api'; // Fixed URL to match backend

// Define interfaces for request and response data explicitly
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'manager' | 'sales' | 'user';
}

export interface UserData {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  token: string;
  mfaRequired?: boolean;
  mfaEnabled?: boolean;
  // Add other user fields if necessary, e.g., isActive, lastLogin
}

class AuthService extends ApiService {

  async login(credentials: LoginCredentials): Promise<UserData> {
    try {
      console.log('Login attempt to:', `${API_BASE_URL}/auth/login`);
      console.log('Credentials:', { email: credentials.email, password: '***' });
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        if (response.status === 0 || !response.status) {
          throw new Error('Cannot connect to server. Please check if the backend is running.');
        }
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData || 'Login failed'}`);
      }

      const data: ApiResponse<UserData> = await response.json();
      console.log('Response data:', data);
      
      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }
      
      if (data.data.token) {
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data)); // Store user data
      }
      return data.data;
    } catch (error) {
      console.error('AuthService Login Error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Please check if the backend is running on http://localhost:3001');
      }
      throw error;
    }
  }

  async register(userData: RegisterData): Promise<UserData> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      const data: ApiResponse<UserData> = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Registration failed');
      }
      // Optionally, log in the user directly by storing the token
      if (data.data.token) {
        // localStorage.setItem('authToken', data.data.token);
        // localStorage.setItem('user', JSON.stringify(data.data)); 
      }
      return data.data;
    } catch (error) {
      console.error('AuthService Register Error:', error);
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // Optionally, notify backend or perform other cleanup
    console.log('User logged out');
  }

  getCurrentUser(): UserData | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr) as UserData;
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
        localStorage.removeItem('user'); // Clear corrupted data
        localStorage.removeItem('authToken');
        return null;
      }
    }
    return null;
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Optional: Fetch user profile from backend if only token is stored
  async fetchUserProfile(): Promise<UserData | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        this.logout(); // Token might be invalid or expired
        throw new Error('Failed to fetch user profile');
      }
      
      const userData = await response.json(); // /auth/me returns user data directly, not wrapped in success/data
      
      // Add token to user data since /me doesn't return it
      const userWithToken = { ...userData, token };
      
      localStorage.setItem('user', JSON.stringify(userWithToken)); // Update user data
      return userWithToken;
    } catch (error) {
      console.error('AuthService fetchUserProfile Error:', error);
      this.logout(); // Logout on error
      return null;
    }
  }

  // New method for processing LINE callback
  async processLineCallback(code: string, state?: string): Promise<UserData> {
    try {
      // The backend's /api/auth/line/callback expects GET, so we adjust.
      // We are essentially proxying this GET request from the frontend client 
      // to our backend, which then communicates with LINE.
      const queryParams = new URLSearchParams({ code });
      if (state) {
        queryParams.append('state', state);
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/line/callback?${queryParams.toString()}`, {
        method: 'GET', // Match backend route
        headers: {
          // No Content-Type needed for GET with query params
        },
      });

      const data: ApiResponse<UserData> = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'LINE login callback processing failed');
      }
      
      // If backend returns user data and a new app token, handle it like a normal login
      if (data.data.token) {
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
      }
      return data.data;
    } catch (error) {
      console.error('AuthService processLineCallback Error:', error);
      this.logout(); // Clear any partial login state on error
      throw error;
    }
  }
}

const authService = new AuthService();
export default authService; 