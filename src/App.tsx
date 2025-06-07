import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useVoiceRecording } from './hooks/useVoiceRecording';
import { useRealtimeASR } from './hooks/useRealtimeASR';
import ApiService from './services/apiService';
import CustomerList from './components/CustomerList';
import DealList from './components/deals/DealList';
import DealForm from './components/deals/DealForm';
import DealDetail from './components/deals/DealDetail';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LineAuthCallbackPage from './components/auth/LineAuthCallbackPage';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ui/ToastContainer';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
import SearchAndFilter from './components/SearchAndFilter';
import SalesPipeline from './components/SalesPipeline';
import ExportReports from './components/ExportReports';
import LineIntegration from './components/LineIntegration';
import LineTestPage from './components/LineTestPage';
import KanbanBoard from './components/kanban/KanbanBoard';
import MagicUIDashboard from './components/deals/MagicUIDashboard';
import MagicUIDashboardLive from './components/deals/MagicUIDashboardLive';
import ImageUploadHelper from './components/ui/ImageUploadHelper';
import { VegetableSplineDemo } from './components/ui/VegetableSplineDemo';
import { VoiceSplineDemo } from './components/ui/VoiceSplineDemo';
import { useAuth } from './context/AuthContext';
import { useToast } from './hooks/useToast';

// Enhanced ActivitiesPage with categorization and scoring
const ActivitiesPage: React.FC = () => {
  const { success, error: showError, warning } = useToast();
  const [activities, setActivities] = useState<any[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<any[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingActivity, setReviewingActivity] = useState<any>(null);
  const [showPendingReviews, setShowPendingReviews] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const categories = [
    { value: 'all', label: 'ทั้งหมด', color: 'bg-gray-100 text-gray-800', icon: '📋' },
    { value: 'prospecting', label: 'การหาลูกค้า', color: 'bg-purple-100 text-purple-800', icon: '🔍' },
    { value: 'qualification', label: 'การคัดกรอง', color: 'bg-blue-100 text-blue-800', icon: '🎯' },
    { value: 'presentation', label: 'การนำเสนอ', color: 'bg-green-100 text-green-800', icon: '📊' },
    { value: 'negotiation', label: 'การเจรจา', color: 'bg-orange-100 text-orange-800', icon: '🤝' },
    { value: 'closing', label: 'การปิดการขาย', color: 'bg-red-100 text-red-800', icon: '✅' },
    { value: 'follow-up', label: 'การติดตาม', color: 'bg-indigo-100 text-indigo-800', icon: '📞' },
    { value: 'support', label: 'การสนับสนุน', color: 'bg-pink-100 text-pink-800', icon: '💬' }
  ];

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const [activitiesResult, pendingResult] = await Promise.all([
        ApiService.getActivities(),
        ApiService.getPendingReviews().catch(() => ({ success: false, data: [] }))
      ]);
      
      if (activitiesResult.success) {
        setActivities(activitiesResult.data);
      } else {
        throw new Error('Failed to fetch activities');
      }
      
      if (pendingResult.success) {
        setPendingReviews(pendingResult.data);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchActivities();
  }, []);

  const handleSearchResults = (results: any[]) => {
    setSearchResults(results);
    setFilteredActivities(results);
  };

  const handleSearchLoading = (isLoading: boolean) => {
    setSearchLoading(isLoading);
  };

  const handleConfirmClassification = async (activityId: string, confirmed: boolean, updates?: any) => {
    try {
      const result = await ApiService.confirmAIClassification(activityId, confirmed, updates);
      if (result.success) {
        success(confirmed ? '✅ AI การจำแนกได้รับการยืนยัน' : '❌ AI การจำแนกถูกปฏิเสธ');
        
        // Refresh data
        await fetchActivities();
        
        // Close modal
        setShowReviewModal(false);
        setReviewingActivity(null);
      } else {
        throw new Error(result.message || 'Failed to confirm classification');
      }
    } catch (error) {
      console.error('Error confirming classification:', error);
      showError('เกิดข้อผิดพลาดในการยืนยัน: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const openReviewModal = (activity: any) => {
    setReviewingActivity(activity);
    setShowReviewModal(true);
  };

  React.useEffect(() => {
    let filtered = [...activities];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(activity => activity.category === selectedCategory);
    }
    
    // Sort activities
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.activityScore || 0) - (a.activityScore || 0);
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'customer':
          return a.customerName.localeCompare(b.customerName);
        default:
          return 0;
      }
    });
    
    setFilteredActivities(filtered);
  }, [activities, selectedCategory, sortBy]);

  const getCategoryInfo = (category: string) => {
    return categories.find(cat => cat.value === category) || categories[0];
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    if (score >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="text-6xl animate-bounce mx-auto">🥦</div>
        <p className="mt-2 text-green-600 font-medium animate-pulse">🌱 กำลังโหลดกิจกรรมผักสด...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">❌ Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with Statistics */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-gray-900">🥒 กิจกรรมขายผักสด</h2>
          <div className="flex items-center gap-4">
            {pendingReviews.length > 0 && (
              <button
                onClick={() => setShowPendingReviews(!showPendingReviews)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  showPendingReviews
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                🤖 รอการยืนยัน ({pendingReviews.length})
              </button>
            )}
            <div className="text-sm text-gray-600">
              {filteredActivities.length} จาก {activities.length} รายการ
            </div>
          </div>
        </div>
        
        {/* Category Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((category) => {
            const vegCategoryColors = {
              'all': 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
              'prospecting': 'bg-gradient-to-r from-lime-500 to-green-500 text-white',
              'qualification': 'bg-gradient-to-r from-teal-500 to-green-500 text-white',
              'presentation': 'bg-gradient-to-r from-green-600 to-emerald-600 text-white',
              'negotiation': 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
              'closing': 'bg-gradient-to-r from-green-700 to-green-600 text-white',
              'follow-up': 'bg-gradient-to-r from-lime-600 to-green-600 text-white',
              'support': 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white'
            };
            
            return (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all transform hover:scale-105 ${
                  selectedCategory === category.value
                    ? vegCategoryColors[category.value as keyof typeof vegCategoryColors] + ' shadow-lg scale-105'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {category.icon} {category.label}
                {category.value !== 'all' && (
                  <span className="ml-1 text-xs">
                    ({activities.filter(a => a.category === category.value).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">เรียงตาม:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">วันที่ล่าสุด</option>
            <option value="score">คะแนนสูงสุด</option>
            <option value="customer">ชื่อลูกค้า</option>
          </select>
        </div>
      </div>

      {/* Search and Filter */}
      <SearchAndFilter
        searchType="activities"
        onResultsChange={handleSearchResults}
        onLoadingChange={handleSearchLoading}
      />

      {/* Pending Reviews Section */}
      {showPendingReviews && pendingReviews.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
            🤖 กิจกรรมที่รอการยืนยันจาก AI
            <span className="ml-2 px-2 py-1 bg-yellow-200 text-yellow-800 text-sm rounded-full">
              {pendingReviews.length} รายการ
            </span>
          </h3>
          
          <div className="grid gap-4">
            {pendingReviews.map((activity) => (
              <div key={activity._id} className="bg-white border border-yellow-300 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-600">👤 {activity.customerName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      {Math.round((activity.aiClassification?.confidence || 0) * 100)}% แน่ใจ
                    </span>
                    <button
                      onClick={() => openReviewModal(activity)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      📝 ตรวจสอบ
                    </button>
                  </div>
                </div>
                
                {activity.aiClassification && (
                  <div className="bg-gray-50 rounded-lg p-3 mt-3">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>AI แนะนำ:</strong> {activity.aiClassification.suggestedCategory}
                      {activity.aiClassification.suggestedSubCategory && ` → ${activity.aiClassification.suggestedSubCategory}`}
                    </p>
                    {activity.transcription && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        "{activity.transcription}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && reviewingActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">🤖 ตรวจสอบการจำแนกของ AI</h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{reviewingActivity.title}</h4>
                  <p className="text-gray-600">👤 {reviewingActivity.customerName}</p>
                </div>

                {reviewingActivity.transcription && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h5 className="font-medium text-blue-900 mb-2">🎤 บันทึกเสียง</h5>
                    <p className="text-blue-800 text-sm">{reviewingActivity.transcription}</p>
                  </div>
                )}

                {reviewingActivity.aiClassification && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h5 className="font-medium text-purple-900 mb-3">🧠 การจำแนกของ AI</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-purple-800">หมวดหมู่:</span>
                        <p className="text-purple-700">{reviewingActivity.aiClassification.suggestedCategory}</p>
                      </div>
                      <div>
                        <span className="font-medium text-purple-800">หมวดย่อย:</span>
                        <p className="text-purple-700">{reviewingActivity.aiClassification.suggestedSubCategory || 'ไม่ระบุ'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-purple-800">ความมั่นใจ:</span>
                        <p className="text-purple-700">{Math.round((reviewingActivity.aiClassification.confidence || 0) * 100)}%</p>
                      </div>
                      <div>
                        <span className="font-medium text-purple-800">คะแนนคุณภาพ:</span>
                        <p className="text-purple-700">{reviewingActivity.activityScore || 0}/100</p>
                      </div>
                    </div>

                    {reviewingActivity.aiClassification.extractedData && (
                      <div className="mt-4 space-y-2">
                        {reviewingActivity.aiClassification.extractedData.customerInfo && (
                          <div className="text-sm">
                            <span className="font-medium text-purple-800">ข้อมูลลูกค้า:</span>
                            <p className="text-purple-700">
                              {JSON.stringify(reviewingActivity.aiClassification.extractedData.customerInfo, null, 2)}
                            </p>
                          </div>
                        )}
                        {reviewingActivity.aiClassification.extractedData.actionItems?.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium text-purple-800">รายการติดตาม:</span>
                            <ul className="text-purple-700 list-disc list-inside">
                              {reviewingActivity.aiClassification.extractedData.actionItems.map((item: string, index: number) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleConfirmClassification(reviewingActivity._id, false)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    ❌ ปฏิเสธ
                  </button>
                  <button
                    onClick={() => handleConfirmClassification(reviewingActivity._id, true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    ✅ ยืนยัน
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredActivities.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
            <p className="text-gray-600 mb-4">
              {selectedCategory === 'all' ? 'ไม่พบกิจกรรม' : `ไม่พบกิจกรรมในหมวด ${getCategoryInfo(selectedCategory).label}`}
            </p>
            <p className="text-sm text-gray-500">
              ลองบันทึกเสียงเพื่อสร้างกิจกรรมใหม่
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredActivities.map((activity) => {
            const categoryInfo = getCategoryInfo(activity.category || 'qualification');
            const score = activity.activityScore || 0;
            
            return (
              <div key={activity._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{activity.title}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${categoryInfo.color}`}>
                        {categoryInfo.icon} {categoryInfo.label}
                      </span>
                      {activity.subCategory && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {activity.subCategory}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Activity Score */}
                    {score > 0 && (
                      <div className={`px-2 py-1 text-xs font-bold rounded-lg ${getScoreColor(score)}`}>
                        {getScoreGrade(score)} ({score})
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                      activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      activity.status === 'follow-up' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.status === 'completed' ? '✅ เสร็จสิ้น' :
                       activity.status === 'pending' ? '⏳ รอดำเนินการ' :
                       activity.status === 'follow-up' ? '📞 ติดตาม' : activity.status}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-3">👤 {activity.customerName}</p>
                
                {/* Enhanced Customer & Deal Info */}
                {(activity.customerInfo?.company || activity.dealInfo?.value) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    {activity.customerInfo?.company && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-800 mb-1">🏢 บริษัท</p>
                        <p className="text-sm text-blue-700">{activity.customerInfo.company}</p>
                        {activity.customerInfo.position && (
                          <p className="text-xs text-blue-600">{activity.customerInfo.position}</p>
                        )}
                      </div>
                    )}
                    {activity.dealInfo?.value && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-green-800 mb-1">💰 มูลค่า</p>
                        <p className="text-sm text-green-700">{activity.dealInfo.value}</p>
                        {activity.dealInfo.status && (
                          <p className="text-xs text-green-600">{activity.dealInfo.status}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {activity.description && (
                  <p className="text-sm text-gray-700 mb-3">{activity.description}</p>
                )}

                {activity.transcription && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                    <p className="text-xs font-medium text-blue-800 mb-1">🎤 บันทึกเสียง:</p>
                    <p className="text-sm text-blue-700 line-clamp-2">{activity.transcription}</p>
                    {activity.isEnhanced && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                        🚀 Enhanced by AI
                      </span>
                    )}
                  </div>
                )}

                {activity.actionItems && activity.actionItems.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">📝 รายการติดตาม:</p>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <ul className="text-sm text-orange-800 space-y-1">
                        {activity.actionItems.slice(0, 3).map((item: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="bg-orange-200 text-orange-800 rounded-full w-4 h-4 flex items-center justify-center text-xs font-medium mr-2 mt-0.5 flex-shrink-0">
                              {index + 1}
                            </span>
                            {item}
                          </li>
                        ))}
                        {activity.actionItems.length > 3 && (
                          <li className="text-xs text-orange-600">+{activity.actionItems.length - 3} รายการเพิ่มเติม</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {/* AI Classification Info */}
                {activity.aiClassification && (
                  <div className="bg-purple-50 rounded-lg p-3 mb-3">
                    <p className="text-xs font-medium text-purple-800 mb-1">🤖 การจำแนกด้วย AI</p>
                    <p className="text-sm text-purple-700">
                      ความมั่นใจ: {Math.round((activity.aiClassification.confidence || 0) * 100)}%
                      {!activity.aiClassification.humanConfirmed && (
                        <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                          รอการยืนยัน
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <span>📅 {new Date(activity.createdAt).toLocaleDateString('th-TH')}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded ${
                      activity.activityType === 'voice-note' ? 'bg-red-100 text-red-700' :
                      activity.activityType === 'call' ? 'bg-green-100 text-green-700' :
                      activity.activityType === 'meeting' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {activity.activityType === 'voice-note' ? '🎤 บันทึกเสียง' :
                       activity.activityType === 'call' ? '📞 โทรศัพท์' :
                       activity.activityType === 'meeting' ? '🤝 ประชุม' :
                       activity.activityType === 'email' ? '📧 อีเมล' : activity.activityType}
                    </span>
                    {activity.transcriptionDuration && (
                      <span className="text-gray-500">⏱️ {Math.round(activity.transcriptionDuration)}s</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AddActivityPage: React.FC = () => <div className="p-4 text-center">Add Activity Page (Not Created Yet)</div>;

// Sidebar Navigation Component
const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [pendingReviews, setPendingReviews] = useState(0);

  React.useEffect(() => {
    const fetchPendingReviews = async () => {
      try {
        const result = await ApiService.getPendingReviews(100);
        if (result.success) {
          setPendingReviews(result.data.length);
        }
      } catch (error) {
        console.error('Failed to fetch pending reviews:', error);
      }
    };

    fetchPendingReviews();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingReviews, 30000);
    return () => clearInterval(interval);
  }, []);

  const navigationItems = [
         { id: 'voice', label: '🥕 เสียง AI', path: '/', icon: 'voice' },
     { id: 'dashboard', label: '🌽 Magic Dashboard', path: '/dashboard', icon: 'dashboard' },
     { id: 'dashboard-live', label: '📊 Live Dashboard', path: '/dashboard-live', icon: 'dashboard-live' },
     { id: '3d-demo', label: '🎮 3D Interactive', path: '/3d-demo', icon: '3d' },
     { id: 'customers', label: '🥬 ลูกค้า', path: '/customers', icon: 'customers' },
    { id: 'deals', label: '🌽 ดีล', path: '/deals', icon: 'deals' },
    { id: 'pipeline', label: '🥦 Pipeline', path: '/pipeline', icon: 'pipeline' },
    { id: 'kanban', label: '🍅 Kanban', path: '/kanban', icon: 'kanban' },
    { id: 'activities', label: '🥒 กิจกรรม', path: '/activities', icon: 'activities' },
    { id: 'analytics', label: '🌶️ วิเคราะห์', path: '/analytics', icon: 'analytics' },
    { id: 'reports', label: '🥗 รายงาน', path: '/reports', icon: 'reports' },
    { id: 'line', label: '🌿 LINE', path: '/line', icon: 'line' },
    { id: 'line-test', label: 'LINE Test', path: '/line-test', icon: 'line-test' }
  ];

  const renderIcon = (iconType: string, isActive: boolean) => {
    const iconColor = isActive ? 'white' : '#9197B3';
    
    switch (iconType) {
      case 'customers':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={iconColor} strokeWidth="1.5"/>
            <circle cx="9" cy="7" r="4" stroke={iconColor} strokeWidth="1.5"/>
            <path d="m22 21-2-2" stroke={iconColor} strokeWidth="1.5"/>
            <circle cx="19" cy="19" r="2" stroke={iconColor} strokeWidth="1.5"/>
          </svg>
        );
      case 'deals':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke={iconColor} strokeWidth="1.5"/>
          </svg>
        );
      case 'activities':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke={iconColor} strokeWidth="1.5"/>
            <line x1="16" y1="2" x2="16" y2="6" stroke={iconColor} strokeWidth="1.5"/>
            <line x1="8" y1="2" x2="8" y2="6" stroke={iconColor} strokeWidth="1.5"/>
            <line x1="3" y1="10" x2="21" y2="10" stroke={iconColor} strokeWidth="1.5"/>
            <path d="m9 16 2 2 4-4" stroke={iconColor} strokeWidth="1.5"/>
          </svg>
        );
      case 'voice':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" stroke={iconColor} strokeWidth="1.5"/>
            <path d="m19 10-2 2-1.5-1.5" stroke={iconColor} strokeWidth="1.5"/>
            <path d="M5 10v1a7 7 0 0 0 14 0v-1" stroke={iconColor} strokeWidth="1.5"/>
            <line x1="12" y1="19" x2="12" y2="23" stroke={iconColor} strokeWidth="1.5"/>
          </svg>
        );
      case 'pipeline':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 3v18" stroke={iconColor} strokeWidth="1.5"/>
            <path d="M8 7h8" stroke={iconColor} strokeWidth="1.5"/>
            <path d="M6 11h12" stroke={iconColor} strokeWidth="1.5"/>
            <path d="M8 15h8" stroke={iconColor} strokeWidth="1.5"/>
            <circle cx="12" cy="7" r="3" stroke={iconColor} strokeWidth="1.5"/>
            <circle cx="12" cy="17" r="3" stroke={iconColor} strokeWidth="1.5"/>
          </svg>
        );
      case 'analytics':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 3v18h18" stroke={iconColor} strokeWidth="1.5"/>
            <path d="m19 9-5 5-4-4-3 3" stroke={iconColor} strokeWidth="1.5"/>
            <circle cx="20" cy="4" r="2" stroke={iconColor} strokeWidth="1.5"/>
          </svg>
        );
      case 'reports':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={iconColor} strokeWidth="1.5"/>
            <polyline points="14,2 14,8 20,8" stroke={iconColor} strokeWidth="1.5"/>
            <line x1="16" y1="13" x2="8" y2="13" stroke={iconColor} strokeWidth="1.5"/>
            <line x1="16" y1="17" x2="8" y2="17" stroke={iconColor} strokeWidth="1.5"/>
            <polyline points="10,9 9,9 8,9" stroke={iconColor} strokeWidth="1.5"/>
          </svg>
        );
      case 'kanban':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="6" height="18" rx="2" stroke={iconColor} strokeWidth="1.5"/>
            <rect x="11" y="3" width="6" height="14" rx="2" stroke={iconColor} strokeWidth="1.5"/>
            <rect x="19" y="3" width="2" height="10" rx="1" stroke={iconColor} strokeWidth="1.5"/>
            <circle cx="6" cy="8" r="1" fill={iconColor}/>
            <circle cx="14" cy="8" r="1" fill={iconColor}/>
            <circle cx="20" cy="8" r="0.5" fill={iconColor}/>
          </svg>
        );
      case 'line':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M21 10.97c0-5.52-5.53-10-12-10S-3 5.45-3 10.97c0 4.94 4.39 9.08 10.32 9.87.4.09.95.27 1.09.62.12.31.08.8.04 1.12l-.18 1.09c-.05.33-.25 1.29 1.13.7 1.38-.58 7.46-4.39 10.18-7.51C20.74 15.15 21 13.13 21 10.97z" fill={iconColor}/>
            <circle cx="8" cy="11" r="1" fill={isActive ? '#00B900' : 'white'}/>
            <circle cx="12" cy="11" r="1" fill={isActive ? '#00B900' : 'white'}/>
            <circle cx="16" cy="11" r="1" fill={isActive ? '#00B900' : 'white'}/>
          </svg>
        );
      case 'line-test':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12c-1-1-3-1-3-3s2-2 3-3 1-3-1-3-3 2-3 3-3 1-3 0-2-3-3-3-3 2-3 3 1 3 0 3-3 1-3 3 2 2 3 3 3-1 3 0 1 3 3 3 3-2 3-3z" stroke={iconColor} strokeWidth="1.5"/>
          </svg>
        );
      case 'dashboard':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="9" rx="1" stroke={iconColor} strokeWidth="1.5"/>
            <rect x="14" y="3" width="7" height="5" rx="1" stroke={iconColor} strokeWidth="1.5"/>
            <rect x="14" y="12" width="7" height="9" rx="1" stroke={iconColor} strokeWidth="1.5"/>
            <rect x="3" y="16" width="7" height="5" rx="1" stroke={iconColor} strokeWidth="1.5"/>
            <circle cx="6.5" cy="7.5" r="1" fill={iconColor}/>
            <circle cx="17.5" cy="5.5" r="1" fill={iconColor}/>
            <path d="m5 10 2 1 2-2" stroke={iconColor} strokeWidth="1" strokeLinecap="round"/>
          </svg>
        );
      case 'dashboard-live':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="14" stroke={iconColor} strokeWidth="1.5" rx="2"/>
            <line x1="3" y1="9" x2="21" y2="9" stroke={iconColor} strokeWidth="1.5"/>
            <circle cx="7" cy="12" r="1" fill={iconColor}/>
            <circle cx="12" cy="12" r="1" fill={iconColor}/>
            <circle cx="17" cy="12" r="1" fill={iconColor}/>
            <path d="M19 20v2M5 20v2" stroke={iconColor} strokeWidth="1.5"/>
          </svg>
        );
      case '3d':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke={iconColor} strokeWidth="1.5"/>
            <path d="M2 7l10 5m0 0l10-5m-10 5v10" stroke={iconColor} strokeWidth="1.5"/>
            <circle cx="12" cy="12" r="2" fill={iconColor} opacity="0.5"/>
            <path d="M8 10l4-2 4 2" stroke={iconColor} strokeWidth="1" opacity="0.7"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-72 h-screen bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl font-bold">F</span>
          </div>
          <div className="ml-3">
            <div className="text-gray-900 text-xl font-bold">Freshket Sales</div>
            <div className="text-gray-500 text-xs">CRM System</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === '/' && location.pathname === '/');
            
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg transform scale-105' 
                    : 'text-gray-600 hover:bg-green-50 hover:text-primary-700 hover:scale-105'
                }`}
              >
                <div className="w-5 h-5 mr-3">
                  {renderIcon(item.icon, isActive)}
                </div>
                <span className="flex-1">{item.label}</span>
                {item.id === 'activities' && pendingReviews > 0 && (
                  <div className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-bounce">
                    {pendingReviews > 9 ? '9+' : pendingReviews}
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>


      {/* User Profile */}
      <div className="p-4 border-t border-green-100 bg-gradient-to-r from-green-50 to-white">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-green-200 to-green-300 rounded-full flex items-center justify-center shadow-md">
            <span className="text-gray-600 font-semibold text-sm">
              {(user?.firstName || user?.username || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3 flex-1">
            <div className="text-gray-900 text-sm font-medium">
              {user?.firstName || user?.username || 'ผู้ใช้งาน'}
            </div>
            <div className="text-gray-500 text-xs">Sales Manager</div>
          </div>
          <button 
            onClick={logout}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="ออกจากระบบ"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#6B7280" strokeWidth="1.5"/>
              <polyline points="16,17 21,12 16,7" stroke="#6B7280" strokeWidth="1.5"/>
              <line x1="21" y1="12" x2="9" y2="12" stroke="#6B7280" strokeWidth="1.5"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Top Header Component
const TopHeader: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="bg-gradient-to-r from-green-50 via-white to-green-50 border-b border-green-100 px-8 py-4 flex justify-between items-center">
      <div>
        <h1 className="text-gray-900 text-2xl font-semibold">
          🥬 สวัสดี, {user?.firstName || user?.username || 'ผู้ใช้งาน'}
        </h1>
        <p className="text-primary-600 text-sm mt-1 font-medium">🌱 ยินดีต้อนรับสู่ระบบ Freshket CRM - Fresh Ingredients for Success!</p>
      </div>
      <div className="bg-gradient-to-r from-green-100 to-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center space-x-2 w-64 shadow-sm hover:shadow-md transition-shadow">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="9" cy="9" r="7" stroke="#16a34a" strokeWidth="1.5"/>
          <path d="m15 15 3 3" stroke="#16a34a" strokeWidth="1.5"/>
        </svg>
        <input 
          type="text"
          placeholder="🌿 ค้นหาลูกค้า, ดีล, หรือกิจกรรม..."
          className="bg-transparent text-sm text-gray-700 placeholder-green-500 border-none outline-none flex-1"
        />
      </div>
    </div>
  );
};

// Voice Demo Page Component
const VoiceDemoPage: React.FC = () => {
  const { success, error: showError, warning } = useToast();
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [useRealtimeMode, setUseRealtimeMode] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [totalActivities, setTotalActivities] = useState(0);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  
  // Voice recording hook (for file-based transcription)
  const { 
    isRecording, 
    audioUrl, 
    transcription, 
    transcriptionLanguage,
    transcriptionConfidence,
    transcriptionDuration,
    isProcessing,
    apiStatus,
    errorMessage,
    // Enhanced Gemini data
    isEnhanced,
    customerInfo,
    dealInfo,
    actionItems,
    summary,
    startRecording, 
    stopRecording, 
    clearRecording,
    isSupported 
  } = useVoiceRecording();

  // Real-time ASR hook
  const {
    isListening,
    transcript: realtimeTranscript,
    interimTranscript,
    finalTranscript,
    confidence: realtimeConfidence,
    isSupported: asrSupported,
    error: asrError,
    startListening,
    stopListening,
    clearTranscript
  } = useRealtimeASR();

  // Timer for recording duration
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Fetch activity stats
  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await ApiService.getActivities();
        if (result.success) {
          setTotalActivities(result.data.length);
          setRecentActivities(result.data.slice(0, 3)); // Last 3 activities
        }
      } catch (error) {
        console.error('Failed to fetch activity stats:', error);
      }
    };
    fetchStats();
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVoiceButtonClick = async () => {
    if (useRealtimeMode) {
      // Real-time ASR mode
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
    } else {
      // File-based recording mode
      if (isRecording) {
        stopRecording();
      } else {
        await startRecording();
      }
    }
  };

  const handleClearAll = () => {
    clearRecording();
    clearTranscript();
  };

  const handleSaveAsActivity = async () => {
    if (!transcription) {
      warning('No transcription to save');
      return;
    }

    setIsSavingActivity(true);
    try {
      // Extract audio file information if available
      const audioData: any = {
        transcription,
        transcriptionLanguage: transcriptionLanguage || 'th',
        transcriptionConfidence: transcriptionConfidence || undefined,
        transcriptionDuration: transcriptionDuration || undefined,
        isEnhanced: isEnhanced || false
      };

      // Add audio file data if available
      if (audioUrl) {
        audioData.audioUrl = audioUrl;
        // Extract filename from audioUrl if needed
        const urlParts = audioUrl.split('/');
        audioData.audioFileName = urlParts[urlParts.length - 1];
        // Set storage path for server-side reference
        audioData.audioStoragePath = audioUrl;
      }

      // Add enhanced Gemini data if available
      if (isEnhanced) {
        if (customerInfo) audioData.customerInfo = customerInfo;
        if (dealInfo) audioData.dealInfo = dealInfo;
        if (actionItems && actionItems.length > 0) audioData.actionItems = actionItems;
        if (summary) audioData.summary = summary;
      }

      const result = await ApiService.createActivityFromVoice(audioData);

      if (result.success) {
        success('🎉 Activity saved with AI analysis!');
        
        // Log successful activity creation (client-side, will be logged on server)
        console.log('Voice activity created successfully:', {
          activityId: result.data?._id,
          transcriptionLength: transcription.length,
          aiEnhanced: isEnhanced,
          hasAudio: !!audioUrl
        });
        clearRecording();
        
        // Refresh activity stats
        const statsResult = await ApiService.getActivities();
        if (statsResult.success) {
          setTotalActivities(statsResult.data.length);
          setRecentActivities(statsResult.data.slice(0, 3));
        }
      } else {
        throw new Error(result.message || 'Failed to save activity');
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      showError('Error saving activity: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSavingActivity(false);
    }
  };

  const handleSaveRealtimeTranscript = async () => {
    if (!realtimeTranscript) {
      warning('ไม่มีข้อความที่จะบันทึก');
      return;
    }

    setIsSavingActivity(true);
    try {
      const audioData: any = {
        transcription: realtimeTranscript,
        transcriptionLanguage: 'th',
        transcriptionConfidence: realtimeConfidence,
        isEnhanced: false, // Real-time doesn't have enhanced AI analysis
        activityType: 'voice-note'
      };

      const result = await ApiService.createActivityFromVoice(audioData);

      if (result.success) {
        success('⚡ บันทึกข้อความเรียลไทม์เรียบร้อย!');
        
        console.log('Real-time transcript saved successfully:', {
          activityId: result.data?._id,
          transcriptionLength: realtimeTranscript.length,
          confidence: realtimeConfidence
        });
        
        // Clear the real-time transcript
        clearTranscript();
        
        // Refresh activity stats
        const statsResult = await ApiService.getActivities();
        if (statsResult.success) {
          setTotalActivities(statsResult.data.length);
          setRecentActivities(statsResult.data.slice(0, 3));
        }
      } else {
        throw new Error(result.message || 'Failed to save activity');
      }
    } catch (error) {
      console.error('Error saving real-time transcript:', error);
      showError('เกิดข้อผิดพลาดในการบันทึก: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSavingActivity(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-emerald-50 p-6 relative overflow-hidden">
      {/* Animated vegetable background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl animate-bounce" style={{animationDelay: '0s'}}>🥕</div>
        <div className="absolute top-20 right-20 text-5xl animate-bounce" style={{animationDelay: '0.5s'}}>🍅</div>
        <div className="absolute bottom-20 left-1/4 text-4xl animate-bounce" style={{animationDelay: '1s'}}>🥦</div>
        <div className="absolute bottom-10 right-1/3 text-6xl animate-bounce" style={{animationDelay: '1.5s'}}>🌽</div>
        <div className="absolute top-1/2 left-1/2 text-5xl animate-spin" style={{animationDuration: '10s'}}>🥒</div>
      </div>
      <div className="max-w-6xl mx-auto">
        {/* Header with Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">🥕 บันทึกเสียง Fresh Voice AI</h1>
            <p className="text-lg text-gray-600 mb-2">🌽 บันทึกการสนทนากับลูกค้า Fresh Ingredients</p>
            <p className="text-sm text-primary-600 font-medium">🥦 AI-powered voice recording for fresh produce sales</p>
          </div>
          
          {/* Activity Stats */}
          <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-6 shadow-lg border border-green-200 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 text-6xl opacity-20">🥗</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🌱 สถิติ Fresh Records</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">🥬 กิจกรรมทั้งหมด:</span>
                <span className="font-bold text-primary-600">{totalActivities}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">เก็บไว้ที่:</span>
                <span className="text-sm text-green-600">📋 Activities</span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500 mb-2">กิจกรรมล่าสุด:</p>
                {recentActivities.length > 0 ? (
                  <div className="space-y-1">
                    {recentActivities.map((activity, index) => (
                      <div key={activity._id} className="text-xs text-gray-600 truncate">
                        {index + 1}. {activity.title}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">ยังไม่มีการบันทึก</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-xl p-1 shadow-md border border-gray-200">
            <button
              onClick={() => setUseRealtimeMode(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !useRealtimeMode
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎵 บันทึกไฟล์
            </button>
            <button
              onClick={() => setUseRealtimeMode(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                useRealtimeMode
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled={!asrSupported}
            >
              ⚡ เรียลไทม์
            </button>
          </div>
        </div>
        
        <p className="text-xs text-gray-400 text-center mb-6">
          {useRealtimeMode ? '🌿 โหมดผักสด - บันทึกทันที + Fresh Data' : '🥕 โหมดคุณภาพ - AI วิเคราะห์ผัก + Premium Records'}
        </p>
      
        {!isSupported && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-800">
              ⚠️ เบราว์เซอร์ของคุณไม่รองรับการบันทึกเสียง กรุณาใช้ Chrome, Firefox, หรือ Safari
            </p>
          </div>
        )}

        {(errorMessage || asrError) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-800">❌ {errorMessage || asrError}</p>
          </div>
        )}

        <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50 rounded-2xl shadow-xl p-8 mb-6 border border-green-200 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 text-8xl opacity-10 animate-spin" style={{animationDuration: '20s'}}>🥬</div>
          <div className="text-center">
            <div className="mb-6">
              <div className={`w-40 h-40 mx-auto rounded-full flex items-center justify-center mb-4 transition-all duration-300 relative ${
                (isRecording || isListening) 
                  ? 'bg-gradient-to-br from-green-200 to-emerald-200 animate-pulse'
                  : 'bg-gradient-to-br from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200'
              }`}>
                {/* Recording indicator ring */}
                {(isRecording || isListening) && (
                  <div className={`absolute inset-0 rounded-full border-4 ${
                    useRealtimeMode ? 'border-green-400' : 'border-red-400'
                  } animate-ping`}></div>
                )}
                
                <button
                  onClick={handleVoiceButtonClick}
                  disabled={(!isSupported && !useRealtimeMode) || (!asrSupported && useRealtimeMode) || isProcessing}
                  className={`
                    w-24 h-24 rounded-full text-white font-semibold text-3xl shadow-lg transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-4 relative z-10
                    ${useRealtimeMode ? 'focus:ring-green-300' : 'focus:ring-blue-300'}
                    ${(isRecording || isListening)
                      ? useRealtimeMode ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                      : isProcessing 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : useRealtimeMode ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                    }
                    ${(!isSupported && !useRealtimeMode) || (!asrSupported && useRealtimeMode) ? 'bg-gray-400 cursor-not-allowed' : ''}
                  `}
                >
                  {isProcessing ? '🔄' : 
                   (isRecording || isListening) ? '⏹️' : 
                   '🎤'}
                </button>
              </div>
              
              {/* Recording Timer */}
              {isRecording && (
                <div className="mb-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mx-auto max-w-xs">
                    <div className="flex items-center justify-center text-red-600">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                      <span className="font-mono text-lg font-bold">{formatDuration(recordingDuration)}</span>
                    </div>
                    <p className="text-xs text-red-500 mt-1">🔴 กำลังบันทึก - กดหยุดเมื่อเสร็จ</p>
                  </div>
                </div>
              )}
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {isProcessing ? '⏳ กำลังประมวลผลด้วย AI...' : 
                 isRecording ? `🔴 กำลังบันทึก (${formatDuration(recordingDuration)})` :
                 isListening ? '🟢 กำลังฟังเรียลไทม์...' :
                 useRealtimeMode ? '⚡ พร้อมฟังเสียงเรียลไทม์' : '🎤 พร้อมบันทึกเสียง'}
              </h3>
              
              <p className="text-gray-600 mb-4">
                {(isRecording || isListening) ? 
                  <span className="text-red-600 font-medium">🛑 คลิกปุ่มเพื่อหยุดการบันทึก</span> :
                 isProcessing ? 'กำลังใช้ AI วิเคราะห์เสียง กรุณารอสักครู่...' :
                 useRealtimeMode ? 'คลิกเพื่อเริ่มฟังและแปลงเสียงเป็นข้อความทันที' : 
                 'คลิกเพื่อเริ่มบันทึก (จะบันทึกจนกว่าคุณจะกดหยุด)'}
              </p>
              
              {/* Instructions */}
              {!isRecording && !isListening && !isProcessing && (
                <div className="bg-gray-50 rounded-lg p-4 mx-auto max-w-md">
                  <h4 className="font-medium text-gray-800 mb-2">📝 คำแนะนำ:</h4>
                  <ul className="text-sm text-gray-600 text-left space-y-1">
                    <li>• การบันทึกจะไม่หยุดเอง - คุณควบคุมได้</li>
                    <li>• กดหยุดเมื่อเสร็จการสนทนา</li>
                    <li>• ไฟล์จะถูกเก็บในหน้า Activities</li>
                    <li>• AI จะวิเคราะห์และจำแนกอัตโนมัติ</li>
                  </ul>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                แปลงเสียงเป็นข้อความ
              </div>
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                บันทึกกิจกรรมอัตโนมัติ
              </div>
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                สร้างรายงานยอดขาย
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Transcript Display */}
        {useRealtimeMode && (isListening || realtimeTranscript) && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
              <span className="bg-green-100 p-2 rounded-lg mr-3">⚡</span>
              Real-time Transcription
            </h3>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-4 border border-green-100 min-h-[100px]">
              {finalTranscript && (
                <p className="text-gray-800 leading-relaxed mb-2">
                  {finalTranscript}
                </p>
              )}
              {interimTranscript && (
                <p className="text-gray-500 italic leading-relaxed">
                  {interimTranscript}
                  <span className="animate-pulse">|</span>
                </p>
              )}
              {!finalTranscript && !interimTranscript && isListening && (
                <p className="text-gray-400 text-center py-8">
                  🎤 กำลังฟัง... เริ่มพูดได้เลย
                </p>
              )}
              {!finalTranscript && !interimTranscript && !isListening && (
                <p className="text-gray-400 text-center py-8">
                  คลิกปุ่มไมโครโฟนเพื่อเริ่มฟัง
                </p>
              )}
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center space-x-4">
                {realtimeConfidence > 0 && (
                  <span className="text-green-600">
                    🎯 ความแม่นยำ: {Math.round(realtimeConfidence * 100)}%
                  </span>
                )}
                <span className={`px-2 py-1 rounded-full text-xs ${
                  isListening ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {isListening ? '🟢 กำลังฟัง' : '⚫ หยุดฟัง'}
                </span>
              </div>
              
              {realtimeTranscript && (
                <button
                  onClick={clearTranscript}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-lg transition-colors"
                >
                  🗑️ ล้างข้อความ
                </button>
              )}
            </div>
          </div>
        )}

        {audioUrl && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">🎵 เสียงที่บันทึกได้</h3>
            <audio controls className="w-full">
              <source src={audioUrl} type="audio/webm" />
              <source src={audioUrl} type="audio/mp4" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {transcription && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">📝 ข้อความที่แปลงได้</h3>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-4 border border-blue-100">
              <p className="text-gray-800 leading-relaxed">{transcription}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {transcriptionLanguage && (
                <div className="flex items-center text-gray-600">
                  <span>🌐 ภาษา: {transcriptionLanguage}</span>
                </div>
              )}
              {transcriptionConfidence && (
                <div className="flex items-center text-gray-600">
                  <span>🎯 ความแม่นยำ: {Math.round(transcriptionConfidence * 100)}%</span>
                </div>
              )}
              {transcriptionDuration && (
                <div className="flex items-center text-gray-600">
                  <span>⏱️ ระยะเวลา: {Math.round(transcriptionDuration)}s</span>
                </div>
              )}
              {apiStatus === 'success' && (
                <div className="flex items-center text-green-600">
                  <span>{isEnhanced ? '🚀 Gemini AI Enhanced' : '🤖 AI จริง'}</span>
                </div>
              )}
              {apiStatus === 'fallback' && (
                <div className="flex items-center text-yellow-600">
                  <span>🎭 โหมดทดสอบ</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced AI Analysis */}
        {isEnhanced && (customerInfo || dealInfo || actionItems || summary) && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
              <span className="bg-purple-100 p-2 rounded-lg mr-3">🧠</span>
              AI Analysis & Insights
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Information */}
              {customerInfo && (customerInfo.name || customerInfo.company) && (
                <div className="bg-primary-50 rounded-xl p-4">
                  <h4 className="font-semibold text-primary-900 mb-3 flex items-center">
                    👤 ข้อมูลลูกค้า
                  </h4>
                  {customerInfo.name && (
                    <p className="text-sm text-primary-800 mb-1">
                      <span className="font-medium">ชื่อ:</span> {customerInfo.name}
                    </p>
                  )}
                  {customerInfo.company && (
                    <p className="text-sm text-primary-800">
                      <span className="font-medium">บริษัท:</span> {customerInfo.company}
                    </p>
                  )}
                </div>
              )}

              {/* Deal Information */}
              {dealInfo && (dealInfo.value || dealInfo.status) && (
                <div className="bg-green-50 rounded-xl p-4">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                    💰 ข้อมูลดีล
                  </h4>
                  {dealInfo.value && (
                    <p className="text-sm text-green-800 mb-1">
                      <span className="font-medium">มูลค่า:</span> {dealInfo.value}
                    </p>
                  )}
                  {dealInfo.status && (
                    <p className="text-sm text-green-800">
                      <span className="font-medium">สถานะ:</span> {dealInfo.status}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Summary */}
            {summary && (
              <div className="bg-purple-50 rounded-xl p-4 mt-4">
                <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                  📋 สรุปการสนทนา
                </h4>
                <p className="text-sm text-purple-800 leading-relaxed">{summary}</p>
              </div>
            )}

            {/* Action Items */}
            {actionItems && actionItems.length > 0 && (
              <div className="bg-orange-50 rounded-xl p-4 mt-4">
                <h4 className="font-semibold text-orange-900 mb-3 flex items-center">
                  ✅ รายการติดตาม
                </h4>
                <ul className="space-y-2">
                  {actionItems.map((item, index) => (
                    <li key={index} className="text-sm text-orange-800 flex items-start">
                      <span className="bg-orange-200 text-orange-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5 flex-shrink-0">
                        {index + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {(audioUrl || transcription || realtimeTranscript) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleClearAll}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🗑️ ล้างทั้งหมด
            </button>
            
            {/* Save button for file-based transcription */}
            {!useRealtimeMode && transcription && (
              <button
                onClick={handleSaveAsActivity}
                disabled={isSavingActivity}
                className={`px-6 py-3 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg ${
                  isSavingActivity 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSavingActivity ? '⏳ กำลังบันทึก...' : '💾 บันทึกเป็นกิจกรรม'}
              </button>
            )}
            
            {/* Save button for real-time transcription */}
            {useRealtimeMode && realtimeTranscript && (
              <button
                onClick={handleSaveRealtimeTranscript}
                disabled={isSavingActivity}
                className={`px-6 py-3 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg ${
                  isSavingActivity 
                    ? 'bg-green-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isSavingActivity ? '⏳ กำลังบันทึก...' : '⚡ บันทึกข้อความเรียลไทม์'}
              </button>
            )}
          </div>
        )}

        {/* Where Records Are Stored */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
            📂 การจัดเก็บและการเข้าถึง
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                💾 การเก็บไฟล์เสียง
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• ไฟล์เสียงถูกเก็บใน Server อย่างปลอดภัย</li>
                <li>• ตั้งชื่อไฟล์อัตโนมัติด้วย Timestamp</li>
                <li>• รองรับไฟล์ .webm และ .wav</li>
                <li>• ลิงก์เข้าถึงไฟล์ผ่าน Activities</li>
              </ul>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2 flex items-center">
                📋 ดูการบันทึกที่ผ่านมา
              </h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• ไปที่หน้า "กิจกรรม" ในเมนูด้านซ้าย</li>
                <li>• ดูรายการกิจกรรมทั้งหมด พร้อมไฟล์เสียง</li>
                <li>• กรองตามหมวดหมู่ที่ AI จำแนกให้</li>
                <li>• เล่นไฟล์เสียงได้โดยตรง</li>
              </ul>
            </div>
          </div>
          
          {/* Quick Access to Activities */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h5 className="font-medium text-gray-900">เข้าถึงด่วน</h5>
                <p className="text-sm text-gray-600">ดูกิจกรรมและการบันทึกทั้งหมด</p>
              </div>
              <button
                onClick={() => window.location.href = '/activities'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📋 ดูกิจกรรม ({totalActivities})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Layout Component
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen bg-[#FAFBFF]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  const { toasts, removeToast } = useToast();

  return (
    <ErrorBoundary>
      <Router>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/line-callback" element={<LineAuthCallbackPage />} />

        {/* Protected routes with new layout */}
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={
            <AppLayout>
              <Routes>
                <Route path="/" element={<VoiceDemoPage />} />
                <Route index element={<VoiceDemoPage />} />
                <Route path="/customers" element={<CustomerList />} />
                <Route path="/deals" element={<DealList />} />
                <Route path="/deals/new" element={<DealForm />} />
                <Route path="/deals/edit/:id" element={<DealForm />} />
                <Route path="/deals/:id" element={<DealDetail />} />
                <Route path="/pipeline" element={<SalesPipeline />} />
                <Route path="/kanban" element={<KanbanBoard />} />
                <Route path="/activities" element={<ActivitiesPage />} />
                <Route path="/activities/new" element={<AddActivityPage />} />
                <Route path="/analytics" element={<AnalyticsDashboard />} />
                <Route path="/dashboard" element={<MagicUIDashboard />} />
                <Route path="/dashboard-live" element={<MagicUIDashboardLive />} />
                <Route path="/3d-demo" element={
                  <div className="p-8">
                    <VoiceSplineDemo />
                  </div>
                } />
                <Route path="/upload-ceo" element={
                  <div className="p-8">
                    <ImageUploadHelper 
                      onImageSelect={(file) => console.log('Selected file:', file)}
                    />
                  </div>
                } />
                <Route path="/reports" element={<ExportReports />} />
                <Route path="/line" element={<LineIntegration />} />
                <Route path="/line-test" element={<LineTestPage />} />
              </Routes>
            </AppLayout>
          } />
        </Route>
      </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App; 