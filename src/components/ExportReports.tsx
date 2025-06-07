import React, { useState } from 'react';
import { useToast } from '../hooks/useToast';
import ApiService from '../services/apiService';

interface ExportOptions {
  type: 'activities' | 'customers' | 'deals' | 'analytics';
  format: 'excel' | 'pdf' | 'csv';
  dateRange: string;
  includeCharts: boolean;
  includeDetails: boolean;
  filters: {
    status?: string;
    category?: string;
    customerName?: string;
  };
}

const ExportReports: React.FC = () => {
  const { success, error: showError, warning } = useToast();
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    type: 'activities',
    format: 'excel',
    dateRange: '30',
    includeCharts: true,
    includeDetails: true,
    filters: {}
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const reportTypes = [
    { id: 'activities', name: 'รายงานกิจกรรม', icon: '📋', description: 'รายงานกิจกรรมการขายทั้งหมด' },
    { id: 'customers', name: 'รายงานลูกค้า', icon: '👥', description: 'ข้อมูลลูกค้าและผู้ติดต่อ' },
    { id: 'deals', name: 'รายงานดีล', icon: '💰', description: 'ข้อมูลดีลและ pipeline' },
    { id: 'analytics', name: 'รายงานวิเคราะห์', icon: '📊', description: 'สถิติและการวิเคราะห์ประสิทธิภาพ' }
  ];

  const formatOptions = [
    { id: 'excel', name: 'Excel (.xlsx)', icon: '📗', description: 'เหมาะสำหรับการวิเคราะห์ข้อมูล' },
    { id: 'pdf', name: 'PDF (.pdf)', icon: '📄', description: 'เหมาะสำหรับการพิมพ์และนำเสนอ' },
    { id: 'csv', name: 'CSV (.csv)', icon: '📊', description: 'เหมาะสำหรับการนำเข้าข้อมูล' }
  ];

  const dateRangeOptions = [
    { value: '7', label: '7 วันล่าสุด' },
    { value: '30', label: '30 วันล่าสุด' },
    { value: '90', label: '90 วันล่าสุด' },
    { value: '365', label: '1 ปีล่าสุด' },
    { value: 'all', label: 'ข้อมูลทั้งหมด' }
  ];

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 20;
        });
      }, 200);

      // Fetch data based on export type
      let data;
      let filename;
      
      switch (exportOptions.type) {
        case 'activities':
          const activitiesResult = await ApiService.getActivities();
          data = activitiesResult.success ? activitiesResult.data : [];
          filename = `กิจกรรม_${new Date().toISOString().split('T')[0]}`;
          break;
          
        case 'customers':
          const customersResult = await ApiService.getCustomers();
          data = customersResult.success ? customersResult.data : [];
          filename = `ลูกค้า_${new Date().toISOString().split('T')[0]}`;
          break;
          
        case 'deals':
          const dealsResult = await ApiService.getDeals();
          data = dealsResult.success ? dealsResult.data : [];
          filename = `ดีล_${new Date().toISOString().split('T')[0]}`;
          break;
          
        case 'analytics':
          const analyticsResult = await ApiService.getDashboardAnalytics(12);
          data = analyticsResult.success ? analyticsResult.data : {};
          filename = `วิเคราะห์_${new Date().toISOString().split('T')[0]}`;
          break;
          
        default:
          throw new Error('Invalid export type');
      }

      // Filter data by date range if specified
      if (exportOptions.dateRange !== 'all' && Array.isArray(data)) {
        const daysAgo = parseInt(exportOptions.dateRange);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        
        data = data.filter((item: any) => {
          const itemDate = new Date(item.createdAt || item.updatedAt);
          return itemDate >= cutoffDate;
        });
      }

      clearInterval(progressInterval);
      setExportProgress(100);

      // Generate and download file
      if (exportOptions.format === 'excel') {
        await exportToExcel(data, filename);
      } else if (exportOptions.format === 'pdf') {
        await exportToPDF(data, filename);
      } else if (exportOptions.format === 'csv') {
        await exportToCSV(data, filename);
      }

      success(`ส่งออกรายงาน${reportTypes.find(t => t.id === exportOptions.type)?.name}เรียบร้อย`);
      
    } catch (error) {
      console.error('Export error:', error);
      showError('เกิดข้อผิดพลาดในการส่งออกรายงาน');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const exportToExcel = async (data: any, filename: string) => {
    // Create Excel-like structure
    let csvContent = '';
    
    if (exportOptions.type === 'activities' && Array.isArray(data)) {
      // Headers for activities
      csvContent = 'วันที่,ชื่อกิจกรรม,ลูกค้า,ประเภท,สถานะ,หมวดหมู่,คะแนน,มูลค่าคาดการณ์,คำอธิบาย\n';
      
      data.forEach((activity: any) => {
        csvContent += [
          new Date(activity.createdAt).toLocaleDateString('th-TH'),
          `"${activity.title || ''}"`,
          `"${activity.customerName || ''}"`,
          activity.activityType || '',
          activity.status || '',
          activity.category || '',
          activity.activityScore || 0,
          activity.estimatedValue || 0,
          `"${(activity.description || '').replace(/"/g, '""')}"`
        ].join(',') + '\n';
      });
    } else if (exportOptions.type === 'customers' && Array.isArray(data)) {
      // Headers for customers
      csvContent = 'วันที่สร้าง,ชื่อ,อีเมล,โทรศัพท์,บริษัท,สถานะ,อุตสาหกรรม,มูลค่าทั้งหมด,คะแนนลีด\n';
      
      data.forEach((customer: any) => {
        csvContent += [
          new Date(customer.createdAt).toLocaleDateString('th-TH'),
          `"${customer.name || ''}"`,
          `"${customer.email || ''}"`,
          `"${customer.phone || ''}"`,
          `"${customer.company || ''}"`,
          customer.status || '',
          customer.industry || '',
          customer.totalValue || 0,
          customer.leadScore || 0
        ].join(',') + '\n';
      });
    } else if (exportOptions.type === 'deals' && Array.isArray(data)) {
      // Headers for deals
      csvContent = 'วันที่สร้าง,ชื่อดีล,ลูกค้า,มูลค่า,สถานะ,ความน่าจะเป็น,วันที่คาดว่าจะปิด,ระดับความสำคัญ\n';
      
      data.forEach((deal: any) => {
        csvContent += [
          new Date(deal.createdAt).toLocaleDateString('th-TH'),
          `"${deal.title || ''}"`,
          `"${deal.customerName || ''}"`,
          deal.value || 0,
          deal.status || '',
          deal.probability || 0,
          deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString('th-TH') : '',
          deal.priority || ''
        ].join(',') + '\n';
      });
    }

    // Add BOM for Thai characters
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `${filename}.csv`);
  };

  const exportToPDF = async (data: any, filename: string) => {
    // Create a simple HTML content that can be converted to PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Sarabun', sans-serif; margin: 20px; }
          h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .summary { background-color: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>รายงาน${reportTypes.find(t => t.id === exportOptions.type)?.name}</h1>
        <div class="summary">
          <p><strong>วันที่สร้างรายงาน:</strong> ${new Date().toLocaleDateString('th-TH')}</p>
          <p><strong>ช่วงข้อมูล:</strong> ${dateRangeOptions.find(d => d.value === exportOptions.dateRange)?.label}</p>
          <p><strong>จำนวนรายการ:</strong> ${Array.isArray(data) ? data.length : 'N/A'}</p>
        </div>
    `;

    if (exportOptions.type === 'activities' && Array.isArray(data)) {
      htmlContent += `
        <table>
          <thead>
            <tr>
              <th>วันที่</th>
              <th>กิจกรรม</th>
              <th>ลูกค้า</th>
              <th>ประเภท</th>
              <th>สถานะ</th>
              <th>คะแนน</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      data.forEach((activity: any) => {
        htmlContent += `
          <tr>
            <td>${new Date(activity.createdAt).toLocaleDateString('th-TH')}</td>
            <td>${activity.title || ''}</td>
            <td>${activity.customerName || ''}</td>
            <td>${activity.activityType || ''}</td>
            <td>${activity.status || ''}</td>
            <td>${activity.activityScore || 0}</td>
          </tr>
        `;
      });
      
      htmlContent += '</tbody></table>';
    }

    htmlContent += '</body></html>';

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    downloadFile(blob, `${filename}.html`);
    
    warning('ไฟล์ HTML ถูกดาวน์โหลดแล้ว สามารถเปิดและพิมพ์เป็น PDF ได้จากเบราว์เซอร์');
  };

  const exportToCSV = async (data: any, filename: string) => {
    await exportToExcel(data, filename); // CSV is handled the same way as Excel export
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleOptionChange = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getEstimatedFileSize = () => {
    // Rough estimation based on export type and format
    const baseSize = exportOptions.type === 'analytics' ? 2 : 5; // MB
    const multiplier = exportOptions.format === 'pdf' ? 1.5 : 1;
    return Math.round(baseSize * multiplier * 100) / 100;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">📤 ส่งออกรายงาน</h2>
          <p className="text-gray-600 mt-2">สร้างและดาวน์โหลดรายงานในรูปแบบต่างๆ</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Report Type Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">เลือกประเภทรายงาน</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleOptionChange('type', type.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    exportOptions.type === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">{type.icon}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{type.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">เลือกรูปแบบไฟล์</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formatOptions.map((format) => (
                <button
                  key={format.id}
                  onClick={() => handleOptionChange('format', format.id)}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    exportOptions.format === format.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl block mb-2">{format.icon}</span>
                  <h4 className="font-medium text-gray-900">{format.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">เลือกช่วงเวลา</h3>
            <select
              value={exportOptions.dateRange}
              onChange={(e) => handleOptionChange('dateRange', e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dateRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Options */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ตัวเลือกเพิ่มเติม</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeCharts}
                  onChange={(e) => handleOptionChange('includeCharts', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">รวมกราฟและแผนภูมิ (เฉพาะ PDF)</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeDetails}
                  onChange={(e) => handleOptionChange('includeDetails', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">รวมรายละเอียดทั้งหมด</span>
              </label>
            </div>
          </div>

          {/* Export Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">สรุปการส่งออก</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">ประเภท:</span>
                <span className="ml-2 font-medium">
                  {reportTypes.find(t => t.id === exportOptions.type)?.name}
                </span>
              </div>
              <div>
                <span className="text-gray-600">รูปแบบ:</span>
                <span className="ml-2 font-medium">
                  {formatOptions.find(f => f.id === exportOptions.format)?.name}
                </span>
              </div>
              <div>
                <span className="text-gray-600">ขนาดไฟล์ประมาณ:</span>
                <span className="ml-2 font-medium">{getEstimatedFileSize()} MB</span>
              </div>
            </div>
          </div>

          {/* Export Progress */}
          {isExporting && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-800 font-medium">กำลังสร้างรายงาน...</span>
                <span className="text-blue-600">{Math.round(exportProgress)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={`px-6 py-3 text-white font-medium rounded-lg transition-all ${
                isExporting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
              }`}
            >
              {isExporting ? '⏳ กำลังส่งออก...' : '📤 ส่งออกรายงาน'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportReports;