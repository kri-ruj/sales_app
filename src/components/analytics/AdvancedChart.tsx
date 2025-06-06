import React from 'react';

interface MonthlyData {
  month: string;
  activityCount: number;
  averageScore: number;
  totalScore: number;
  estimatedValue: number;
  completedActivities: number;
}

interface AdvancedChartProps {
  data: MonthlyData[];
  metric: 'activities' | 'score' | 'value';
  formatCurrency: (value: number) => string;
  formatNumber: (value: number) => string;
}

const AdvancedChart: React.FC<AdvancedChartProps> = ({ 
  data, 
  metric,
  formatCurrency,
  formatNumber
}) => {
  const getValueForMetric = (point: MonthlyData) => {
    switch (metric) {
      case 'activities':
        return point.activityCount;
      case 'score':
        return point.averageScore;
      case 'value':
        return point.estimatedValue;
      default:
        return point.activityCount;
    }
  };

  const getFormattedValue = (value: number) => {
    switch (metric) {
      case 'activities':
        return formatNumber(value);
      case 'score':
        return value.toString();
      case 'value':
        return formatCurrency(value);
      default:
        return value.toString();
    }
  };

  const getMetricLabel = () => {
    switch (metric) {
      case 'activities':
        return 'กิจกรรม';
      case 'score':
        return 'คะแนน';
      case 'value':
        return 'มูลค่า';
      default:
        return 'กิจกรรม';
    }
  };

  const getMetricColor = () => {
    switch (metric) {
      case 'activities':
        return 'from-primary-400 to-primary-600';
      case 'score':
        return 'from-green-400 to-green-600';
      case 'value':
        return 'from-purple-400 to-purple-600';
      default:
        return 'from-primary-400 to-primary-600';
    }
  };

  const maxValue = Math.max(...data.map(d => getValueForMetric(d)));
  const chartMax = maxValue * 1.1; // Add 10% padding

  const formatValue = (value: number) => {
    if (metric === 'value') {
      return `฿${(value / 1000).toFixed(0)}k`;
    }
    return Math.round(value).toString();
  };

  return (
    <div className="relative" style={{ height: '300px' }}>
      {/* Chart Grid Lines */}
      <div className="absolute inset-0 flex flex-col justify-between">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border-t border-gray-100 w-full">
            <span className="text-xs text-gray-400 ml-2">
              {formatValue((chartMax * (5 - i)) / 5)}
            </span>
          </div>
        ))}
      </div>

      {/* Chart Bars */}
      <div className="relative h-full flex items-end justify-between px-4">
        {data.map((point, index) => {
          const value = getValueForMetric(point);
          const barHeight = (value / chartMax) * (300 - 40);

          return (
            <div key={point.month} className="flex flex-col items-center group relative">
              {/* Value Bar */}
              <div 
                className={`w-8 rounded-t-lg bg-gradient-to-t ${getMetricColor()} transition-all duration-300 hover:scale-105 shadow-sm`}
                style={{ height: `${barHeight}px` }}
              />

              {/* Month Label */}
              <span className="text-xs text-gray-600 mt-2 font-medium">
                {point.month}
              </span>

              {/* Hover Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                <div className="text-center">
                  <div className="font-medium">{point.month}</div>
                  <div>{getMetricLabel()}: {getFormattedValue(value)}</div>
                  {metric === 'activities' && (
                    <div className="text-gray-300">เสร็จแล้ว: {point.completedActivities}</div>
                  )}
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p>ไม่มีข้อมูลในช่วงเวลานี้</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedChart;