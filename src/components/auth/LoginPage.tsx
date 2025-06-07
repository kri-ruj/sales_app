import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CEOInspiration from '../ui/CEOInspiration';
// import AuthService from '../../services/authService'; // AuthService is used within useAuth

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('');
  // const [error, setError] = useState<string | null>(null); // Error state is now handled by AuthContext
  // const [loading, setLoading] = useState(false); // Loading state is now handled by AuthContext
  const navigate = useNavigate();
  const { login, isLoading, error: authError } = useAuth(); // Get login, isLoading, and error from AuthContext

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // setError(null); // Handled by AuthContext
    // setLoading(true); // Handled by AuthContext

    try {
      await login({ email, password });
      navigate('/'); // Redirect to dashboard or home page after successful login
    } catch (err: any) {
      // Error is already set in AuthContext by the login function
      // setError(err.response?.data?.message || err.message || 'Failed to login. Please check your credentials.');
      console.error('Login page caught error:', err); // Optional: for debugging
    }
    // setLoading(false); // Handled by AuthContext
  };

  const handleMockLogin = async () => {
    try {
      console.log('Starting direct API call...');
      console.log('Attempting to connect to: http://localhost:5999/api/auth/login');
      
      // Directly test the API call with hardcoded URL for debugging
      const response = await fetch('http://localhost:5999/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: 'test@test.com', 
          password: 'test123' 
        }),
      });
      
      console.log('Response received:', response);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const data = await response.json();
      console.log('Direct API Response:', data);
      
      if (data.success && data.data.token) {
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        navigate('/');
      } else {
        console.error('Mock login failed:', data);
      }
    } catch (err) {
      console.error('Mock login error:', err);
      console.error('Error type:', typeof err);
      console.error('Error message:', err instanceof Error ? err.message : 'Unknown error');
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      
      // Check if it's a network error
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.error('This appears to be a network/CORS error');
        console.error('Make sure:');
        console.error('1. Backend is running on port 5999');
        console.error('2. CORS is properly configured');
        console.error('3. Frontend URL is in CORS whitelist');
      }
    }
  };

  const handleLineLogin = () => {
    // Redirect to backend endpoint that initiates LINE OAuth flow
    // The backend will then redirect to LINE's authorization server
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5999/api'}/auth/line`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
      <div className="w-full max-w-md lg:max-w-4xl flex flex-col lg:flex-row gap-8">
        {/* CEO Inspiration Section */}
        <div className="hidden lg:block lg:w-1/2">
          <CEOInspiration 
            quote="ความสำเร็จของทีมขายคือหัวใจสำคัญของ Freshket เราเชื่อว่าการส่งมอบวัตถุดิบสดใหม่คุณภาพสูงให้กับร้านอาหาร ไม่ใช่แค่การขาย แต่คือการสร้างความสัมพันธ์ที่ยั่งยืน"
            imageUrl="/ceo-freshket.jpg"
            ceoName="Ponglada (Bell)"
            variant="full"
            className="h-full"
          />
        </div>
        
        {/* Login Form Section */}
        <div className="w-full lg:w-1/2 bg-white rounded-[24px] shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">F</span>
            </div>
          </div>
          <h1 className="text-[32px] font-bold text-gray-900 mb-2">Freshket Sales</h1>
          <p className="text-[16px] text-gray-600">ระบบบริหารการขายสำหรับทีม Freshket</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {authError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">
                    เกิดข้อผิดพลาด! {authError}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Email Input */}
          <div>
            <input
              type="email"
              placeholder="test@test.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-4 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50"
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <input
              type="password"
              placeholder="•••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-4 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50"
              required
            />
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link 
              to="/forgot-password" 
              className="text-[14px] text-primary-600 hover:text-primary-700 font-medium"
            >
              สมัครสำหรับ?
            </Link>
          </div>

          {/* Login Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                isLoading
                  ? 'bg-primary-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>กำลังเข้าสู่ระบบ...</span>
                </div>
              ) : (
                'ลงชื่อเข้าใช้'
              )}
            </button>
          </div>

          {/* Test User Button */}
          <div>
            <button
              type="button"
              onClick={handleMockLogin}
              disabled={isLoading}
              className={`w-full py-3 px-4 border border-gray-200 rounded-lg font-medium transition-all duration-200 ${
                isLoading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 active:scale-[0.98]'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>เข้าใช้ด้วย Test User</span>
              </div>
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">หรือดำเนินการต่อด้วย</span>
          </div>
        </div>

        {/* LINE Login Button */}
        <div>
          <button
            type="button"
            onClick={handleLineLogin}
            disabled={isLoading}
            className={`w-full py-4 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
              isLoading
                ? 'bg-green-400 cursor-not-allowed'
                : 'bg-[#06C755] hover:bg-[#05B04A] active:scale-[0.98]'
            }`}
          >
            <div className="flex items-center justify-center space-x-3">
              <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
              </svg>
              <span>เข้าสู่ระบบด้วย LINE</span>
            </div>
          </button>
        </div>

        {/* Register Link */}
        <p className="text-center text-[14px] text-gray-600 mt-8">
          ยังไม่มีบัญชี?{' '}
          <Link 
            to="/register" 
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ลงทะเบียนที่นี่
          </Link>
        </p>
        
        {/* CEO Inspiration for Mobile */}
        <div className="lg:hidden mt-8">
          <CEOInspiration 
            quote="ทุกการขายคือโอกาสในการสร้างคุณค่า"
            imageUrl="/ceo-freshket.jpg"
            variant="compact"
          />
        </div>
      </div>
      </div>
    </div>
  );
};

export default LoginPage; 