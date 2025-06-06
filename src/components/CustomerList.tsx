import React, { useState, useEffect } from 'react';
import ApiService, { Customer } from '../services/apiService';
import { useToast } from '../hooks/useToast';
import SearchAndFilter from './SearchAndFilter';

const CustomerList: React.FC = () => {
  const { success, error: showError, warning } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'lead' as Customer['status'],
    source: '',
    tags: [] as string[],
    notes: '',
    industry: '',
    companySize: undefined as Customer['companySize'],
    budget: undefined as Customer['budget'],
    priority: 'medium' as Customer['priority'],
    leadScore: 0,
    region: '',
    timezone: '',
    preferredContactMethod: 'email' as Customer['preferredContactMethod'],
    decisionMaker: false,
    painPoints: [] as string[],
    interests: [] as string[],
    competitors: [] as string[],
    referredBy: '',
    socialProfiles: {
      linkedin: '',
      facebook: '',
      twitter: '',
      line: ''
    }
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchResults = (results: Customer[]) => {
    setCustomers(results);
  };

  const handleSearchLoading = (isLoading: boolean) => {
    setSearchLoading(isLoading);
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.getCustomers();
      
      if (response.success) {
        setCustomers(response.data);
      } else {
        throw new Error('Failed to fetch customers');
      }
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setError('ไม่สามารถโหลดข้อมูลลูกค้าได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async () => {
    try {
      if (!newCustomer.name.trim()) {
        warning('กรุณากรอกชื่อลูกค้า');
        return;
      }

      const response = await ApiService.createCustomer(newCustomer);
      
      if (response.success) {
        setCustomers([...customers, response.data]);
        setShowAddModal(false);
        setNewCustomer({
          name: '',
          email: '',
          phone: '',
          company: '',
          status: 'lead',
          source: '',
          tags: [],
          notes: '',
          industry: '',
          companySize: undefined,
          budget: undefined,
          priority: 'medium',
          leadScore: 0,
          region: '',
          timezone: '',
          preferredContactMethod: 'email',
          decisionMaker: false,
          painPoints: [],
          interests: [],
          competitors: [],
          referredBy: '',
          socialProfiles: {
            linkedin: '',
            facebook: '',
            twitter: '',
            line: ''
          }
        });
        success('เพิ่มลูกค้าเรียบร้อยแล้ว!');
      } else {
        throw new Error('Failed to create customer');
      }
    } catch (err: any) {
      console.error('Error creating customer:', err);
      showError('เกิดข้อผิดพลาดในการเพิ่มลูกค้า กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowEditModal(true);
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomer) return;

    try {
      const response = await ApiService.updateCustomer(editingCustomer._id, editingCustomer);
      
      if (response.success) {
        setCustomers(customers.map(c => c._id === editingCustomer._id ? response.data : c));
        setShowEditModal(false);
        setEditingCustomer(null);
        success('อัพเดทข้อมูลลูกค้าเรียบร้อยแล้ว!');
      } else {
        throw new Error('Failed to update customer');
      }
    } catch (err: any) {
      console.error('Error updating customer:', err);
      showError('เกิดข้อผิดพลาดในการอัพเดทข้อมูลลูกค้า กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleDeleteCustomer = async (customerId: string, customerName: string) => {
    if (!window.confirm(`คุณแน่ใจหรือว่าต้องการลบลูกค้า "${customerName}"?`)) {
      return;
    }

    try {
      const response = await ApiService.deleteCustomer(customerId);
      
      if (response.success) {
        setCustomers(customers.filter(c => c._id !== customerId));
        success('ลบลูกค้าเรียบร้อยแล้ว!');
      } else {
        throw new Error('Failed to delete customer');
      }
    } catch (err: any) {
      console.error('Error deleting customer:', err);
      showError('เกิดข้อผิดพลาดในการลบลูกค้า กรุณาลองใหม่อีกครั้ง');
    }
  };

  const filteredCustomers = customers
    .filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (customer.company && customer.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'company':
          return (a.company || '').localeCompare(b.company || '');
        case 'status':
          return a.status.localeCompare(b.status);
        case 'totalValue':
          return (b.totalValue || 0) - (a.totalValue || 0);
        case 'lastContact':
          return new Date(b.lastContactDate || 0).getTime() - new Date(a.lastContactDate || 0).getTime();
        default:
          return 0;
      }
    });


  const formatCurrency = (amount: number | undefined): string => {
    if (!amount) return '฿0';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'lead': { color: 'bg-primary-100 text-primary-800', text: 'Lead' },
      'prospect': { color: 'bg-yellow-100 text-yellow-800', text: 'Prospect' },
      'active_customer': { color: 'bg-green-100 text-green-800', text: 'ลูกค้า' },
      'inactive_customer': { color: 'bg-gray-100 text-gray-800', text: 'ไม่ใช้งาน' },
      'former_customer': { color: 'bg-red-100 text-red-800', text: 'ลูกค้าเก่า' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.lead;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลลูกค้า...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800 mb-4">❌ {error}</p>
          <button 
            onClick={fetchCustomers}
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
          <h1 className="text-3xl font-bold text-gray-900">👥 จัดการลูกค้า</h1>
          <p className="text-gray-600 mt-1">ข้อมูลลูกค้าและ prospects ทั้งหมด</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchCustomers}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            🔄 รีเฟรช
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            ➕ เพิ่มลูกค้าใหม่
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">
              🥦 ค้นหาร้านค้า
            </label>
            <input
              type="text"
              placeholder="ชื่อ, บริษัท, อีเมล..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">
              🌱 สถานะการขาย
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="lead">Lead</option>
              <option value="prospect">Prospect</option>
              <option value="customer">ลูกค้า</option>
              <option value="inactive">ไม่ใช้งาน</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">
              🥕 จัดเรียงตาม
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="name">ชื่อ</option>
              <option value="company">บริษัท</option>
              <option value="status">สถานะ</option>
              <option value="totalValue">มูลค่ารวม</option>
              <option value="lastContact">ติดต่อล่าสุด</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <span className="text-xl">👥</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">ลูกค้าทั้งหมด</p>
              <p className="text-xl font-bold text-gray-900">{customers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-xl">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">ลูกค้าปัจจุบัน</p>
              <p className="text-xl font-bold text-green-600">
                {customers.filter(c => c.status === 'active_customer').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-xl">🎯</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Prospects</p>
              <p className="text-xl font-bold text-yellow-600">
                {customers.filter(c => c.status === 'prospect').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-xl">💰</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">มูลค่ารวม</p>
              <p className="text-lg font-bold text-purple-600">
                {formatCurrency(customers.reduce((sum, c) => sum + (c.totalValue || 0), 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <SearchAndFilter
        searchType="customers"
        onResultsChange={handleSearchResults}
        onLoadingChange={handleSearchLoading}
      />

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            รายชื่อลูกค้า ({filteredCustomers.length} รายการ)
          </h3>
        </div>
        
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">ไม่พบข้อมูลลูกค้าที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ลูกค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    บริษัท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    มูลค่า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ติดต่อล่าสุด
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ข้อมูลเพิ่มเติม
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.company || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(customer.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(customer.totalValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(customer.lastContactDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="space-y-1">
                        {customer.industry && (
                          <div className="flex items-center">
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 text-xs rounded-full">
                              🏭 {customer.industry}
                            </span>
                          </div>
                        )}
                        {customer.priority && customer.priority !== 'medium' && (
                          <div className="flex items-center">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              customer.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                              customer.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {customer.priority === 'urgent' ? '🔥 เร่งด่วน' :
                               customer.priority === 'high' ? '⭐ สูง' : 
                               customer.priority === 'low' ? '⬇️ ต่ำ' : customer.priority}
                            </span>
                          </div>
                        )}
                        {customer.leadScore && customer.leadScore > 0 && (
                          <div className="flex items-center">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              customer.leadScore >= 80 ? 'bg-green-100 text-green-700' :
                              customer.leadScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              📊 {customer.leadScore}/100
                            </span>
                          </div>
                        )}
                        {customer.decisionMaker && (
                          <div className="flex items-center">
                            <span className="bg-primary-100 text-primary-700 px-2 py-1 text-xs rounded-full">
                              👑 ผู้ตัดสินใจ
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditCustomer(customer)}
                          className="text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50"
                        >
                          ✏️ แก้ไข
                        </button>
                        <button 
                          onClick={() => handleDeleteCustomer(customer._id, customer.name)}
                          className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50"
                        >
                          🗑️ ลบ
                        </button>
                        <button className="text-purple-600 hover:text-purple-900 px-2 py-1 rounded hover:bg-purple-50">
                          📞 ติดต่อ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto border-2 border-green-300">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">➕ เพิ่มลูกค้าใหม่</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800 border-b pb-2">ข้อมูลพื้นฐาน</h4>
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">ชื่อลูกค้า *</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="ชื่อ-นามสกุล"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">อีเมล</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="081-234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">บริษัท</label>
                <input
                  type="text"
                  value={newCustomer.company}
                  onChange={(e) => setNewCustomer({...newCustomer, company: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="ชื่อบริษัท"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">สถานะ</label>
                <select
                  value={newCustomer.status}
                  onChange={(e) => setNewCustomer({...newCustomer, status: e.target.value as Customer['status']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="lead">Lead</option>
                  <option value="prospect">Prospect</option>
                  <option value="active_customer">ลูกค้า</option>
                  <option value="inactive_customer">ไม่ใช้งาน</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">แหล่งที่มา</label>
                <input
                  type="text"
                  value={newCustomer.source}
                  onChange={(e) => setNewCustomer({...newCustomer, source: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Website, Referral, Cold Call..."
                />
              </div>

              </div>

              {/* Enhanced Classification Fields */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800 border-b pb-2">ข้อมูลจำแนก</h4>
                
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">อุตสาหกรรม</label>
                  <input
                    type="text"
                    value={newCustomer.industry}
                    onChange={(e) => setNewCustomer({...newCustomer, industry: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="เทคโนโลยี, การผลิต, สุขภาพ..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">ขนาดบริษัท</label>
                  <select
                    value={newCustomer.companySize || ''}
                    onChange={(e) => setNewCustomer({...newCustomer, companySize: e.target.value as Customer['companySize']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">เลือกขนาดบริษัท</option>
                    <option value="startup">Startup</option>
                    <option value="small">เล็ก (1-50 คน)</option>
                    <option value="medium">กลาง (51-250 คน)</option>
                    <option value="large">ใหญ่ (251-1000 คน)</option>
                    <option value="enterprise">องค์กรใหญ่ (1000+ คน)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">งบประมาณ</label>
                  <select
                    value={newCustomer.budget || ''}
                    onChange={(e) => setNewCustomer({...newCustomer, budget: e.target.value as Customer['budget']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">เลือกระดับงบประมาณ</option>
                    <option value="low">น้อย (&lt; 100,000)</option>
                    <option value="medium">ปานกลาง (100,000-1M)</option>
                    <option value="high">สูง (1M-10M)</option>
                    <option value="enterprise">องค์กร (10M+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">ระดับความสำคัญ</label>
                  <select
                    value={newCustomer.priority}
                    onChange={(e) => setNewCustomer({...newCustomer, priority: e.target.value as Customer['priority']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="low">ต่ำ</option>
                    <option value="medium">ปานกลาง</option>
                    <option value="high">สูง</option>
                    <option value="urgent">เร่งด่วน</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Lead Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newCustomer.leadScore}
                    onChange={(e) => setNewCustomer({...newCustomer, leadScore: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">พื้นที่/ภูมิภาค</label>
                  <input
                    type="text"
                    value={newCustomer.region}
                    onChange={(e) => setNewCustomer({...newCustomer, region: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="กรุงเทพ, ภาคเหนือ, ภาคใต้..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">วิธีติดต่อที่ต้องการ</label>
                  <select
                    value={newCustomer.preferredContactMethod}
                    onChange={(e) => setNewCustomer({...newCustomer, preferredContactMethod: e.target.value as Customer['preferredContactMethod']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="email">อีเมล</option>
                    <option value="phone">โทรศัพท์</option>
                    <option value="line">LINE</option>
                    <option value="meeting">นัดประชุม</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="decisionMaker"
                    checked={newCustomer.decisionMaker}
                    onChange={(e) => setNewCustomer({...newCustomer, decisionMaker: e.target.checked})}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="decisionMaker" className="ml-2 block text-sm text-green-700">
                    🥦 เป็นผู้ตัดสินใจซื้อผัก
                  </label>
                </div>
              </div>
            </div>

            {/* Additional Information - Full Width */}
            <div className="mt-6 space-y-4">
              <h4 className="font-medium text-gray-800 border-b pb-2">ข้อมูลเพิ่มเติม</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">แนะนำโดย</label>
                  <input
                    type="text"
                    value={newCustomer.referredBy}
                    onChange={(e) => setNewCustomer({...newCustomer, referredBy: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="ชื่อผู้แนะนำ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">LinkedIn</label>
                  <input
                    type="url"
                    value={newCustomer.socialProfiles?.linkedin || ''}
                    onChange={(e) => setNewCustomer({
                      ...newCustomer, 
                      socialProfiles: { ...newCustomer.socialProfiles, linkedin: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">หมายเหตุ</label>
                <textarea
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="รายละเอียดเพิ่มเติม..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreateCustomer}
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto border-2 border-green-300">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">✏️ แก้ไขข้อมูลลูกค้า</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">ชื่อลูกค้า *</label>
                <input
                  type="text"
                  value={editingCustomer.name}
                  onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="ชื่อ-นามสกุล"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">อีเมล</label>
                <input
                  type="email"
                  value={editingCustomer.email || ''}
                  onChange={(e) => setEditingCustomer({...editingCustomer, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  value={editingCustomer.phone || ''}
                  onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="081-234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">บริษัท</label>
                <input
                  type="text"
                  value={editingCustomer.company || ''}
                  onChange={(e) => setEditingCustomer({...editingCustomer, company: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="ชื่อบริษัท"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">สถานะ</label>
                <select
                  value={editingCustomer.status}
                  onChange={(e) => setEditingCustomer({...editingCustomer, status: e.target.value as Customer['status']})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="lead">Lead</option>
                  <option value="prospect">Prospect</option>
                  <option value="active_customer">ลูกค้า</option>
                  <option value="inactive_customer">ไม่ใช้งาน</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">แหล่งที่มา</label>
                <input
                  type="text"
                  value={editingCustomer.source || ''}
                  onChange={(e) => setEditingCustomer({...editingCustomer, source: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Website, Referral, Cold Call..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">หมายเหตุ</label>
                <textarea
                  value={editingCustomer.notes || ''}
                  onChange={(e) => setEditingCustomer({...editingCustomer, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="รายละเอียดเพิ่มเติม..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCustomer(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUpdateCustomer}
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
              >
                อัพเดท
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList; 