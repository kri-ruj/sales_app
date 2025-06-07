import React, { useState, useEffect, useCallback } from 'react';
import ApiService from '../services/apiService';
import AnalyticsDashboard from './analytics/AnalyticsDashboard';
import CEOInspiration from './ui/CEOInspiration';

interface DashboardStats {
  totalDeals: number;
  activeDeals: number;
  completedDeals: number;
  totalValue: number;
  monthlyTarget: number;
  monthlyProgress: number;
  recentActivities: any[];
  upcomingTasks: any[];
  topPerformers: any[];
  customers: any[];
  recentDeals: any[];
  userPerformance?: any;
  analyticsData?: any;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalDeals: 0,
    activeDeals: 0,
    completedDeals: 0,
    totalValue: 0,
    monthlyTarget: 1000000,
    monthlyProgress: 0,
    recentActivities: [],
    upcomingTasks: [],
    topPerformers: [],
    customers: [],
    recentDeals: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod] = useState('Quarterly');
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [analyticsResult, performanceResult, customersResult] = await Promise.all([
        ApiService.getDashboardAnalytics(12),
        ApiService.getUserPerformance().catch(() => ({ success: false, data: null })),
        ApiService.getCustomers().catch(() => ({ success: false, data: [] }))
      ]);
      
      if (analyticsResult.success) {
        const data = analyticsResult.data;
        const customers = customersResult.success ? customersResult.data : [];
        
        // Calculate monthly target based on historical data or set a reasonable default
        const monthlyTarget = data.overview.totalEstimatedValue > 0 ? 
          Math.max(data.overview.totalEstimatedValue * 1.2, 1000000) : 1000000;
        
        const monthlyProgress = data.overview.totalEstimatedValue > 0 ? 
          (data.overview.totalEstimatedValue / monthlyTarget) * 100 : 0;

        setStats({
          totalDeals: data.overview.totalActivities,
          activeDeals: data.overview.pendingActivities,
          completedDeals: data.overview.completedActivities,
          totalValue: data.overview.totalEstimatedValue,
          monthlyTarget,
          monthlyProgress,
          recentActivities: data.recentActivities,
          upcomingTasks: data.recentActivities.filter((activity: any) => activity.status === 'pending'),
          topPerformers: [],
          customers,
          recentDeals: data.recentActivities.map((activity: any, index: number) => ({
            id: index + 1,
            customerName: activity.customerName,
            dealValue: activity.estimatedValue || 0,
            status: activity.status,
            lastActivity: new Date(activity.createdAt).toLocaleDateString('th-TH'),
            progress: activity.activityScore || 0,
            category: activity.category
          })),
          userPerformance: performanceResult.success ? performanceResult.data : null,
          analyticsData: data
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `฿${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `฿${(amount / 1000).toFixed(0)}K`;
    }
    return `฿${amount.toFixed(0)}`;
  };

  // Use real monthly data from analytics
  const monthlyData = stats.analyticsData?.monthlyData || [];

  // Advanced analytics data using real data
  const advancedAnalyticsData = {
    totalRevenue: stats.totalValue,
    monthlyGrowth: stats.analyticsData?.trends.growth || 0,
    customerCount: stats.customers.length,
    dealConversionRate: stats.analyticsData?.overview.completionRate || 0,
    monthlyData: stats.analyticsData?.monthlyData.map((data: any) => ({
      month: data.month,
      revenue: data.estimatedValue,
      target: stats.monthlyTarget / 12, // Spread annual target across months
      customers: Math.floor(data.activityCount * 1.5), // Estimate customers from activities
      deals: data.activityCount
    })) || []
  };

  const maxValue = monthlyData.length > 0 ? Math.max(...monthlyData.map((d: any) => d.activityCount)) : 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFBFF] flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <p className="text-red-600 mb-4">❌ {error}</p>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFF]">
      {/* Analytics Toggle */}
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 แดชบอร์ด</h1>
            <p className="text-gray-600 mt-1">ภาพรวมของธุรกิจและผลงานขาย</p>
          </div>
          <button
            onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              showAdvancedAnalytics
                ? 'bg-primary-600 text-white shadow-lg'
                : 'bg-white text-primary-600 border border-primary-600 hover:bg-primary-50'
            }`}
          >
            {showAdvancedAnalytics ? '📊 แอนาลิติกส์ขั้นสูง' : '📈 โหมดพื้นฐาน'}
          </button>
        </div>
        
        {/* CEO Inspiration Widget */}
        <div className="mb-6">
          <CEOInspiration 
            quote="ทีมขายที่แข็งแกร่งคือรากฐานของ Freshket ทุกวันคือโอกาสใหม่ในการสร้างความสัมพันธ์ที่ดีกับลูกค้า"
            imageUrl="/ceo-freshket.jpg"
            variant="compact"
            className="bg-gradient-to-r from-primary-50 to-green-50"
          />
        </div>
      </div>

      {/* Conditional Rendering */}
      {showAdvancedAnalytics ? (
        <div className="max-w-7xl mx-auto px-6 pb-8">
          <AnalyticsDashboard />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6">
          {/* Top Stats Cards */}
          <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {/* Earning */}
            <div className="flex items-center space-x-4 py-4 md:py-0">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center">
                <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                  <path d="M15.31 13.55H26.68V28.44H15.31V13.55Z" fill="#00AC4F"/>
                  <path d="M19.69 11.81H22.31V30.19H19.69V11.81Z" fill="#00AC4F"/>
                  <circle cx="21" cy="21" r="18.81" stroke="#00AC4F" strokeWidth="2"/>
                  <circle cx="33.25" cy="8.75" r="4.81" fill="#00AC4F"/>
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">รายได้รวม</p>
                <p className="text-gray-900 text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
                <div className="flex items-center mt-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" className="mr-1">
                    <path d="M2 10L8 4L14 10" stroke="#10B981" strokeWidth="2" fill="none"/>
                  </svg>
                  <span className="text-green-600 text-xs font-medium">+12.5%</span>
                  <span className="text-gray-500 text-xs ml-1">เดือนนี้</span>
                </div>
              </div>
            </div>

            {/* Balance */}
            <div className="flex items-center space-x-4 py-4 md:py-0 md:pl-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-50 rounded-full flex items-center justify-center">
                <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                  <rect x="4.97" y="28.17" width="15.15" height="11.64" fill="#00B900"/>
                  <rect x="4.97" y="18" width="15.14" height="13.15" fill="#00B900"/>
                  <rect x="28.21" y="16.10" width="11.61" height="9.80" fill="#00B900"/>
                  <rect x="2.17" y="4.81" width="35.89" height="32.38" stroke="#00B900" strokeWidth="2"/>
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">ดีลที่ปิดได้</p>
                <p className="text-gray-900 text-2xl font-bold">{stats.completedDeals}</p>
                <div className="flex items-center mt-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" className="mr-1">
                    <path d="M2 6L8 12L14 6" stroke="#EF4444" strokeWidth="2" fill="none"/>
                  </svg>
                  <span className="text-red-600 text-xs font-medium">-3.2%</span>
                  <span className="text-gray-500 text-xs ml-1">เดือนนี้</span>
                </div>
              </div>
            </div>

            {/* Total Sales */}
            <div className="flex items-center space-x-4 py-4 md:py-0 md:pl-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-50 rounded-full flex items-center justify-center">
                <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                  <rect x="11.81" y="2.18" width="18.38" height="12.92" fill="#DA001A"/>
                  <rect x="4.37" y="12.69" width="33.26" height="27.12" fill="#DA001A"/>
                  <circle cx="25.22" cy="19.51" r="1.75" fill="#DA001A"/>
                  <circle cx="12.97" cy="19.51" r="1.75" fill="#DA001A"/>
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">ลูกค้าทั้งหมด</p>
                <p className="text-gray-900 text-2xl font-bold">{stats.customers.length}</p>
                <div className="flex items-center mt-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" className="mr-1">
                    <path d="M2 10L8 4L14 10" stroke="#10B981" strokeWidth="2" fill="none"/>
                  </svg>
                  <span className="text-green-600 text-xs font-medium">+8.4%</span>
                  <span className="text-gray-500 text-xs ml-1">สัปดาห์นี้</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Dashboard Section */}
        {stats.userPerformance && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-gray-900 text-xl font-semibold">🏆 ผลงานของคุณ</h3>
                <p className="text-gray-500 text-sm">คะแนนและระดับการปฏิบัติงาน</p>
              </div>
              <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
                stats.userPerformance.level === 'Master' ? 'bg-purple-100 text-purple-800' :
                stats.userPerformance.level === 'Expert' ? 'bg-primary-100 text-primary-800' :
                stats.userPerformance.level === 'Advanced' ? 'bg-green-100 text-green-800' :
                stats.userPerformance.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {stats.userPerformance.level === 'Master' ? '🏅 ผู้เชี่ยวชาญ' :
                 stats.userPerformance.level === 'Expert' ? '⭐ ผู้ทรงคุณวุฒิ' :
                 stats.userPerformance.level === 'Advanced' ? '💪 ระดับสูง' :
                 stats.userPerformance.level === 'Intermediate' ? '📈 ระดับกลาง' :
                 '🌱 มือใหม่'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {/* Average Score */}
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-primary-600 text-sm font-medium">คะแนนเฉลี่ย</span>
                  <div className="w-8 h-8 bg-primary-200 rounded-full flex items-center justify-center">
                    📊
                  </div>
                </div>
                <div className="text-2xl font-bold text-primary-900">
                  {Math.round(stats.userPerformance.averageActivityScore || 0)}
                </div>
                <div className="text-xs text-primary-600">
                  จากกิจกรรม {stats.userPerformance.activityCount} รายการ
                </div>
              </div>

              {/* Growth Trend */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-600 text-sm font-medium">การเติบโต</span>
                  <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                    {stats.userPerformance.trends.growth >= 0 ? '📈' : '📉'}
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {stats.userPerformance.trends.growth >= 0 ? '+' : ''}{Math.round(stats.userPerformance.trends.growth || 0)}%
                </div>
                <div className="text-xs text-green-600">
                  เปรียบเทียบ 7 วันที่แล้ว
                </div>
              </div>

              {/* Best Category */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-600 text-sm font-medium">หมวดที่แข็งแกร่ง</span>
                  <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                    💪
                  </div>
                </div>
                <div className="text-lg font-bold text-purple-900">
                  {Object.keys(stats.userPerformance.categoryScores || {}).length > 0 ? (
                    (() => {
                      const bestCategory = Object.entries(stats.userPerformance.categoryScores)
                        .sort(([,a]: any, [,b]: any) => b.average - a.average)[0];
                      const categoryNames: any = {
                        prospecting: 'หาลูกค้า',
                        qualification: 'คัดกรอง',
                        presentation: 'นำเสนอ',
                        negotiation: 'เจรจา',
                        closing: 'ปิดการขาย',
                        'follow-up': 'ติดตาม',
                        support: 'สนับสนุน'
                      };
                      return categoryNames[bestCategory[0]] || bestCategory[0];
                    })()
                  ) : (
                    'ยังไม่มีข้อมูล'
                  )}
                </div>
                <div className="text-xs text-purple-600">
                  จากการวิเคราะห์ AI
                </div>
              </div>

              {/* Activity Volume */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-orange-600 text-sm font-medium">ความถี่ในการทำงาน</span>
                  <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                    ⚡
                  </div>
                </div>
                <div className="text-2xl font-bold text-orange-900">
                  {stats.userPerformance.activityCount || 0}
                </div>
                <div className="text-xs text-orange-600">
                  กิจกรรมใน 30 วันที่แล้ว
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            {Object.keys(stats.userPerformance.categoryScores || {}).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">คะแนนตามหมวดกิจกรรม</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(stats.userPerformance.categoryScores).map(([category, data]: any) => {
                    const categoryNames: any = {
                      prospecting: { name: 'หาลูกค้า', icon: '🔍', color: 'purple' },
                      qualification: { name: 'คัดกรอง', icon: '🎯', color: 'primary' },
                      presentation: { name: 'นำเสนอ', icon: '📊', color: 'green' },
                      negotiation: { name: 'เจรจา', icon: '🤝', color: 'orange' },
                      closing: { name: 'ปิดการขาย', icon: '✅', color: 'red' },
                      'follow-up': { name: 'ติดตาม', icon: '📞', color: 'indigo' },
                      support: { name: 'สนับสนุน', icon: '💬', color: 'pink' }
                    };
                    const info = categoryNames[category] || { name: category, icon: '📋', color: 'gray' };
                    
                    return (
                      <div key={category} className={`bg-${info.color}-50 border border-${info.color}-200 rounded-lg p-3`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-${info.color}-600 text-xs font-medium`}>
                            {info.icon} {info.name}
                          </span>
                          <span className={`text-${info.color}-900 text-sm font-bold`}>
                            {Math.round(data.average)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {data.count} กิจกรรม
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Overview Chart and Customers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Overview Chart */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-gray-900 text-xl font-semibold">ภาพรวมรายเดือน</h3>
                <p className="text-gray-500 text-sm">รายได้รายเดือน</p>
              </div>
              <div className="bg-[#F9FBFF] rounded-[10px] px-4 py-2 flex items-center space-x-2">
                <span className="text-[#7E7E7E] text-xs">{selectedPeriod}</span>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path d="M6 9L12 15L18 9" stroke="#7E7E7E" strokeWidth="2"/>
                </svg>
              </div>
            </div>

            {/* Chart */}
            <div className="relative h-[300px] flex items-end justify-between">
              {monthlyData.length > 0 ? monthlyData.map((data: any, index: number) => {
                const isHighest = data.activityCount === maxValue && maxValue > 0;
                return (
                  <div key={data.month || index} className="flex flex-col items-center">
                    <div 
                      className={`w-8 rounded-lg mb-2 ${
                        isHighest
                          ? 'bg-primary-600 shadow-[0px_8px_12px_rgba(0,185,0,0.30)]' 
                          : 'bg-[#F2EFFF]'
                      }`}
                      style={{ 
                        height: `${maxValue > 0 ? (data.activityCount / maxValue) * 200 : 20}px`,
                        minHeight: '20px'
                      }}
                    />
                    <span className={`text-xs ${isHighest ? 'font-bold' : 'font-normal'} text-[#4F4F4F]`}>
                      {data.month}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      {data.activityCount}
                    </span>
                  </div>
                );
              }) : (
                <div className="flex items-center justify-center w-full h-full text-gray-400">
                  <div className="text-center">
                    <p className="text-sm">ยังไม่มีข้อมูลกิจกรรม</p>
                    <p className="text-xs">เริ่มบันทึกเสียงเพื่อดูสถิติ</p>
                  </div>
                </div>
              )}
              
              {/* Highlight label for highest month */}
              {monthlyData.length > 0 && maxValue > 0 && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-black text-white px-3 py-1 rounded text-xs font-semibold flex items-center space-x-1">
                  <svg width="14" height="7" viewBox="0 0 14 7">
                    <path d="M0 0L14 7" stroke="#00AC4F" strokeWidth="2"/>
                  </svg>
                  <span>{stats.analyticsData?.trends.growth || 0}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Activities Performance */}
          <div className="bg-gradient-to-br from-lime-50 to-green-50 rounded-2xl shadow-lg p-6 border-2 border-lime-200">
            <div className="mb-6">
              <h3 className="text-gray-900 text-xl font-semibold">ประสิทธิภาพกิจกรรม</h3>
              <p className="text-gray-500 text-sm">อัตราความสำเร็จของกิจกรรม</p>
            </div>

            {/* Circular Progress */}
            <div className="flex justify-center">
              <div className="relative w-[229px] h-[229px] bg-white shadow-[0px_10px_60px_rgba(225.83,236.19,248.63,0.50)] rounded-full flex items-center justify-center">
                <div className="w-[181px] h-[181px] rounded-full bg-gradient-to-r from-[#FF007A] to-[#CDF4FF] relative">
                  <div className="w-[169px] h-[169px] bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-[20px] border-[#F1EFFB]"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="text-[23.76px] font-bold text-black">
                      {stats.analyticsData?.overview.completionRate || 0}%
                    </div>
                    <div className="text-[11.88px] text-black leading-[13.07px]">
                      Completion<br/>Rate
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-green-600">{stats.completedDeals}</div>
                <div className="text-gray-500">เสร็จสิ้น</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-primary-600">{stats.activeDeals}</div>
                <div className="text-gray-500">กำลังดำเนินการ</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities Table */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-gray-900 text-xl font-semibold">กิจกรรมล่าสุด</h3>
            <div className="flex space-x-4">
              <div className="bg-[#F9FBFF] rounded-[10px] px-4 py-2 flex items-center space-x-2">
                <span className="text-[#7E7E7E] text-xs">จากข้อมูลจริง</span>
              </div>
            </div>
          </div>

          {stats.recentActivities && stats.recentActivities.length > 0 ? (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-5 gap-6 pb-4 border-b border-[#EEEEEE] mb-6">
                <span className="text-[#B5B7C0] text-sm">ลูกค้า</span>
                <span className="text-[#B5B7C0] text-sm">หมวดหมู่</span>
                <span className="text-[#B5B7C0] text-sm">สถานะ</span>
                <span className="text-[#B5B7C0] text-sm">วันที่</span>
                <span className="text-[#B5B7C0] text-sm">คะแนน</span>
              </div>

              {/* Table Rows */}
              <div className="space-y-6">
                {stats.recentActivities.slice(0, 5).map((activity: any, index: number) => (
                  <div key={activity.id || index} className="grid grid-cols-5 gap-6 items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {activity.customerName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h4 className="text-black text-sm font-semibold">{activity.customerName || 'ไม่ระบุ'}</h4>
                        <p className="text-[#9197B3] text-xs truncate max-w-[150px]">{activity.title}</p>
                      </div>
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block max-w-fit ${
                      activity.category === 'closing' ? 'bg-red-100 text-red-800' :
                      activity.category === 'negotiation' ? 'bg-orange-100 text-orange-800' :
                      activity.category === 'presentation' ? 'bg-green-100 text-green-800' :
                      activity.category === 'qualification' ? 'bg-primary-100 text-primary-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.category === 'closing' ? '🎯 ปิดการขาย' :
                       activity.category === 'negotiation' ? '🤝 เจรจา' :
                       activity.category === 'presentation' ? '📊 นำเสนอ' :
                       activity.category === 'qualification' ? '🎯 คัดกรอง' :
                       activity.category === 'prospecting' ? '🔍 หาลูกค้า' :
                       activity.category === 'follow-up' ? '📞 ติดตาม' :
                       '📋 ทั่วไป'}
                    </span>
                    
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                      activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.status === 'completed' ? '✅ เสร็จสิ้น' :
                       activity.status === 'pending' ? '⏳ รอดำเนินการ' :
                       activity.status}
                    </span>
                    
                    <span className="text-[#313131] text-sm">
                      {new Date(activity.createdAt).toLocaleDateString('th-TH')}
                    </span>
                    
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div 
                          className={`h-full rounded-full ${
                            (activity.activityScore || 0) >= 80 ? 'bg-green-500' :
                            (activity.activityScore || 0) >= 60 ? 'bg-yellow-500' :
                            (activity.activityScore || 0) >= 40 ? 'bg-orange-500' : 'bg-red-400'
                          }`}
                          style={{ width: `${activity.activityScore || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{activity.activityScore || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีกิจกรรม</h3>
              <p className="text-gray-500 mb-4">เริ่มบันทึกเสียงเพื่อสร้างกิจกรรมแรกของคุณ</p>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                🎤 เริ่มบันทึกเสียง
              </button>
            </div>
          )}
        </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 