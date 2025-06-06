import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  ArrowLeft, 
  X, 
  Phone, 
  Mail, 
  Users, 
  Calendar,
  Target,
  TrendingUp,
  Activity,
  BarChart3,
  Home,
  Bell,
  User,
  Play,
  Mic
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  stats: {
    deals: number;
    calls: number;
    activities: number;
  };
  performance: {
    dealsClosedGoal: number;
    dealsClosedCurrent: number;
    leadsGeneratedGoal: number;
    leadsGeneratedCurrent: number;
  };
}

interface ActivityItem {
  id: string;
  type: 'meeting' | 'call' | 'lunch' | 'presentation' | 'follow-up' | 'email';
  title: string;
  time: string;
  isCompleted?: boolean;
}

const SalesDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'team' | 'activity' | 'performance' | 'profile' | 'newlog'>('team');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Ethan Carter',
      role: 'Sales Representative',
      avatar: '/api/placeholder/80/80',
      stats: { deals: 12, calls: 25, activities: 15 },
      performance: {
        dealsClosedGoal: 16,
        dealsClosedCurrent: 12,
        leadsGeneratedGoal: 50,
        leadsGeneratedCurrent: 25
      }
    },
    {
      id: '2',
      name: 'Olivia Bennett',
      role: 'Sales Representative',
      avatar: '/api/placeholder/80/80',
      stats: { deals: 8, calls: 18, activities: 12 },
      performance: {
        dealsClosedGoal: 12,
        dealsClosedCurrent: 8,
        leadsGeneratedGoal: 40,
        leadsGeneratedCurrent: 20
      }
    }
  ];

  const activities: ActivityItem[] = [
    { id: '1', type: 'meeting', title: 'Meeting with Sarah', time: '10:00 AM' },
    { id: '2', type: 'call', title: 'Call with David', time: '11:30 AM' },
    { id: '3', type: 'lunch', title: 'Lunch with Team', time: '1:00 PM' },
    { id: '4', type: 'presentation', title: 'Presentation to Client', time: '2:30 PM' },
    { id: '5', type: 'follow-up', title: 'Follow-up with Prospects', time: '4:00 PM' }
  ];

  const recentActivities = [
    { id: '1', type: 'call', title: 'Call with Sarah', time: '10:00 AM', date: 'Today' },
    { id: '2', type: 'meeting', title: 'Meeting with David', time: '11:00 AM', date: 'Today' },
    { id: '3', type: 'lunch', title: 'Lunch with Team', time: '12:00 PM', date: 'Yesterday' },
    { id: '4', type: 'follow-up', title: 'Follow up with Mark', time: '1:00 PM', date: 'Yesterday' }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Users className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'lunch': return <Calendar className="w-4 h-4" />;
      case 'presentation': return <BarChart3 className="w-4 h-4" />;
      case 'follow-up': return <TrendingUp className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const TeamPerformanceView = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 w-80">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => setActiveView('team')}
          className="mr-3 p-1 hover:bg-gray-100 rounded"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold">Team Performance</h2>
      </div>
      
      <div className="flex space-x-4 mb-6">
        <button className="px-4 py-2 text-blue-600 border-b-2 border-blue-600 font-medium">
          Overview
        </button>
        <button className="px-4 py-2 text-gray-500 font-medium">
          Members
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search members..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-4 mb-6">
        {teamMembers.map((member) => (
          <div 
            key={member.id}
            onClick={() => {
              setSelectedMember(member);
              setActiveView('profile');
            }}
            className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
          >
            <img
              src={member.avatar}
              alt={member.name}
              className="w-10 h-10 rounded-full mr-3"
            />
            <div className="flex-1">
              <h3 className="font-medium">{member.name}</h3>
              <p className="text-sm text-gray-500">{member.role}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold">12</div>
          <div className="text-sm text-gray-500">Deals Closed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">$120K</div>
          <div className="text-sm text-gray-500">Revenue</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">24</div>
          <div className="text-sm text-gray-500">Activities</div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-3">Recent Activities</h3>
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
              <span className="text-xs text-gray-400">{activity.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex space-x-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Home className="w-5 h-5 text-blue-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Users className="w-5 h-5 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Plus className="w-5 h-5 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <User className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );

  const ProfileView = () => {
    if (!selectedMember) return null;
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 w-80">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setActiveView('performance')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold">Profile</h2>
          <button 
            onClick={() => setActiveView('team')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="relative inline-block">
            <img
              src={selectedMember.avatar}
              alt={selectedMember.name}
              className="w-20 h-20 rounded-full mx-auto mb-3"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </div>
          <h3 className="text-xl font-bold">{selectedMember.name}</h3>
          <p className="text-gray-500">{selectedMember.role}</p>
          <p className="text-sm text-gray-400">Joined 2021</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{selectedMember.stats.deals}</div>
            <div className="text-sm text-gray-500">Deals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{selectedMember.stats.calls}</div>
            <div className="text-sm text-gray-500">Calls</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{selectedMember.stats.activities}</div>
            <div className="text-sm text-gray-500">Activities</div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-medium mb-4">Goals</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Deals Closed</span>
                <span className="text-blue-600">75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(selectedMember.performance.dealsClosedCurrent / selectedMember.performance.dealsClosedGoal) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {selectedMember.performance.dealsClosedCurrent}/{selectedMember.performance.dealsClosedGoal}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Leads Generated</span>
                <span className="text-blue-600">50%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(selectedMember.performance.leadsGeneratedCurrent / selectedMember.performance.leadsGeneratedGoal) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {selectedMember.performance.leadsGeneratedCurrent}/{selectedMember.performance.leadsGeneratedGoal}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-medium mb-3">Recent Activities</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <Phone className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Call with Alex</p>
                <p className="text-xs text-gray-500">Meeting with potential client</p>
              </div>
              <span className="text-xs text-gray-400">1h ago</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Email to Sarah</p>
                <p className="text-xs text-gray-500">Follow up on proposal</p>
              </div>
              <span className="text-xs text-gray-400">2h ago</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Meeting with David</p>
                <p className="text-xs text-gray-500">Demo of product features</p>
              </div>
              <span className="text-xs text-gray-400">1d ago</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Home className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const NewLogView = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 w-80">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">New Log</h2>
        <button 
          onClick={() => setActiveView('team')}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            placeholder="e.g., Follow-up with Acme Corp"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            rows={4}
            placeholder="Add a brief summary of your call or meeting."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          />
        </div>

        <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors">
          <Mic className="w-5 h-5" />
          <span>Start Recording</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="flex space-x-6 max-w-7xl mx-auto">
        {/* Sales Team Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 w-80">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Sales Team</h2>
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Team Performance</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Total Sales</span>
                  <span className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    10%
                  </span>
                </div>
                <div className="text-2xl font-bold">$1.2M</div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Average Deal Size</span>
                  <span className="text-xs text-red-600 flex items-center">
                    2%
                  </span>
                </div>
                <div className="text-2xl font-bold">$15K</div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                  <span className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    12%
                  </span>
                </div>
                <div className="text-2xl font-bold">25%</div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Individual Stats</h3>
              <button className="text-blue-600 text-sm">View All</button>
            </div>
            
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div 
                  key={member.id}
                  onClick={() => {
                    setSelectedMember(member);
                    setActiveView('performance');
                  }}
                  className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{member.name}</h4>
                    <p className="text-sm text-gray-500">{member.role}</p>
                  </div>
                  <div className="text-right">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setActiveView('newlog')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium mb-4 hover:bg-blue-700 transition-colors"
          >
            Log Activity
          </button>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Activity</h3>
              <button className="text-blue-600 text-sm">View All</button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <img
                  src="/api/placeholder/32/32"
                  alt="Ethan Carter"
                  className="w-8 h-8 rounded-full mr-3"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Ethan Carter</p>
                  <p className="text-xs text-gray-500">Met with potential client · 2h ago</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <img
                  src="/api/placeholder/32/32"
                  alt="Olivia Bennett"
                  className="w-8 h-8 rounded-full mr-3"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Olivia Bennett</p>
                  <p className="text-xs text-gray-500">Closed a deal · 3h ago</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <img
                  src="/api/placeholder/32/32"
                  alt="Noah Thompson"
                  className="w-8 h-8 rounded-full mr-3"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Noah Thompson</p>
                  <p className="text-xs text-gray-500">Followed up with lead · Yesterday</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 w-80">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Activity</h2>
            <Plus className="w-5 h-5 text-gray-400 cursor-pointer" />
          </div>
          
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{activity.title}</h3>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
                <div className="text-gray-400">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium mt-6 flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors">
            <Mic className="w-5 h-5" />
            <span>Record Activity</span>
          </button>
        </div>

        {/* Dynamic Panel */}
        {activeView === 'performance' && <TeamPerformanceView />}
        {activeView === 'profile' && <ProfileView />}
        {activeView === 'newlog' && <NewLogView />}
      </div>
    </div>
  );
};

export default SalesDashboard; 