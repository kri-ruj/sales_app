import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardFooter } from '../ui/card';
import { cn } from '../../lib/utils';
import { Calendar, LucideIcon, MapIcon, BarChart3, TrendingUp, AlertTriangle, Shield, Activity } from 'lucide-react';

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
}

interface FeatureCardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeadingProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface DualModeImageProps {
  darkSrc: string;
  lightSrc: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

const MagicUI: React.FC<MagicUIProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  const metrics = [
    {
      icon: BarChart3,
      title: 'Fresh Sales Revenue',
      value: '฿145,500',
      change: '+18.7%',
      changeType: 'positive' as const,
    },
    {
      icon: Activity,
      title: 'Active Customers',
      value: '2,847',
      change: '+12.4%',
      changeType: 'positive' as const,
    },
    {
      icon: TrendingUp,
      title: 'Orders Today',
      value: '89',
      change: '+25.3%',
      changeType: 'positive' as const,
    },
    {
      icon: Shield,
      title: 'Fresh Quality Score',
      value: '97/100',
      change: '+3.1%',
      changeType: 'positive' as const,
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

        <div className="mt-16">
          <div className="mx-auto grid gap-8 lg:grid-cols-2">
            <FeatureCard>
              <CardHeader className="pb-3">
                <CardHeading
                  icon={MapIcon}
                  title="🚚 Delivery Tracking"
                  description="Real-time tracking of fresh vegetable deliveries to ensure quality."
                />
              </CardHeader>

              <div className="relative mb-6 border-t border-dashed sm:mb-0">
                <div className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_0%,transparent_40%,hsl(var(--muted)),white_125%)]"></div>
                <div className="aspect-[76/59] p-1 px-6">
                  <DualModeImage
                    darkSrc="https://tailark.com/_next/image?url=%2Fpayments.png&w=3840&q=75"
                    lightSrc="https://tailark.com/_next/image?url=%2Fpayments-light.png&w=3840&q=75"
                    alt="tracking illustration"
                    width={1207}
                    height={929}
                  />
                </div>
              </div>
            </FeatureCard>

            <FeatureCard>
              <CardHeader className="pb-3">
                <CardHeading
                  icon={Calendar}
                  title="🌱 Harvest Scheduling"
                  description="Smart scheduling for optimal harvest and delivery timing."
                />
              </CardHeader>

              <CardContent>
                <div className="relative mb-6 sm:mb-0">
                  <div className="absolute -inset-6 [background:radial-gradient(50%_50%_at_75%_50%,transparent,hsl(var(--background))_100%)]"></div>
                  <div className="aspect-[76/59] border">
                    <DualModeImage
                      darkSrc="https://tailark.com/_next/image?url=%2Forigin-cal-dark.png&w=3840&q=75"
                      lightSrc="https://tailark.com/_next/image?url=%2Forigin-cal.png&w=3840&q=75"
                      alt="calendar illustration"
                      width={1207}
                      height={929}
                    />
                  </div>
                </div>
              </CardContent>
            </FeatureCard>
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
          <p className="text-2xl font-bold text-foreground">{value}</p>
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

const FeatureCard = ({ children, className }: FeatureCardProps) => (
  <Card className={cn('group relative rounded-none shadow-zinc-950/5', className)}>
    <CardDecorator />
    {children}
  </Card>
);

const CardDecorator = () => (
  <>
    <span className="border-primary absolute -left-px -top-px block size-2 border-l-2 border-t-2"></span>
    <span className="border-primary absolute -right-px -top-px block size-2 border-r-2 border-t-2"></span>
    <span className="border-primary absolute -bottom-px -left-px block size-2 border-b-2 border-l-2"></span>
    <span className="border-primary absolute -bottom-px -right-px block size-2 border-b-2 border-r-2"></span>
  </>
);

const CardHeading = ({ icon: Icon, title, description }: CardHeadingProps) => (
  <div className="p-6">
    <span className="text-muted-foreground flex items-center gap-2">
      <Icon className="size-4" />
      {title}
    </span>
    <p className="mt-8 text-2xl font-semibold">{description}</p>
  </div>
);

const DualModeImage = ({ darkSrc, lightSrc, alt, width, height, className }: DualModeImageProps) => (
  <>
    <img
      src={darkSrc}
      className={cn('hidden dark:block', className)}
      alt={`${alt} dark`}
      width={width}
      height={height}
    />
    <img
      src={lightSrc}
      className={cn('shadow dark:hidden', className)}
      alt={`${alt} light`}
      width={width}
      height={height}
    />
  </>
);

// Usage example
export default function MagicUIDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <MagicUI />
    </div>
  );
} 