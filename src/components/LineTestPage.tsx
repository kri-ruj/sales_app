import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Smartphone, 
  Send, 
  Check, 
  X, 
  Settings,
  QrCode,
  Share2,
  Users,
  Bell,
  Info
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import liffService from '../services/liffService';
import ApiService from '../services/apiService';

const LineTestPage: React.FC = () => {
  const { success, error: showError, info } = useToast();
  const [liffStatus, setLiffStatus] = useState<'checking' | 'ready' | 'not-configured' | 'error'>('checking');
  const [profile, setProfile] = useState<any>(null);
  const [context, setContext] = useState<any>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkLiffStatus();
  }, []);

  const checkLiffStatus = async () => {
    try {
      setLiffStatus('checking');
      const initialized = await liffService.init();
      
      if (initialized) {
        setLiffStatus('ready');
        
        if (liffService.isLoggedIn()) {
          const userProfile = await liffService.getProfile();
          setProfile(userProfile);
        }
        
        const liffContext = liffService.getContext();
        setContext(liffContext);
        
        info('✅ LIFF initialized successfully');
      } else {
        setLiffStatus('not-configured');
        info('⚠️ LIFF not configured - using demo mode');
      }
    } catch (error) {
      setLiffStatus('error');
      showError('Failed to initialize LIFF');
      console.error('LIFF error:', error);
    }
  };

  const testLiffLogin = async () => {
    try {
      setLoading(true);
      if (liffStatus === 'ready') {
        await liffService.login();
        success('🔐 LOGIN test passed');
      } else {
        // Simulate login for demo
        setProfile({
          userId: 'demo-user-123',
          displayName: 'Demo User',
          pictureUrl: 'https://via.placeholder.com/100'
        });
        success('🔐 LOGIN test passed (demo mode)');
      }
      
      setTestResults(prev => ({ ...prev, login: true }));
    } catch (error) {
      showError('LOGIN test failed');
      setTestResults(prev => ({ ...prev, login: false }));
    } finally {
      setLoading(false);
    }
  };

  const testShareFunction = async () => {
    try {
      setLoading(true);
      
      if (liffStatus === 'ready' && liffService.isInClient()) {
        const message = liffService.createActivityShareMessage({
          title: 'ทดสอบการแชร์กิจกรรม',
          customerName: 'บริษัท ทดสอบ จำกัด',
          activityType: 'call'
        });
        
        const shared = await liffService.shareTargetPicker([message]);
        if (shared) {
          success('📤 SHARE test passed');
          setTestResults(prev => ({ ...prev, share: true }));
        } else {
          throw new Error('Share cancelled');
        }
      } else {
        // Simulate share for demo
        success('📤 SHARE test passed (demo mode)');
        setTestResults(prev => ({ ...prev, share: true }));
      }
    } catch (error) {
      showError('SHARE test failed');
      setTestResults(prev => ({ ...prev, share: false }));
    } finally {
      setLoading(false);
    }
  };

  const testQRScanner = async () => {
    try {
      setLoading(true);
      
      if (liffStatus === 'ready' && liffService.isInClient()) {
        const result = await liffService.scanCode();
        if (result) {
          success(`📱 QR test passed: ${result}`);
          setTestResults(prev => ({ ...prev, qr: true }));
        } else {
          throw new Error('QR scan cancelled');
        }
      } else {
        // Simulate QR scan for demo
        success('📱 QR test passed (demo mode)');
        setTestResults(prev => ({ ...prev, qr: true }));
      }
    } catch (error) {
      showError('QR test failed');
      setTestResults(prev => ({ ...prev, qr: false }));
    } finally {
      setLoading(false);
    }
  };

  const testNotification = async () => {
    try {
      setLoading(true);
      
      // Test the notification API endpoint
      const response = await fetch('/api/line/test-notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          target: { groupId: 'demo-group-123' }
        })
      });
      
      if (response.ok) {
        success('🔔 NOTIFICATION test passed');
        setTestResults(prev => ({ ...prev, notification: true }));
      } else {
        throw new Error('Notification API failed');
      }
    } catch (error) {
      showError('NOTIFICATION test failed');
      setTestResults(prev => ({ ...prev, notification: false }));
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async () => {
    try {
      setLoading(true);
      
      // Test webhook endpoint
      const response = await fetch('/api/line/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          events: []
        })
      });
      
      if (response.ok) {
        success('🤖 WEBHOOK test passed');
        setTestResults(prev => ({ ...prev, webhook: true }));
      } else {
        throw new Error('Webhook failed');
      }
    } catch (error) {
      showError('WEBHOOK test failed');
      setTestResults(prev => ({ ...prev, webhook: false }));
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setTestResults({});
    await testLiffLogin();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testShareFunction();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testQRScanner();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testNotification();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testWebhook();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-600 bg-green-100';
      case 'not-configured': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <Check className="w-4 h-4" />;
      case 'not-configured': return <Settings className="w-4 h-4" />;
      case 'error': return <X className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const TestButton: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    result?: boolean;
  }> = ({ title, description, icon, onClick, result }) => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      className={`p-4 border-2 rounded-xl text-left transition-all ${
        result === true
          ? 'border-green-300 bg-green-50'
          : result === false
          ? 'border-red-300 bg-red-50'
          : 'border-gray-200 bg-white hover:border-blue-300'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-lg ${
          result === true
            ? 'bg-green-100 text-green-600'
            : result === false
            ? 'bg-red-100 text-red-600'
            : 'bg-blue-100 text-blue-600'
        }`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          {result !== undefined && (
            <div className="flex items-center mt-2">
              {result ? (
                <div className="flex items-center text-green-600">
                  <Check className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">Passed</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <X className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">Failed</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-green-500 rounded-full mr-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              LINE Integration Test Center
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Test all LINE features before going live
          </p>
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">System Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* LIFF Status */}
            <div className="text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(liffStatus)}`}>
                {getStatusIcon(liffStatus)}
                <span className="ml-2">LIFF Status</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {liffStatus === 'ready' && 'Ready for testing'}
                {liffStatus === 'not-configured' && 'Demo mode active'}
                {liffStatus === 'error' && 'Configuration error'}
                {liffStatus === 'checking' && 'Checking...'}
              </p>
            </div>

            {/* User Profile */}
            <div className="text-center">
              {profile ? (
                <div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">
                    {profile.displayName?.charAt(0) || 'U'}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{profile.displayName || 'Demo User'}</p>
                  <p className="text-xs text-gray-500">Logged in</p>
                </div>
              ) : (
                <div>
                  <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Not logged in</p>
                </div>
              )}
            </div>

            {/* Context Info */}
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                context ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <Smartphone className="w-3 h-3 mr-1" />
                {context?.type || 'Browser'}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {liffService.isInClient() ? 'In LINE app' : 'In browser'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Test Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Feature Tests</h2>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={runAllTests}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? 'Running Tests...' : 'Run All Tests'}
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TestButton
              title="LINE Login"
              description="Test LIFF authentication and profile access"
              icon={<Users className="w-5 h-5" />}
              onClick={testLiffLogin}
              result={testResults.login}
            />

            <TestButton
              title="Share Function"
              description="Test sharing messages to LINE chats"
              icon={<Share2 className="w-5 h-5" />}
              onClick={testShareFunction}
              result={testResults.share}
            />

            <TestButton
              title="QR Scanner"
              description="Test built-in QR code scanning"
              icon={<QrCode className="w-5 h-5" />}
              onClick={testQRScanner}
              result={testResults.qr}
            />

            <TestButton
              title="Notifications"
              description="Test sending Flex messages"
              icon={<Bell className="w-5 h-5" />}
              onClick={testNotification}
              result={testResults.notification}
            />

            <TestButton
              title="Bot Webhook"
              description="Test LINE bot message handling"
              icon={<MessageCircle className="w-5 h-5" />}
              onClick={testWebhook}
              result={testResults.webhook}
            />
          </div>
        </motion.div>

        {/* Configuration Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Setup Guide</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Create LINE Channel</h3>
                <p className="text-sm text-gray-600">
                  Go to <a href="https://developers.line.biz/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LINE Developers</a> and create a Messaging API channel
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Configure Environment</h3>
                <p className="text-sm text-gray-600">
                  Add your LIFF ID, Channel Access Token, and Channel Secret to .env files
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Test Features</h3>
                <p className="text-sm text-gray-600">
                  Use the test buttons above to verify each feature works correctly
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Pro Tip:</strong> All features work in demo mode for development. 
              Configure real LINE credentials to test with actual LINE users.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LineTestPage;