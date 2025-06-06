import React, { useState, FormEvent, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

// Native debounce function to avoid lodash dependency issues
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number;
  strengthLabel: string;
}

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationResult | null>(null);
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);
  
  const navigate = useNavigate();
  const { register, isLoading, error: authError } = useAuth();
  const [pageError, setPageError] = useState<string | null>(null);

  // Debounced password validation function
  const validatePasswordDebounced = useCallback(
    debounce(async (pwd: string, personalInfo: string[]) => {
      if (!pwd || pwd.length < 3) {
        setPasswordValidation(null);
        setIsValidatingPassword(false);
        return;
      }

      setIsValidatingPassword(true);
      
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5999/api'}/auth/validate-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: pwd,
            personalInfo: personalInfo.filter(info => info && info.length > 0)
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          setPasswordValidation({
            isValid: data.data.isValid,
            errors: data.data.errors,
            score: data.data.score,
            strengthLabel: data.data.strengthLabel
          });
        }
      } catch (error) {
        console.error('Password validation error:', error);
        // Don't show validation errors if API is unavailable
        setPasswordValidation(null);
      } finally {
        setIsValidatingPassword(false);
      }
    }, 500),
    [setPasswordValidation, setIsValidatingPassword]
  );

  // Validate password when it changes or personal info changes
  useEffect(() => {
    const personalInfo = [username, email, firstName, lastName];
    validatePasswordDebounced(password, personalInfo);
  }, [password, username, email, firstName, lastName, validatePasswordDebounced]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPageError(null);

    // Client-side validation
    if (password !== confirmPassword) {
      setPageError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    // Check password strength
    if (passwordValidation && !passwordValidation.isValid) {
      setPageError('รหัสผ่านไม่ตรงตามข้อกำหนดความปลอดภัย กรุณาแก้ไขปัญหาที่ระบุด้านล่าง');
      return;
    }
    
    try {
      await register({ username, email, password, firstName, lastName });
      alert('ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ'); 
      navigate('/login');
    } catch (err: any) {
      console.error('Register page caught error:', err);
    }
  };

  const isFormValid = () => {
    return (
      username && 
      email && 
      password && 
      confirmPassword && 
      firstName && 
      lastName &&
      password === confirmPassword &&
      passwordValidation?.isValid
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-cyan-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-4xl font-extrabold text-gray-900">
            สร้างบัญชีใหม่
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            เข้าร่วมทีม Bright Sales AI
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Registration Form */}
          <div>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {(authError || pageError) && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                  <strong className="font-bold">เกิดข้อผิดพลาด!</strong>
                  <span className="block sm:inline"> {authError || pageError}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    ชื่อจริง
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    disabled={isLoading}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="สมชาย"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    นามสกุล
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    disabled={isLoading}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="ใจดี"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    ชื่อผู้ใช้ (Username)
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    disabled={isLoading}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="somchai_sales"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
                    อีเมล
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={isLoading}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="somchai.j@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    รหัสผ่าน
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    disabled={isLoading}
                    className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 sm:text-sm ${
                      passwordValidation?.isValid === false ? 'border-red-500 focus:border-red-500' : 
                      passwordValidation?.isValid === true ? 'border-green-500 focus:border-green-500' : 
                      'border-gray-300 focus:border-indigo-500'
                    }`}
                    placeholder="ความปลอดภัยสูง"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    ยืนยันรหัสผ่าน
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    disabled={isLoading}
                    className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 sm:text-sm ${
                      confirmPassword && password !== confirmPassword ? 'border-red-500 focus:border-red-500' :
                      confirmPassword && password === confirmPassword ? 'border-green-500 focus:border-green-500' :
                      'border-gray-300 focus:border-indigo-500'
                    }`}
                    placeholder="ยืนยันรหัสผ่าน"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">รหัสผ่านไม่ตรงกัน</p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="mt-1 text-sm text-green-600">รหัสผ่านตรงกัน ✓</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || !isFormValid()}
                  className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-colors duration-150 ease-in-out ${
                    isLoading || !isFormValid()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  }`}
                >
                  {isLoading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'ลงทะเบียน'
                  )}
                </button>
              </div>
            </form>
            
            <p className="mt-8 text-center text-sm text-gray-600">
              มีบัญชีอยู่แล้ว?{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                ลงชื่อเข้าใช้ที่นี่
              </Link>
            </p>
          </div>

          {/* Password Strength Indicator */}
          <div className="lg:pl-8">
            <PasswordStrengthIndicator
              password={password}
              validation={passwordValidation}
              isLoading={isValidatingPassword}
              className="sticky top-8"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 