import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import ApiService from '../services/apiService';

interface SearchFilters {
  query: string;
  activityType: string;
  status: string;
  category: string;
  dateRange: string;
  customerName: string;
  scoreRange: {
    min: number;
    max: number;
  };
  valueRange: {
    min: number;
    max: number;
  };
}

interface SearchAndFilterProps {
  onResultsChange: (results: any[]) => void;
  onLoadingChange: (loading: boolean) => void;
  searchType: 'activities' | 'customers';
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  onResultsChange,
  onLoadingChange,
  searchType
}) => {
  const { success, error: showError } = useToast();
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    activityType: '',
    status: '',
    category: '',
    dateRange: '',
    customerName: '',
    scoreRange: { min: 0, max: 100 },
    valueRange: { min: 0, max: 10000000 }
  });
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`recentSearches_${searchType}`);
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, [searchType]);

  // Auto-search when filters change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.query.length > 2 || hasActiveFilters()) {
        performSearch();
      } else if (filters.query.length === 0) {
        // Show all results when query is empty
        fetchAllResults();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  const hasActiveFilters = () => {
    return filters.activityType || filters.status || filters.category || 
           filters.dateRange || filters.customerName ||
           filters.scoreRange.min > 0 || filters.scoreRange.max < 100 ||
           filters.valueRange.min > 0 || filters.valueRange.max < 10000000;
  };

  const fetchAllResults = async () => {
    try {
      onLoadingChange(true);
      let result;
      
      if (searchType === 'activities') {
        result = await ApiService.getActivities();
      } else {
        result = await ApiService.getCustomers();
      }
      
      if (result.success) {
        setSearchResults(result.data);
        onResultsChange(result.data);
      }
    } catch (error) {
      console.error('Error fetching all results:', error);
      showError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      onLoadingChange(false);
    }
  };

  const performSearch = async () => {
    try {
      onLoadingChange(true);
      let results = [];
      
      if (searchType === 'activities') {
        // Search activities
        if (filters.query) {
          const searchResult = await ApiService.searchActivities(filters.query);
          results = searchResult.success ? searchResult.data : [];
        } else {
          const allResult = await ApiService.getActivities();
          results = allResult.success ? allResult.data : [];
        }
        
        // Apply additional filters
        results = results.filter(item => {
          // Activity type filter
          if (filters.activityType && item.activityType !== filters.activityType) {
            return false;
          }
          
          // Status filter
          if (filters.status && item.status !== filters.status) {
            return false;
          }
          
          // Category filter
          if (filters.category && item.category !== filters.category) {
            return false;
          }
          
          // Customer name filter
          if (filters.customerName && !item.customerName.toLowerCase().includes(filters.customerName.toLowerCase())) {
            return false;
          }
          
          // Score range filter
          const score = item.activityScore || 0;
          if (score < filters.scoreRange.min || score > filters.scoreRange.max) {
            return false;
          }
          
          // Value range filter
          const value = item.estimatedValue || 0;
          if (value < filters.valueRange.min || value > filters.valueRange.max) {
            return false;
          }
          
          // Date range filter
          if (filters.dateRange) {
            const itemDate = new Date(item.createdAt);
            const now = new Date();
            const daysAgo = parseInt(filters.dateRange);
            const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
            if (itemDate < cutoffDate) {
              return false;
            }
          }
          
          return true;
        });
        
      } else {
        // Search customers
        const customersResult = await ApiService.getCustomers();
        results = customersResult.success ? customersResult.data : [];
        
        // Apply filters for customers
        results = results.filter(customer => {
          // Query filter (name, email, company)
          if (filters.query) {
            const searchTerm = filters.query.toLowerCase();
            const matchesName = customer.name.toLowerCase().includes(searchTerm);
            const matchesEmail = customer.email?.toLowerCase().includes(searchTerm) || false;
            const matchesCompany = customer.company?.toLowerCase().includes(searchTerm) || false;
            
            if (!matchesName && !matchesEmail && !matchesCompany) {
              return false;
            }
          }
          
          // Status filter
          if (filters.status && customer.status !== filters.status) {
            return false;
          }
          
          // Industry filter (using category field)
          if (filters.category && customer.industry !== filters.category) {
            return false;
          }
          
          // Date range filter
          if (filters.dateRange) {
            const customerDate = new Date(customer.createdAt);
            const now = new Date();
            const daysAgo = parseInt(filters.dateRange);
            const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
            if (customerDate < cutoffDate) {
              return false;
            }
          }
          
          return true;
        });
      }
      
      setSearchResults(results);
      onResultsChange(results);
      
      // Save to recent searches
      if (filters.query && filters.query.length > 2) {
        saveRecentSearch(filters.query);
      }
      
    } catch (error) {
      console.error('Search error:', error);
      showError('เกิดข้อผิดพลาดในการค้นหา');
    } finally {
      onLoadingChange(false);
    }
  };

  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(`recentSearches_${searchType}`, JSON.stringify(updated));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      activityType: '',
      status: '',
      category: '',
      dateRange: '',
      customerName: '',
      scoreRange: { min: 0, max: 100 },
      valueRange: { min: 0, max: 10000000 }
    });
    fetchAllResults();
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getActivityTypes = () => [
    { value: '', label: 'ทุกประเภท' },
    { value: 'call', label: '📞 โทรศัพท์' },
    { value: 'meeting', label: '🤝 ประชุม' },
    { value: 'email', label: '📧 อีเมล' },
    { value: 'voice-note', label: '🎤 บันทึกเสียง' }
  ];

  const getStatusOptions = () => {
    if (searchType === 'activities') {
      return [
        { value: '', label: 'ทุกสถานะ' },
        { value: 'pending', label: '⏳ รอดำเนินการ' },
        { value: 'completed', label: '✅ เสร็จสิ้น' },
        { value: 'follow-up', label: '📞 ติดตาม' },
        { value: 'cancelled', label: '❌ ยกเลิก' }
      ];
    } else {
      return [
        { value: '', label: 'ทุกสถานะ' },
        { value: 'lead', label: '🎯 ลีด' },
        { value: 'prospect', label: '👤 โปรสเปค' },
        { value: 'active_customer', label: '✅ ลูกค้าปัจจุบัน' },
        { value: 'inactive_customer', label: '😴 ลูกค้าไม่ใช้งาน' },
        { value: 'former_customer', label: '👋 ลูกค้าเก่า' }
      ];
    }
  };

  const getCategoryOptions = () => {
    if (searchType === 'activities') {
      return [
        { value: '', label: 'ทุกหมวดหมู่' },
        { value: 'prospecting', label: '🔍 การหาลูกค้า' },
        { value: 'qualification', label: '🎯 การคัดกรอง' },
        { value: 'presentation', label: '📊 การนำเสนอ' },
        { value: 'negotiation', label: '🤝 การเจรจา' },
        { value: 'closing', label: '✅ การปิดการขาย' },
        { value: 'follow-up', label: '📞 การติดตาม' },
        { value: 'support', label: '💬 การสนับสนุน' }
      ];
    } else {
      return [
        { value: '', label: 'ทุกอุตสาหกรรม' },
        { value: 'technology', label: '💻 เทคโนโลยี' },
        { value: 'finance', label: '💰 การเงิน' },
        { value: 'healthcare', label: '🏥 สุขภาพ' },
        { value: 'education', label: '📚 การศึกษา' },
        { value: 'retail', label: '🛍️ ค้าปลีก' },
        { value: 'manufacturing', label: '🏭 การผลิต' },
        { value: 'services', label: '🔧 บริการ' }
      ];
    }
  };

  const getDateRangeOptions = () => [
    { value: '', label: 'ทุกช่วงเวลา' },
    { value: '1', label: '1 วันล่าสุด' },
    { value: '7', label: '7 วันล่าสุด' },
    { value: '30', label: '30 วันล่าสุด' },
    { value: '90', label: '3 เดือนล่าสุด' },
    { value: '365', label: '1 ปีล่าสุด' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Main Search Bar */}
      <div className="relative mb-4">
        <div className="flex items-center bg-gray-50 rounded-lg p-3">
          <div className="flex-1 flex items-center">
            <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={searchType === 'activities' ? 'ค้นหากิจกรรม, ลูกค้า, หรือคำอธิบาย...' : 'ค้นหาลูกค้า, บริษัท, หรืออีเมล...'}
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              className="flex-1 bg-transparent border-none outline-none placeholder-gray-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {(filters.query || hasActiveFilters()) && (
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                ล้าง
              </button>
            )}
            
            <button
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                isAdvancedOpen ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🔧 ตัวกรองขั้นสูง
            </button>
          </div>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && filters.query === '' && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10">
            <div className="p-3">
              <p className="text-xs text-gray-500 mb-2">ค้นหาล่าสุด:</p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleFilterChange('query', search)}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {isAdvancedOpen && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">🔧 ตัวกรองขั้นสูง</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Activity Type / Customer Specific Filters */}
            {searchType === 'activities' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ประเภทกิจกรรม</label>
                <select
                  value={filters.activityType}
                  onChange={(e) => handleFilterChange('activityType', e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getActivityTypes().map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">สถานะ</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {getStatusOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {searchType === 'activities' ? 'หมวดหมู่' : 'อุตสาหกรรม'}
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {getCategoryOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">ช่วงเวลา</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {getDateRangeOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Customer Name (for activities) */}
            {searchType === 'activities' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ชื่อลูกค้า</label>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อลูกค้า..."
                  value={filters.customerName}
                  onChange={(e) => handleFilterChange('customerName', e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Score Range (for activities) */}
            {searchType === 'activities' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  คะแนน: {filters.scoreRange.min}-{filters.scoreRange.max}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.scoreRange.min}
                    onChange={(e) => handleFilterChange('scoreRange', { ...filters.scoreRange, min: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.scoreRange.max}
                    onChange={(e) => handleFilterChange('scoreRange', { ...filters.scoreRange, max: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {searchResults.length > 0 ? (
              <>พบ <span className="font-semibold text-blue-600">{searchResults.length}</span> รายการ</>
            ) : (
              'ไม่พบรายการที่ตรงกับเงื่อนไข'
            )}
          </p>
          
          {hasActiveFilters() && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">ตัวกรองที่ใช้งาน:</span>
              <div className="flex flex-wrap gap-1">
                {filters.activityType && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {getActivityTypes().find(t => t.value === filters.activityType)?.label}
                  </span>
                )}
                {filters.status && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    {getStatusOptions().find(s => s.value === filters.status)?.label}
                  </span>
                )}
                {filters.category && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                    {getCategoryOptions().find(c => c.value === filters.category)?.label}
                  </span>
                )}
                {filters.dateRange && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                    {getDateRangeOptions().find(d => d.value === filters.dateRange)?.label}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilter;