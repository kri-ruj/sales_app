import React, { useState, useEffect } from 'react';
import ApiService from '../../services/apiService';
import { useToast } from '../../hooks/useToast';
import AdvancedChart from './AdvancedChart';

interface AnalyticsData {
  overview: {
    totalActivities: number;
    completedActivities: number;
    pendingActivities: number;
    totalEstimatedValue: number;
    averageActivityScore: number;
    completionRate: number;
  };
  monthlyData: Array<{
    month: string;
    activityCount: number;
    averageScore: number;
    totalScore: number;
    estimatedValue: number;
    completedActivities: number;
  }>;
  categoryBreakdown: {
    [key: string]: {
      count: number;
      totalScore: number;
      averageScore: number;
      estimatedValue: number;
    };
  };
  trends: {
    last7Days: number;
    last30Days: number;
    growth: number;
  };
  recentActivities: Array<{
    id: string;
    title: string;
    customerName: string;
    category: string;
    activityScore: number;
    createdAt: string;
    status: string;
  }>;
}

const AnalyticsDashboard: React.FC = () => {
  const { success, error: showError } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('12'); // months
  const [selectedMetric, setSelectedMetric] = useState<'activities' | 'score' | 'value'>('activities');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const result = await ApiService.getDashboardAnalytics(parseInt(timeRange));
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      showError('เกิดข้อผิดพลาดในการโหลดข้อมูลวิเคราะห์');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('th-TH').format(value);
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'prospecting': '🔍',
      'qualification': '🎯', 
      'presentation': '📊',
      'negotiation': '🤝',
      'closing': '✅',
      'follow-up': '📞',
      'support': '💬',
      'uncategorized': '📋'
    };
    return icons[category] || '📋';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'prospecting': 'bg-purple-100 text-purple-800',
      'qualification': 'bg-blue-100 text-blue-800',
      'presentation': 'bg-green-100 text-green-800',
      'negotiation': 'bg-orange-100 text-orange-800',
      'closing': 'bg-red-100 text-red-800',
      'follow-up': 'bg-indigo-100 text-indigo-800',
      'support': 'bg-pink-100 text-pink-800',
      'uncategorized': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
          <div className="bg-gray-200 h-64 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 h-48 rounded-lg"></div>
            <div className="bg-gray-200 h-48 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">ไม่สามารถโหลดข้อมูลวิเคราะห์ได้</p>
          <button 
            onClick={fetchAnalytics}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 แดชบอร์ดวิเคราะห์</h1>
          <p className="text-gray-600">ข้อมูลประสิทธิภาพการขายและกิจกรรม</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="3">3 เดือนล่าสุด</option>
            <option value="6">6 เดือนล่าสุด</option>
            <option value="12">12 เดือนล่าสุด</option>
            <option value="24">24 เดือนล่าสุด</option>
          </select>
          
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 รีเฟรช
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">กิจกรรมทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(data.overview.totalActivities)}</p>
              <p className="text-sm text-blue-600 font-medium">
                เสร็จแล้ว {data.overview.completedActivities} รายการ
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">คะแนนเฉลี่ย</p>
              <p className="text-2xl font-bold text-gray-900">{data.overview.averageActivityScore}</p>
              <p className="text-sm text-green-600 font-medium">
                อัตราสำเร็จ {data.overview.completionRate}%
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">มูลค่าคาดการณ์</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.overview.totalEstimatedValue)}</p>
              <p className="text-sm text-purple-600 font-medium">
                รอดำเนินการ {data.overview.pendingActivities} รายการ
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">แนวโน้ม 7 วัน</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(data.trends.last7Days)}</p>
              <p className={`text-sm font-medium ${
                data.trends.growth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.trends.growth >= 0 ? '↗️' : '↘️'} {Math.abs(data.trends.growth)}%
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">📈 แนวโน้มรายเดือน</h2>
          
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedMetric('activities')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedMetric === 'activities' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              จำนวนกิจกรรม
            </button>
            <button
              onClick={() => setSelectedMetric('score')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedMetric === 'score' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              คะแนนเฉลี่ย
            </button>
            <button
              onClick={() => setSelectedMetric('value')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedMetric === 'value' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              มูลค่าคาดการณ์
            </button>
          </div>
        </div>
        
        <AdvancedChart 
          data={data.monthlyData} 
          metric={selectedMetric}
          formatCurrency={formatCurrency}
          formatNumber={formatNumber}
        />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">🏷️ การแบ่งตามหมวดหมู่</h2>
          
          <div className="space-y-4">
            {Object.entries(data.categoryBreakdown)
              .sort(([,a], [,b]) => b.count - a.count)
              .map(([category, stats]) => (
              <div key={category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getCategoryIcon(category)}</span>
                  <div>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
                      {category}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatNumber(stats.count)} กิจกรรม • คะแนนเฉลี่ย {stats.averageScore}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(stats.estimatedValue)}</p>
                  <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (stats.count / data.overview.totalActivities) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">⏰ กิจกรรมล่าสุด</h2>
          
          <div className="space-y-4">
            {data.recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <span className="text-lg mr-3">{getCategoryIcon(activity.category)}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{activity.title}</h3>
                    <p className="text-sm text-gray-600">👤 {activity.customerName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                    activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.status === 'completed' ? '✅ เสร็จ' :
                     activity.status === 'pending' ? '⏳ รอ' : activity.status}
                  </div>
                  {activity.activityScore > 0 && (
                    <p className="text-sm font-semibold text-blue-600 mt-1">
                      คะแนน: {activity.activityScore}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => window.location.href = '/activities'}
              className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              ดูกิจกรรมทั้งหมด →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;