import React, { useState, useEffect } from 'react';
import { Shield, Download, Copy, CheckCircle, AlertTriangle, Smartphone } from 'lucide-react';

interface MFASetupData {
  qrCode: string;
  manualEntryKey: string;
  backupCodes: string[];
  message: string;
}

interface MFASetupProps {
  onComplete: () => void;
  onCancel: () => void;
  authToken: string;
}

const MFASetup: React.FC<MFASetupProps> = ({ onComplete, onCancel, authToken }) => {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup-codes' | 'complete'>('setup');
  const [setupData, setSetupData] = useState<MFASetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  // Initialize MFA setup
  useEffect(() => {
    initiateMFASetup();
  }, []);

  const initiateMFASetup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5999/api'}/auth/mfa/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setSetupData(data.data);
        setStep('verify');
      } else {
        setError(data.message || 'Failed to setup MFA');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const verifySetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5999/api'}/auth/mfa/verify-setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationCode }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('backup-codes');
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = () => {
    if (setupData?.backupCodes) {
      const codesText = setupData.backupCodes.join('\n');
      navigator.clipboard.writeText(codesText);
      setCopiedBackupCodes(true);
      setTimeout(() => setCopiedBackupCodes(false), 2000);
    }
  };

  const downloadBackupCodes = () => {
    if (setupData?.backupCodes) {
      const codesText = setupData.backupCodes.join('\n');
      const blob = new Blob([codesText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bright-sales-backup-codes.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const completeSetup = () => {
    setStep('complete');
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  if (isLoading && !setupData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Setting up MFA...</span>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">เปิดใช้งาน Multi-Factor Authentication</h2>
        <p className="text-gray-600 mt-2">เพิ่มความปลอดภัยให้กับบัญชีของคุณ</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Step 1: QR Code Setup */}
      {step === 'verify' && setupData && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">สแกน QR Code ด้วยแอป Authenticator</h3>
            <div className="mx-auto mb-4 p-4 bg-white border-2 border-gray-200 rounded-lg inline-block">
              <img 
                src={setupData.qrCode} 
                alt="MFA QR Code" 
                className="w-48 h-48 mx-auto"
              />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              ใช้แอปเช่น Google Authenticator, Authy หรือ Microsoft Authenticator
            </p>
          </div>

          {/* Manual entry */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Smartphone className="w-5 h-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">หรือป้อนรหัสด้วยตนเอง:</span>
            </div>
            <code className="text-sm font-mono bg-white p-2 rounded border block w-full">
              {setupData.manualEntryKey}
            </code>
          </div>

          {/* Verification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ป้อนรหัส 6 หลักจากแอป Authenticator
            </label>
            <input
              type="text"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-lg font-mono"
              placeholder="123456"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={verifySetup}
              disabled={isLoading || verificationCode.length !== 6}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'กำลังตรวจสอบ...' : 'ยืนยัน'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Backup Codes */}
      {step === 'backup-codes' && setupData && (
        <div className="space-y-6">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">MFA เปิดใช้งานสำเร็จ!</h3>
            <p className="text-gray-600">โปรดบันทึกรหัสสำรองเหล่านี้ไว้ในที่ปลอดภัย</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">สำคัญ:</h4>
                <p className="text-sm text-yellow-700">
                  รหัสสำรองเหล่านี้ใช้ได้เพียงครั้งเดียว และจะช่วยให้คุณเข้าถึงบัญชีได้หากสูญหาย Authenticator
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">รหัสสำรอง (ใช้ได้ครั้งเดียว):</h4>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {setupData.backupCodes.map((code, index) => (
                <code key={index} className="bg-white p-2 rounded border text-center font-mono text-sm">
                  {code}
                </code>
              ))}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={copyBackupCodes}
                className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copiedBackupCodes ? 'คัดลอกแล้ว!' : 'คัดลอก'}
              </button>
              <button
                onClick={downloadBackupCodes}
                className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                ดาวน์โหลด
              </button>
            </div>
          </div>

          <button
            onClick={completeSetup}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            เสร็จสิ้น
          </button>
        </div>
      )}

      {/* Step 3: Complete */}
      {step === 'complete' && (
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h3 className="text-lg font-semibold text-green-800">การตั้งค่า MFA เสร็จสมบูรณ์!</h3>
          <p className="text-gray-600">บัญชีของคุณมีความปลอดภัยเพิ่มขึ้นแล้ว</p>
        </div>
      )}
    </div>
  );
};

export default MFASetup; 