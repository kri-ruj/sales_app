import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthService from '../../services/authService'; // Keep for direct localStorage interaction if needed

const LineAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchUserSession } = useAuth(); // Use fetchUserSession to refresh auth state
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const processLineAuth = async () => {
      const searchParams = new URLSearchParams(location.search);
      const token = searchParams.get('token');
      const status = searchParams.get('status');
      const message = searchParams.get('message');

      if (status === 'success' && token) {
        try {
          // Store the token and user info (if backend provides it with token, or fetch separately)
          // For simplicity, assuming backend sends user info along with token, or token is enough
          localStorage.setItem('authToken', token);
          
          // AuthService could have a method to decode token and store user, or fetch user by token
          // For now, we will rely on fetchUserSession to use this new token
          await AuthService.fetchUserProfile(); // This will use the new token to get user and store it

          await fetchUserSession(); // Refresh AuthContext state based on new localStorage
          navigate('/'); // Redirect to dashboard
        } catch (err: any) {
          console.error('Error processing successful LINE auth:', err);
          setError(err.message || 'เกิดข้อผิดพลาดหลังจากการเข้าสู่ระบบด้วย LINE');
          AuthService.logout(); // Clear any partial auth state
        }
      } else if (status === 'error') {
        setError(message || 'การเข้าสู่ระบบด้วย LINE ล้มเหลว');
        AuthService.logout(); // Ensure user is logged out
      } else {
        setError('การตอบกลับจาก LINE ไม่ถูกต้อง');
        AuthService.logout();
      }
      setIsLoading(false);
    };

    processLineAuth();
  }, [location, navigate, fetchUserSession]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">กำลังตรวจสอบการเข้าสู่ระบบด้วย LINE...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">การเข้าสู่ระบบด้วย LINE ล้มเหลว</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            กลับไปหน้า Login
          </button>
        </div>
      </div>
    );
  }
  // Successfully processed, redirecting (or should be already navigated)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>กำลังเปลี่ยนเส้นทาง...</p>
    </div>
  );
};

export default LineAuthCallbackPage; 