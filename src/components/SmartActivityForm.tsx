import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { SalesActivity } from '../services/apiService';
import aiExtractionService, { ExtractedActivityData } from '../services/aiExtractionService';
import ApiService from '../services/apiService';

interface SmartActivityFormProps {
  transcription: string;
  audioUrl?: string;
  onSubmit: (activity: Partial<SalesActivity>) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
}

interface SuggestionBadge {
  field: string;
  value: string;
  confidence: number;
  reason: string;
  applied: boolean;
}

const SmartActivityForm: React.FC<SmartActivityFormProps> = ({
  transcription,
  audioUrl,
  onSubmit,
  onCancel,
  isOpen
}) => {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedActivityData | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionBadge[]>([]);
  
  const [formData, setFormData] = useState<Partial<SalesActivity>>({
    title: '',
    description: '',
    customerName: '',
    contactInfo: '',
    activityType: 'voice-note',
    status: 'completed',
    priority: 'medium',
    category: 'prospecting',
    actionItems: [],
    tags: [],
    estimatedValue: undefined,
    notes: transcription,
    transcription: transcription,
    audioUrl: audioUrl
  });

  // Extract AI data when component opens
  useEffect(() => {
    if (isOpen && transcription) {
      extractActivityData();
    }
  }, [isOpen, transcription]);

  const extractActivityData = async () => {
    try {
      setExtracting(true);
      const extracted = await aiExtractionService.extractActivityData(transcription, audioUrl);
      setExtractedData(extracted);
      
      // Convert suggestions to badges
      const suggestionBadges: SuggestionBadge[] = extracted.suggestions.map(s => ({
        ...s,
        applied: false
      }));
      setSuggestions(suggestionBadges);
      
      // Auto-apply high confidence suggestions
      const autoAppliedData = { ...formData };
      let hasAutoApplied = false;
      
      if (extracted.confidence > 0.7) {
        autoAppliedData.title = extracted.title;
        autoAppliedData.description = extracted.description;
        autoAppliedData.activityType = extracted.activityType;
        autoAppliedData.priority = extracted.priority;
        autoAppliedData.category = extracted.category;
        autoAppliedData.actionItems = extracted.actionItems;
        autoAppliedData.tags = extracted.tags;
        hasAutoApplied = true;
      }
      
      if (extracted.customerName && extracted.confidence > 0.6) {
        autoAppliedData.customerName = extracted.customerName;
        hasAutoApplied = true;
      }
      
      if (extracted.contactInfo && extracted.confidence > 0.6) {
        autoAppliedData.contactInfo = extracted.contactInfo;
        hasAutoApplied = true;
      }
      
      if (extracted.estimatedValue && extracted.confidence > 0.5) {
        autoAppliedData.estimatedValue = extracted.estimatedValue;
        hasAutoApplied = true;
      }
      
      if (hasAutoApplied) {
        setFormData(autoAppliedData);
        success('🤖 AI ได้แนะนำข้อมูลอัตโนมัติแล้ว โปรดตรวจสอบและแก้ไขตามต้องการ');
      }
      
    } catch (error) {
      console.error('Error extracting activity data:', error);
      showError('ไม่สามารถประมวลผลข้อมูลด้วย AI ได้ กรุณากรอกข้อมูลด้วยตนเอง');
    } finally {
      setExtracting(false);
    }
  };

  const applySuggestion = (index: number) => {
    const suggestion = suggestions[index];
    const fieldMapping: { [key: string]: string } = {
      'customerName': 'customerName',
      'contactInfo': 'contactInfo',
      'estimatedValue': 'estimatedValue',
      'priority': 'priority',
      'category': 'category',
      'activityType': 'activityType',
      'dueDate': 'dueDate'
    };
    
    const formField = fieldMapping[suggestion.field];
    if (formField) {
      setFormData(prev => ({
        ...prev,
        [formField]: suggestion.field === 'estimatedValue' ? 
          parseFloat(suggestion.value.replace(/,/g, '')) : 
          suggestion.value
      }));
      
      // Mark suggestion as applied
      setSuggestions(prev => prev.map((s, i) => 
        i === index ? { ...s, applied: true } : s
      ));
      
      success(`✅ ใช้คำแนะนำ: ${suggestion.reason}`);
    }
  };

  const dismissSuggestion = (index: number) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (field: keyof SalesActivity, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayInputChange = (field: 'actionItems' | 'tags', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({ ...prev, [field]: items }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title?.trim()) {
      showError('กรุณากรอกหัวข้อกิจกรรม');
      return;
    }
    
    if (!formData.customerName?.trim()) {
      showError('กรุณากรอกชื่อลูกค้า');
      return;
    }
    
    try {
      setLoading(true);
      await onSubmit(formData);
      success('✅ บันทึกกิจกรรมเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error submitting activity:', error);
      showError('เกิดข้อผิดพลาดในการบันทึกกิจกรรม');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-300';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return '🎯';
    if (confidence >= 0.6) return '⚠️';
    return '❓';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">🤖 Smart Activity Logger</h2>
              <p className="text-blue-100 mt-1">AI ช่วยกรอกข้อมูลกิจกรรมจากการบันทึกเสียง</p>
            </div>
            {extracting && (
              <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-lg px-3 py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span className="text-sm">AI กำลังวิเคราะห์...</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex h-full">
          {/* Left Panel - AI Suggestions */}
          <div className="w-1/3 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              🧠 AI Suggestions
              {extractedData && (
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getConfidenceColor(extractedData.confidence)}`}>
                  {getConfidenceIcon(extractedData.confidence)} {Math.round(extractedData.confidence * 100)}%
                </span>
              )}
            </h3>
            
            {suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className={`border rounded-lg p-3 ${suggestion.applied ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {suggestion.field === 'customerName' && '👤 ชื่อลูกค้า'}
                        {suggestion.field === 'contactInfo' && '📞 ข้อมูลติดต่อ'}
                        {suggestion.field === 'estimatedValue' && '💰 มูลค่าประมาณ'}
                        {suggestion.field === 'priority' && '⭐ ระดับความสำคัญ'}
                        {suggestion.field === 'category' && '🏷️ หมวดหมู่'}
                        {suggestion.field === 'activityType' && '📋 ประเภทกิจกรรม'}
                        {suggestion.field === 'dueDate' && '📅 กำหนดเวลา'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getConfidenceColor(suggestion.confidence)}`}>
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-900 font-medium mb-1">
                      {suggestion.value}
                    </p>
                    
                    <p className="text-xs text-gray-600 mb-3">
                      {suggestion.reason}
                    </p>
                    
                    {!suggestion.applied ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => applySuggestion(index)}
                          className="flex-1 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                        >
                          ✅ ใช้
                        </button>
                        <button
                          onClick={() => dismissSuggestion(index)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400 transition-colors"
                        >
                          ❌ ไม่ใช้
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-green-600 font-medium">
                        ✅ ใช้แล้ว
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {extracting ? (
                  <div>
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3"></div>
                    <p className="text-sm">กำลังวิเคราะห์ข้อมูล...</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm">🤔 ไม่มีคำแนะนำจาก AI</p>
                    <p className="text-xs mt-1">กรุณากรอกข้อมูลด้วยตนเอง</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Form */}
          <div className="flex-1 p-6 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หัวข้อกิจกรรม *
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="เช่น โทรหาลูกค้า ABC"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อลูกค้า *
                  </label>
                  <input
                    type="text"
                    value={formData.customerName || ''}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ชื่อลูกค้าหรือบริษัท"
                    required
                  />
                </div>
              </div>

              {/* Activity Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ประเภทกิจกรรม
                  </label>
                  <select
                    value={formData.activityType || 'voice-note'}
                    onChange={(e) => handleInputChange('activityType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="call">📞 โทรศัพท์</option>
                    <option value="meeting">🤝 ประชุม</option>
                    <option value="email">📧 อีเมล</option>
                    <option value="voice-note">🎙️ บันทึกเสียง</option>
                    <option value="demo">💻 เดโม</option>
                    <option value="proposal">📄 เสนอราคา</option>
                    <option value="negotiation">🤝 เจรจา</option>
                    <option value="follow-up-call">📞 ติดตาม</option>
                    <option value="site-visit">🏢 เยี่ยมชม</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หมวดหมู่
                  </label>
                  <select
                    value={formData.category || 'prospecting'}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="prospecting">🔍 หาลูกค้า</option>
                    <option value="qualification">🎯 คัดกรอง</option>
                    <option value="presentation">📊 นำเสนอ</option>
                    <option value="negotiation">🤝 เจรจา</option>
                    <option value="closing">✅ ปิดดีล</option>
                    <option value="follow-up">📞 ติดตาม</option>
                    <option value="support">💬 สนับสนุน</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ระดับความสำคัญ
                  </label>
                  <select
                    value={formData.priority || 'medium'}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">⬇️ ต่ำ</option>
                    <option value="medium">➡️ ปานกลาง</option>
                    <option value="high">⭐ สูง</option>
                    <option value="urgent">🔥 เร่งด่วน</option>
                  </select>
                </div>
              </div>

              {/* Contact & Value */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ข้อมูลติดต่อ
                  </label>
                  <input
                    type="text"
                    value={formData.contactInfo || ''}
                    onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="เบอร์โทร หรือ อีเมล"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    มูลค่าประมาณ (บาท)
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedValue || ''}
                    onChange={(e) => handleInputChange('estimatedValue', parseFloat(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียด
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="สรุปสั้นๆ เกี่ยวกับกิจกรรมนี้"
                />
              </div>

              {/* Action Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายการปฏิบัติ (แยกด้วยจุลภาค)
                </label>
                <input
                  type="text"
                  value={formData.actionItems?.join(', ') || ''}
                  onChange={(e) => handleArrayInputChange('actionItems', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น ส่งใบเสนอราคา, นัดประชุม, ติดตาม"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  แท็ก (แยกด้วยจุลภาค)
                </label>
                <input
                  type="text"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) => handleArrayInputChange('tags', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น hot-lead, technology, software"
                />
              </div>

              {/* Transcription Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📝 ข้อความที่ถอดเสียง
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-32 overflow-y-auto">
                  <p className="text-sm text-gray-700">{transcription}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>กำลังบันทึก...</span>
                    </div>
                  ) : (
                    '💾 บันทึกกิจกรรม'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartActivityForm;