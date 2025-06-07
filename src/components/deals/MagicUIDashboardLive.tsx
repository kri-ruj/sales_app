import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardFooter } from '../ui/card';
import { cn } from '../../lib/utils';
import { Calendar, LucideIcon, MapIcon, BarChart3, TrendingUp, Activity, Shield, Users, Package } from 'lucide-react';
import { ApiService } from '../../services/apiService';

interface MagicUIProps {
  className?: string;
}

interface MetricCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  className?: string;
  loading?: boolean;
}

interface DashboardData {
  revenue: number;
  customers: number;
  orders: number;
  deals: number;
  activities: number;
  qualityScore: number;
}

const MagicUILive: React.FC<MagicUIProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    revenue: 0,
    customers: 0,
    orders: 0,
    deals: 0,
    activities: 0,
    qualityScore: 97
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch data from multiple endpoints
        const [dealsResult, customersResult, activitiesResult, analyticsResult] = await Promise.all([
          ApiService.getDeals().catch(() => ({ success: false, data: [] })),
          ApiService.getCustomers().catch(() => ({ success: false, data: [] })),
          ApiService.getActivities().catch(() => ({ success: false, data: [] })),
          ApiService.getDashboardAnalytics().catch(() => ({ success: false, data: null }))
        ]);

        // Calculate metrics from real data
        const deals = dealsResult.success ? dealsResult.data : [];
        const customers = customersResult.success ? customersResult.data : [];
        const activities = activitiesResult.success ? activitiesResult.data : [];
        
        // Calculate revenue from won deals
        const revenue = deals
          .filter(deal => deal.status === 'won')
          .reduce((sum, deal) => sum + (deal.value || 0), 0);

        // Count active customers
        const activeCustomers = customers.filter(customer => 
          customer.status === 'active_customer' || customer.status === 'prospect'
        ).length;

        // Count today's activities (orders/meetings)
        const today = new Date().toDateString();
        const todayActivities = activities.filter(activity => 
          new Date(activity.createdAt).toDateString() === today
        ).length;

        setDashboardData({
          revenue,
          customers: activeCustomers,
          orders: todayActivities,
          deals: deals.length,
          activities: activities.length,
          qualityScore: 97 // Static for now, could be calculated from deal success rate
        });

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const metrics = [
    {
      icon: BarChart3,
      title: 'Fresh Sales Revenue',
      value: formatCurrency(dashboardData.revenue),
      change: '+18.7%',
      changeType: 'positive' as const,
      loading
    },
    {
      icon: Users,
      title: 'Active Customers',
      value: dashboardData.customers.toLocaleString('th-TH'),
      change: '+12.4%',
      changeType: 'positive' as const,
      loading
    },
    {
      icon: Package,
      title: 'Orders Today',
      value: dashboardData.orders.toString(),
      change: '+25.3%',
      changeType: 'positive' as const,
      loading
    },
    {
      icon: Shield,
      title: 'Fresh Quality Score',
      value: `${dashboardData.qualityScore}/100`,
      change: '+3.1%',
      changeType: 'positive' as const,
      loading
    },
  ];

  return (
    <section className={cn("bg-background py-16 md:py-24", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            🥕 Fresh Vegetable Sales Dashboard
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Real-time analytics for your fresh produce sales team
          </p>
        </div>

        <div className="mb-10 flex justify-center">
          <div className="inline-flex rounded-md border border-border p-1">
            {['overview', 'analytics', 'quality'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 text-sm font-medium capitalize rounded-md transition-colors",
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MetricCard {...metric} />
            </motion.div>
          ))}
        </div>

        {/* Quick Action Cards */}
        <div className="mt-16">
          <div className="mx-auto grid gap-8 lg:grid-cols-2">
            <Card className="group relative rounded-lg shadow-sm border hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="p-6">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <MapIcon className="size-4" />
                    🚚 Delivery Tracking
                  </span>
                  <p className="mt-8 text-2xl font-semibold">Real-time tracking of fresh vegetable deliveries to ensure quality.</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">🥬 Active Deliveries</span>
                    <span className="text-lg font-bold text-green-900">{Math.floor(dashboardData.orders * 0.3)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-800">🚛 On Route</span>
                    <span className="text-lg font-bold text-blue-900">{Math.floor(dashboardData.orders * 0.6)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-purple-800">✅ Delivered Today</span>
                    <span className="text-lg font-bold text-purple-900">{Math.floor(dashboardData.orders * 0.8)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative rounded-lg shadow-sm border hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="p-6">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="size-4" />
                    🌱 Harvest Scheduling
                  </span>
                  <p className="mt-8 text-2xl font-semibold">Smart scheduling for optimal harvest and delivery timing.</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium text-yellow-800">🌽 Ready to Harvest</span>
                    <span className="text-lg font-bold text-yellow-900">{Math.floor(dashboardData.deals * 0.4)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium text-orange-800">🥕 In Progress</span>
                    <span className="text-lg font-bold text-orange-900">{Math.floor(dashboardData.deals * 0.3)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">🥦 Planning</span>
                    <span className="text-lg font-bold text-green-900">{Math.floor(dashboardData.deals * 0.2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

const MetricCard: React.FC<MetricCardProps> = ({
  icon: Icon,
  title,
  value,
  change,
  changeType,
  className,
  loading = false
}) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="rounded-md bg-primary/10 p-2">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
          </div>
          <span
            className={cn(
              "text-sm font-medium",
              changeType === "positive" ? "text-emerald-600" : "text-red-600"
            )}
          >
            {change}
          </span>
        </div>
        <div className="mt-3">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          ) : (
            <p className="text-2xl font-bold text-foreground">{value}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/50 px-6 py-3">
        <a href="#" className="text-sm font-medium text-primary hover:underline">
          View details →
        </a>
      </CardFooter>
    </Card>
  );
};

export default function MagicUIDashboardLive() {
  return (
    <div className="min-h-screen bg-background">
      <MagicUILive />
    </div>
  );
} 