import React, { useState } from 'react';
import ApiService from '../services/apiService';
import { useToast } from '../hooks/useToast';

// Enhanced ActivitiesPage with categorization and scoring
const ActivitiesPage: React.FC = () => {
  const { success, error: showError, warning } = useToast();
  const [activities, setActivities] = useState<any[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<any[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingActivity, setReviewingActivity] = useState<any>(null);
  const [showPendingReviews, setShowPendingReviews] = useState(false);

  const categories = [
    { value: 'all', label: 'ทั้งหมด', color: 'bg-gray-100 text-gray-800', icon: '📋' },
    { value: 'prospecting', label: 'การหาลูกค้า', color: 'bg-purple-100 text-purple-800', icon: '🔍' },
    { value: 'qualification', label: 'การคัดกรอง', color: 'bg-primary-100 text-primary-800', icon: '🎯' },
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading activities...</p>
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
          <h2 className="text-3xl font-bold text-gray-900">📋 กิจกรรมการขาย</h2>
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
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                selectedCategory === category.value
                  ? category.color + ' shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.icon} {category.label}
              {category.value !== 'all' && (
                <span className="ml-1 text-xs">
                  ({activities.filter(a => a.category === category.value).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">เรียงตาม:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="date">วันที่ล่าสุด</option>
            <option value="score">คะแนนสูงสุด</option>
            <option value="customer">ชื่อลูกค้า</option>
          </select>
        </div>
      </div>

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
                      className="px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
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
                  <div className="bg-primary-50 rounded-lg p-4">
                    <h5 className="font-medium text-primary-900 mb-2">🎤 บันทึกเสียง</h5>
                    <p className="text-primary-800 text-sm">{reviewingActivity.transcription}</p>
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
                      activity.status === 'follow-up' ? 'bg-primary-100 text-primary-800' :
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
                      <div className="bg-primary-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-primary-800 mb-1">🏢 บริษัท</p>
                        <p className="text-sm text-primary-700">{activity.customerInfo.company}</p>
                        {activity.customerInfo.position && (
                          <p className="text-xs text-primary-600">{activity.customerInfo.position}</p>
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
                  <div className="bg-primary-50 border border-primary-200 rounded p-3 mb-3">
                    <p className="text-xs font-medium text-primary-800 mb-1">🎤 บันทึกเสียง:</p>
                    <p className="text-sm text-primary-700 line-clamp-2">{activity.transcription}</p>
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
                      activity.activityType === 'meeting' ? 'bg-primary-100 text-primary-700' :
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

export default ActivitiesPage;