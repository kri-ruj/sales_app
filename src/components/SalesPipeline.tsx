import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import ApiService from '../services/apiService';

interface Deal {
  _id: string;
  title: string;
  description: string;
  customerName: string;
  contactInfo: string;
  value: number;
  status: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost' | 'active';
  stage: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expectedCloseDate?: string;
  probability: number;
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  icon: string;
  textColor: string;
  deals: Deal[];
  totalValue: number;
  averageProbability: number;
}

const SalesPipeline: React.FC = () => {
  const { success, error: showError } = useToast();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30');
  const [showDealModal, setShowDealModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const pipelineStages = [
    { id: 'lead', name: 'ลีด', color: 'bg-gray-100 border-gray-300', icon: '🎯', textColor: 'text-gray-700' },
    { id: 'qualified', name: 'คัดกรองแล้ว', color: 'bg-primary-100 border-primary-300', icon: '✅', textColor: 'text-primary-700' },
    { id: 'proposal', name: 'เสนอราคา', color: 'bg-yellow-100 border-yellow-300', icon: '📄', textColor: 'text-yellow-700' },
    { id: 'negotiation', name: 'เจรจา', color: 'bg-orange-100 border-orange-300', icon: '🤝', textColor: 'text-orange-700' },
    { id: 'won', name: 'ปิดสำเร็จ', color: 'bg-green-100 border-green-300', icon: '🎉', textColor: 'text-green-700' },
    { id: 'lost', name: 'เสียโอกาส', color: 'bg-red-100 border-red-300', icon: '❌', textColor: 'text-red-700' }
  ];

  useEffect(() => {
    fetchDeals();
  }, [selectedTimeRange]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const result = await ApiService.getDeals();
      
      if (result.success) {
        const deals = result.data;
        
        // Filter by time range
        const filteredDeals = filterDealsByTimeRange(deals);
        
        // Group deals by stage
        const groupedStages = pipelineStages.map(stageConfig => {
          const stageDeals = filteredDeals.filter(deal => deal.status === stageConfig.id);
          const totalValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
          const averageProbability = stageDeals.length > 0 
            ? stageDeals.reduce((sum, deal) => sum + deal.probability, 0) / stageDeals.length 
            : 0;

          return {
            ...stageConfig,
            deals: stageDeals,
            totalValue,
            averageProbability
          };
        });

        setStages(groupedStages);
      } else {
        throw new Error(result.message || 'Failed to fetch deals');
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
      showError('เกิดข้อผิดพลาดในการโหลดข้อมูลดีล');
    } finally {
      setLoading(false);
    }
  };

  const filterDealsByTimeRange = (deals: Deal[]) => {
    const days = parseInt(selectedTimeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return deals.filter(deal => {
      const dealDate = new Date(deal.updatedAt);
      return dealDate >= cutoffDate;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPriorityColor = (priority: Deal['priority']) => {
    const colors = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-primary-100 text-primary-600',
      high: 'bg-orange-100 text-orange-600',
      urgent: 'bg-red-100 text-red-600'
    };
    return colors[priority] || colors.medium;
  };

  const getPriorityIcon = (priority: Deal['priority']) => {
    const icons = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      urgent: '🔴'
    };
    return icons[priority] || icons.medium;
  };

  const handleDragStart = (deal: Deal) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDropTarget(stageId);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    setDropTarget(null);
    
    if (!draggedDeal || draggedDeal.status === targetStageId) {
      setDraggedDeal(null);
      return;
    }

    try {
      // Update deal status
      const updatedDeal = { ...draggedDeal, status: targetStageId as Deal['status'] };
      const result = await ApiService.updateDeal(draggedDeal._id, { status: targetStageId as Deal['status'] });
      
      if (result.success) {
        success(`ย้ายดีล "${draggedDeal.title}" ไปยัง "${pipelineStages.find(s => s.id === targetStageId)?.name}" เรียบร้อย`);
        await fetchDeals(); // Refresh the data
      } else {
        throw new Error(result.message || 'Failed to update deal');
      }
    } catch (error) {
      console.error('Error updating deal:', error);
      showError('เกิดข้อผิดพลาดในการย้ายดีล');
    }
    
    setDraggedDeal(null);
  };

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setShowDealModal(true);
  };

  const getTotalPipelineValue = () => {
    return stages.reduce((sum, stage) => sum + stage.totalValue, 0);
  };

  const getWeightedPipelineValue = () => {
    return stages.reduce((sum, stage) => {
      const stageValue = stage.deals.reduce((dealSum, deal) => {
        return dealSum + (deal.value * (deal.probability / 100));
      }, 0);
      return sum + stageValue;
    }, 0);
  };

  const getConversionRate = () => {
    const totalDeals = stages.reduce((sum, stage) => sum + stage.deals.length, 0);
    const wonDeals = stages.find(s => s.id === 'won')?.deals.length || 0;
    return totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-200 h-64 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🔄 Sales Pipeline</h1>
          <p className="text-gray-600">จัดการดีลและติดตามความคืบหน้าการขาย</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="7">7 วันล่าสุด</option>
            <option value="30">30 วันล่าสุด</option>
            <option value="90">90 วันล่าสุด</option>
            <option value="365">ปีนี้</option>
          </select>
          
          <button
            onClick={fetchDeals}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            🔄 รีเฟรช
          </button>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">มูลค่ารวม</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalPipelineValue())}</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-full">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">มูลค่าถ่วงน้ำหนัก</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(getWeightedPipelineValue())}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <span className="text-2xl">⚖️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">อัตราแปลง</p>
              <p className="text-2xl font-bold text-gray-900">{getConversionRate().toFixed(1)}%</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">ดีลทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">
                {stages.reduce((sum, stage) => sum + stage.deals.length, 0)}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className={`${stage.color} border-2 rounded-lg p-4 min-h-96 transition-all duration-200 ${
              dropTarget === stage.id ? 'border-primary-500 bg-primary-50 scale-105' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Stage Header */}
            <div className="mb-4">
              <div className={`flex items-center mb-2 ${stage.textColor}`}>
                <span className="text-xl mr-2">{stage.icon}</span>
                <h3 className="font-semibold">{stage.name}</h3>
              </div>
              <div className="text-xs space-y-1">
                <p>{stage.deals.length} ดีล</p>
                <p className="font-medium">{formatCurrency(stage.totalValue)}</p>
                {stage.averageProbability > 0 && (
                  <p>เฉลี่ย {stage.averageProbability.toFixed(0)}%</p>
                )}
              </div>
            </div>

            {/* Deals */}
            <div className="space-y-3">
              {stage.deals.map((deal) => (
                <div
                  key={deal._id}
                  draggable
                  onDragStart={() => handleDragStart(deal)}
                  onClick={() => handleDealClick(deal)}
                  className={`bg-white rounded-lg p-3 shadow-sm cursor-move hover:shadow-md transition-all duration-200 border border-gray-200 ${
                    draggedDeal?._id === deal._id ? 'opacity-50 scale-95' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{deal.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(deal.priority)}`}>
                      {getPriorityIcon(deal.priority)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2">👤 {deal.customerName}</p>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-green-600">{formatCurrency(deal.value)}</span>
                    <span className="text-gray-500">{deal.probability}%</span>
                  </div>
                  
                  {deal.expectedCloseDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      🗓️ {new Date(deal.expectedCloseDate).toLocaleDateString('th-TH')}
                    </p>
                  )}
                  
                  {deal.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {deal.tags.slice(0, 2).map((tag, index) => (
                        <span key={index} className="px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                      {deal.tags.length > 2 && (
                        <span className="text-xs text-gray-400">+{deal.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {stage.deals.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">ไม่มีดีลในขั้นตอนนี้</p>
                  <p className="text-xs mt-1">ลากดีลมาวางที่นี่</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Deal Detail Modal */}
      {showDealModal && selectedDeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">รายละเอียดดีล</h3>
                <button
                  onClick={() => setShowDealModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{selectedDeal.title}</h4>
                  <p className="text-gray-600">{selectedDeal.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ลูกค้า</label>
                    <p className="text-gray-900">{selectedDeal.customerName}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">มูลค่า</label>
                    <p className="text-green-600 font-semibold">{formatCurrency(selectedDeal.value)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ความน่าจะเป็น</label>
                    <p className="text-primary-600">{selectedDeal.probability}%</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ระดับความสำคัญ</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getPriorityColor(selectedDeal.priority)}`}>
                      {getPriorityIcon(selectedDeal.priority)} {selectedDeal.priority}
                    </span>
                  </div>
                </div>

                {selectedDeal.expectedCloseDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">วันที่คาดว่าจะปิด</label>
                    <p className="text-gray-900">{new Date(selectedDeal.expectedCloseDate).toLocaleDateString('th-TH')}</p>
                  </div>
                )}

                {selectedDeal.tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">แท็ก</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedDeal.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDeal.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">หมายเหตุ</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedDeal.notes}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowDealModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    ปิด
                  </button>
                  <button
                    onClick={() => window.location.href = `/deals/edit/${selectedDeal._id}`}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    แก้ไข
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPipeline;