import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthService, { UserData, LoginCredentials, RegisterData } from '../services/authService';

interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  fetchUserSession: () => Promise<void>; // To check session on app load
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(AuthService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!AuthService.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check user session on initial load
    fetchUserSession();
  }, []);

  const fetchUserSession = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const currentUser = AuthService.getCurrentUser();
      const token = AuthService.getToken();
      
      if (currentUser && token) {
        // Verify token with backend and refresh user data
        try {
          const refreshedUser = await AuthService.fetchUserProfile();
          if (refreshedUser) {
            setUser(refreshedUser);
            setIsAuthenticated(true);
          } else {
            AuthService.logout();
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (fetchError) {
          console.error('Failed to fetch backend user profile:', fetchError);
          // Fallback to localStorage data if backend fetch fails
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } else {
        AuthService.logout(); // Ensure clean state if one is missing
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err: any) {
      console.error('Error fetching user session:', err);
      AuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
      setError('Failed to verify session.');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await AuthService.login(credentials);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setIsAuthenticated(false);
      setUser(null);
      throw err; // Re-throw to be caught by the LoginPage component
    }
    setIsLoading(false);
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      await AuthService.register(userData);
      // After successful registration, typically the user is redirected to login
      // Or you can automatically log them in by calling login() or storing token here
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err; // Re-throw to be caught by the RegisterPage component
    }
    setIsLoading(false);
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
    // Optionally, redirect to login page
    // navigate('/login'); // If useNavigate is available here
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, error, login, register, logout, fetchUserSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 