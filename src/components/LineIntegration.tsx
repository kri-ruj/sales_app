import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import liffService, { LiffProfile, LiffContext } from '../services/liffService';
import ApiService from '../services/apiService';

interface LineIntegrationProps {
  onProfileLoad?: (profile: LiffProfile | null) => void;
  onContextLoad?: (context: LiffContext | null) => void;
}

const LineIntegration: React.FC<LineIntegrationProps> = ({ 
  onProfileLoad, 
  onContextLoad 
}) => {
  const { success, error: showError } = useToast();
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [context, setContext] = useState<LiffContext | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liffReady, setLiffReady] = useState(false);

  useEffect(() => {
    initializeLiff();
  }, []);

  const initializeLiff = async () => {
    try {
      setLoading(true);
      const initialized = await liffService.init();
      
      if (initialized) {
        setLiffReady(true);
        
        // Get user profile if logged in
        if (liffService.isLoggedIn()) {
          const userProfile = await liffService.getProfile();
          setProfile(userProfile);
          onProfileLoad?.(userProfile);
        }
        
        // Get LIFF context
        const liffContext = liffService.getContext();
        setContext(liffContext);
        onContextLoad?.(liffContext);
        
        // Get device info
        const info = liffService.getDeviceInfo();
        setDeviceInfo(info);
        
        success('🔗 LINE integration ready');
      } else {
        console.log('Running in web mode (not in LINE environment)');
      }
    } catch (error) {
      console.error('LIFF initialization error:', error);
      showError('Failed to initialize LINE integration');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await liffService.login();
    } catch (error) {
      console.error('LINE login error:', error);
      showError('Failed to login with LINE');
    }
  };

  const handleLogout = () => {
    try {
      liffService.logout();
      setProfile(null);
      onProfileLoad?.(null);
      success('👋 Logged out from LINE');
    } catch (error) {
      console.error('LINE logout error:', error);
      showError('Failed to logout from LINE');
    }
  };

  const handleShareActivity = async () => {
    try {
      const sampleActivity = {
        title: 'ทดสอบการแชร์กิจกรรม',
        customerName: 'คุณทดสอบ',
        activityType: 'call'
      };

      const message = liffService.createActivityShareMessage(sampleActivity);
      
      if (liffService.isInClient()) {
        const shared = await liffService.shareTargetPicker([message]);
        if (shared) {
          success('📤 Shared activity to LINE chat');
        } else {
          showError('Failed to share activity');
        }
      } else {
        showError('Share feature only available in LINE app');
      }
    } catch (error) {
      console.error('Share error:', error);
      showError('Failed to share activity');
    }
  };

  const handleShareDeal = async () => {
    try {
      const sampleDeal = {
        title: 'ทดสอบการแชร์ดีล',
        customerName: 'บริษัท ทดสอบ จำกัด',
        value: 250000
      };

      const message = liffService.createDealShareMessage(sampleDeal);
      
      if (liffService.isInClient()) {
        const shared = await liffService.shareTargetPicker([message]);
        if (shared) {
          success('📤 Shared deal to LINE chat');
        } else {
          showError('Failed to share deal');
        }
      } else {
        showError('Share feature only available in LINE app');
      }
    } catch (error) {
      console.error('Share error:', error);
      showError('Failed to share deal');
    }
  };

  const handleScanQR = async () => {
    try {
      const result = await liffService.scanCode();
      if (result) {
        success(`📷 QR Code scanned: ${result}`);
      } else {
        showError('QR scan not available or cancelled');
      }
    } catch (error) {
      console.error('QR scan error:', error);
      showError('Failed to scan QR code');
    }
  };

  const handleSendTestNotification = async () => {
    try {
      if (!context) {
        showError('No LINE context available');
        return;
      }

      const target = {
        groupId: context.groupId,
        userId: profile?.userId,
        chatRoomId: context.roomId
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/line/test-notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ target })
      });

      const result = await response.json();

      if (result.success) {
        success('📨 Test notification sent to LINE chat');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Notification error:', error);
      showError('Failed to send test notification');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mr-3"></div>
          <span className="text-gray-600">Initializing LINE integration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          📱 LINE Integration
        </h2>
        <p className="text-gray-600">
          {liffReady ? 'LINE integration is ready' : 'Running in web mode'}
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LIFF Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center mb-3">
            <div className={`w-3 h-3 rounded-full mr-2 ${liffReady ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <h3 className="font-semibold text-gray-900">LIFF Status</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Environment:</span>
              <span className={`font-medium ${liffService.isInClient() ? 'text-green-600' : 'text-blue-600'}`}>
                {liffService.isInClient() ? 'LINE App' : 'Web Browser'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Login Status:</span>
              <span className={`font-medium ${liffService.isLoggedIn() ? 'text-green-600' : 'text-gray-600'}`}>
                {liffService.isLoggedIn() ? 'Logged In' : 'Not Logged In'}
              </span>
            </div>
          </div>
        </div>

        {/* Context Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Context Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Chat Type:</span>
              <span className="font-medium">
                {context?.type || 'Unknown'}
              </span>
            </div>
            {context?.groupId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Group ID:</span>
                <span className="font-medium text-xs">{context.groupId.substring(0, 8)}...</span>
              </div>
            )}
            {context?.roomId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Room ID:</span>
                <span className="font-medium text-xs">{context.roomId.substring(0, 8)}...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Profile */}
      {profile && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">👤 User Profile</h3>
          <div className="flex items-center space-x-4">
            {profile.pictureUrl && (
              <img
                src={profile.pictureUrl}
                alt={profile.displayName}
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <p className="font-medium text-gray-900">{profile.displayName}</p>
              <p className="text-sm text-gray-600">{profile.userId}</p>
              {profile.statusMessage && (
                <p className="text-sm text-gray-500 italic">{profile.statusMessage}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Authentication */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">🔐 Authentication</h3>
        <div className="flex space-x-3">
          {!liffService.isLoggedIn() ? (
            <button
              onClick={handleLogin}
              disabled={!liffReady}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              🔗 Login with LINE
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              👋 Logout
            </button>
          )}
        </div>
      </div>

      {/* LIFF Features */}
      {liffReady && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">🚀 LINE Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={handleShareActivity}
              disabled={!liffService.isInClient()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              📤 Share Activity
            </button>
            
            <button
              onClick={handleShareDeal}
              disabled={!liffService.isInClient()}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
            >
              💼 Share Deal
            </button>
            
            <button
              onClick={handleScanQR}
              disabled={!liffService.isInClient() || !deviceInfo?.isApiAvailable?.scanCodeV2}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              📷 Scan QR Code
            </button>
            
            <button
              onClick={handleSendTestNotification}
              disabled={!context}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              📨 Test Notification
            </button>
          </div>
          
          {!liffService.isInClient() && (
            <p className="text-xs text-gray-500 mt-3 text-center">
              💡 Some features are only available when running in the LINE app
            </p>
          )}
        </div>
      )}

      {/* Device Info */}
      {deviceInfo && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">📱 Device Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>OS:</strong> {deviceInfo.os || 'Unknown'}</p>
              <p><strong>Language:</strong> {deviceInfo.language || 'Unknown'}</p>
              <p><strong>LIFF Version:</strong> {deviceInfo.version || 'Unknown'}</p>
              <p><strong>LINE Version:</strong> {deviceInfo.lineVersion || 'Unknown'}</p>
            </div>
            <div>
              <p className="font-medium mb-2">Available APIs:</p>
              <div className="space-y-1">
                {Object.entries(deviceInfo.isApiAvailable || {}).map(([api, available]) => (
                  <div key={api} className="flex justify-between">
                    <span className="text-gray-600">{api}:</span>
                    <span className={available ? 'text-green-600' : 'text-red-600'}>
                      {available ? '✅' : '❌'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LineIntegration;