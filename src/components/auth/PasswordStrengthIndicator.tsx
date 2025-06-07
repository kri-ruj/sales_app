import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number;
  strengthLabel: string;
  requirements?: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    minUniqueChars: number;
  };
}

interface PasswordStrengthIndicatorProps {
  password: string;
  validation: PasswordValidationResult | null;
  isLoading: boolean;
  className?: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  validation,
  isLoading,
  className = ''
}) => {
  const getStrengthColor = (score: number) => {
    if (score < 3) return 'text-red-600';
    if (score < 5) return 'text-orange-500';
    if (score < 7) return 'text-yellow-500';
    if (score < 8.5) return 'text-primary-500';
    return 'text-green-600';
  };

  const getStrengthBarColor = (score: number) => {
    if (score < 3) return 'bg-red-500';
    if (score < 5) return 'bg-orange-500';
    if (score < 7) return 'bg-yellow-500';
    if (score < 8.5) return 'bg-primary-500';
    return 'bg-green-500';
  };

  const getProgressWidth = (score: number) => {
    return Math.min((score / 10) * 100, 100);
  };

  // Check individual requirements
  const checkRequirement = (requirement: string, password: string) => {
    switch (requirement) {
      case 'length':
        return password.length >= 12;
      case 'uppercase':
        return /[A-Z]/.test(password);
      case 'lowercase':
        return /[a-z]/.test(password);
      case 'numbers':
        return /\d/.test(password);
      case 'special':
        return /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password);
      case 'unique':
        return new Set(password.toLowerCase()).size >= 8;
      default:
        return false;
    }
  };

  const requirements = [
    { key: 'length', label: 'At least 12 characters' },
    { key: 'uppercase', label: 'One uppercase letter' },
    { key: 'lowercase', label: 'One lowercase letter' },
    { key: 'numbers', label: 'One number' },
    { key: 'special', label: 'One special character (!@#$%^&*)' },
    { key: 'unique', label: 'At least 8 unique characters' },
  ];

  if (!password) {
    return null;
  }

  return (
    <div className={`mt-3 ${className}`}>
      {/* Password Strength Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Password Strength</span>
          {validation && (
            <span className={`text-sm font-semibold ${getStrengthColor(validation.score)}`}>
              {validation.strengthLabel}
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              validation ? getStrengthBarColor(validation.score) : 'bg-gray-300'
            }`}
            style={{
              width: validation ? `${getProgressWidth(validation.score)}%` : '0%'
            }}
          ></div>
        </div>
        {validation && (
          <div className="text-xs text-gray-500 mt-1">
            Score: {validation.score}/10
          </div>
        )}
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</h4>
        {requirements.map((req) => {
          const isMet = checkRequirement(req.key, password);
          return (
            <div key={req.key} className="flex items-center space-x-2">
              {isMet ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`text-sm ${
                  isMet ? 'text-green-700' : 'text-gray-600'
                }`}
              >
                {req.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Validation Errors */}
      {validation && validation.errors.length > 0 && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800 mb-1">
                Password Issues:
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mt-2 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Checking password strength...</span>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator; 