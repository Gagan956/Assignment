/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from 'react';
import { 
  CheckCircle, 
  AlertTriangle,  
  TrendingUp,
  Calendar,
  Users,
  CheckSquare,
  RefreshCw
} from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { taskApi } from '../api/tasks';
import Card from '../components/ui/Card';
import Loader from '../components/ui/Loader';

interface DashboardStats {
  stats: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    highPriorityTasks: number;
    completionRate: number;
  };
  charts: {
    byStatus: Array<{ _id: string; count: number }>;
    byPriority: Array<{ _id: string; count: number }>;
  };
  recentTasks: any[];
}

const Dashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await taskApi.getDashboardStats();
      setStats(data);
    } catch (error: any) {
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = () => {
    loadDashboardData();
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats?.stats.totalTasks || 0,
      icon: CheckSquare,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      title: 'Completed',
      value: stats?.stats.completedTasks || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      percentage: stats ? Math.round(stats.stats.completionRate) : 0,
    },
    {
      title: 'Overdue',
      value: stats?.stats.overdueTasks || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
    },
    {
      title: 'High Priority',
      value: stats?.stats.highPriorityTasks || 0,
      icon: TrendingUp,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name}!</h1>
            <p className="text-blue-100">
              Here's what's happening with your tasks today.
            </p>
            <div className="mt-4 flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                <span>{user?.role === 'admin' ? 'Administrator' : 'Team Member'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                {stat.percentage !== undefined && (
                  <p className="text-sm text-green-600 mt-1">
                    {stat.percentage}% completion rate
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Tasks by Status">
          <div className="space-y-4">
            {stats?.charts.byStatus && stats.charts.byStatus.length > 0 ? (
              stats.charts.byStatus.map((item) => (
                <div key={item._id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{item._id}</span>
                    <span className="text-gray-600">{item.count} tasks</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item._id === 'Completed'
                          ? 'bg-green-500'
                          : item._id === 'In Progress'
                          ? 'bg-blue-500'
                          : item._id === 'Review'
                          ? 'bg-purple-500'
                          : 'bg-gray-500'
                      }`}
                      style={{
                        width: `${(item.count / (stats?.stats.totalTasks || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No status data available</p>
            )}
          </div>
        </Card>

        <Card title="Tasks by Priority">
          <div className="space-y-4">
            {stats?.charts.byPriority && stats.charts.byPriority.length > 0 ? (
              stats.charts.byPriority.map((item) => (
                <div key={item._id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{item._id}</span>
                    <span className="text-gray-600">{item.count} tasks</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item._id === 'Urgent'
                          ? 'bg-red-500'
                          : item._id === 'High'
                          ? 'bg-orange-500'
                          : item._id === 'Medium'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${(item.count / (stats?.stats.totalTasks || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No priority data available</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;