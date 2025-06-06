import React, { useState, useEffect } from 'react';

interface ReportData {
  salesByMonth: { month: string; amount: number; deals: number }[];
  topCustomers: { name: string; company: string; totalValue: number }[];
  dealsByStage: { stage: string; count: number; value: number }[];
  activityStats: { type: string; count: number }[];
  performanceMetrics: {
    conversionRate: number;
    averageDealSize: number;
    salesCycle: number;
    winRate: number;
  };
}

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData>({
    salesByMonth: [],
    topCustomers: [],
    dealsByStage: [],
    activityStats: [],
    performanceMetrics: {
      conversionRate: 0,
      averageDealSize: 0,
      salesCycle: 0,
      winRate: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('3months');

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration - replace with actual API calls
      const mockData: ReportData = {
        salesByMonth: [
          { month: 'ต.ค. 2024', amount: 850000, deals: 12 },
          { month: 'พ.ย. 2024', amount: 1200000, deals: 18 },
          { month: 'ธ.ค. 2024', amount: 950000, deals: 15 },
          { month: 'ม.ค. 2025', amount: 1100000, deals: 16 }
        ],
        topCustomers: [
          { name: 'คุณวิทยา สมาร์ท', company: 'XYZ Corporation', totalValue: 1200000 },
          { name: 'คุณสมชาย ใจดี', company: 'บริษัท ABC จำกัด', totalValue: 850000 },
          { name: 'คุณนิรันดร์ เทคโนโลยี', company: 'Tech Solutions Ltd.', totalValue: 650000 },
          { name: 'คุณสุดา ดิจิทัล', company: 'Digital Plus Co.', totalValue: 480000 },
          { name: 'คุณประยุทธ์ คลาวด์', company: 'Cloud First Ltd.', totalValue: 420000 }
        ],
        dealsByStage: [
          { stage: 'Lead', count: 25, value: 2500000 },
          { stage: 'Qualified', count: 18, value: 1800000 },
          { stage: 'Proposal', count: 12, value: 1200000 },
          { stage: 'Negotiation', count: 8, value: 800000 },
          { stage: 'Won', count: 15, value: 1500000 },
          { stage: 'Lost', count: 5, value: 500000 }
        ],
        activityStats: [
          { type: 'call', count: 145 },
          { type: 'meeting', count: 68 },
          { type: 'email', count: 234 },
          { type: 'voice-note', count: 89 }
        ],
        performanceMetrics: {
          conversionRate: 18.5,
          averageDealSize: 125000,
          salesCycle: 45,
          winRate: 75.2
        }
      };

      setReportData(mockData);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('ไม่สามารถโหลดข้อมูลรายงานได้');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return '📞';
      case 'meeting': return '🤝';
      case 'email': return '📧';
      case 'voice-note': return '🎤';
      default: return '📋';
    }
  };

  const getActivityName = (type: string) => {
    switch (type) {
      case 'call': return 'โทรศัพท์';
      case 'meeting': return 'ประชุม';
      case 'email': return 'อีเมล';
      case 'voice-note': return 'บันทึกเสียง';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลรายงาน...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800 mb-4">❌ {error}</p>
          <button 
            onClick={fetchReportData}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 รายงานและการวิเคราะห์</h1>
          <p className="text-gray-600 mt-1">ข้อมูลสถิติและประสิทธิภาพการขาย</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1month">1 เดือนที่ผ่านมา</option>
            <option value="3months">3 เดือนที่ผ่านมา</option>
            <option value="6months">6 เดือนที่ผ่านมา</option>
            <option value="1year">1 ปีที่ผ่านมา</option>
          </select>
          <button
            onClick={fetchReportData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            🔄 รีเฟรช
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">อัตราการแปลง</p>
              <p className="text-3xl font-bold text-blue-600">{reportData.performanceMetrics.conversionRate}%</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ขนาด Deal เฉลี่ย</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.performanceMetrics.averageDealSize)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">วงจรการขาย</p>
              <p className="text-3xl font-bold text-orange-600">{reportData.performanceMetrics.salesCycle}</p>
              <p className="text-xs text-gray-500">วัน</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <span className="text-2xl">⏱️</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">อัตราชนะ</p>
              <p className="text-3xl font-bold text-purple-600">{reportData.performanceMetrics.winRate}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">🏆</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Month */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 ยอดขายรายเดือน</h3>
          <div className="space-y-4">
            {reportData.salesByMonth.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.month}</span>
                    <span className="text-sm text-gray-600">{item.deals} deals</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(item.amount / Math.max(...reportData.salesByMonth.map(s => s.amount))) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deals by Stage */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔄 Deals ตามขั้นตอน</h3>
          <div className="space-y-3">
            {reportData.dealsByStage.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    item.stage === 'Won' ? 'bg-green-500' :
                    item.stage === 'Lost' ? 'bg-red-500' :
                    item.stage === 'Negotiation' ? 'bg-orange-500' :
                    item.stage === 'Proposal' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.stage}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{item.count} deals</div>
                  <div className="text-xs text-gray-600">{formatCurrency(item.value)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 ลูกค้าชั้นนำ</h3>
          <div className="space-y-3">
            {reportData.topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    <div className="text-xs text-gray-600">{customer.company}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{formatCurrency(customer.totalValue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 สถิติกิจกรรม</h3>
          <div className="space-y-4">
            {reportData.activityStats.map((activity, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                  <span className="text-sm font-medium text-gray-700">{getActivityName(activity.type)}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(activity.count / Math.max(...reportData.activityStats.map(a => a.count))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-8 text-right">{activity.count}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600">กิจกรรมทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">
                {reportData.activityStats.reduce((sum, activity) => sum + activity.count, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📤 ส่งออกรายงาน</h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
            📊 Excel
          </button>
          <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
            📄 PDF
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            📈 PowerPoint
          </button>
          <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
            📋 CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports; 