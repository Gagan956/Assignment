/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from 'react';
import { 
  Users, 
  CheckSquare, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  UserPlus,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { taskApi } from '../api/tasks';
import { userApi } from '../api/users';
import { notificationApi } from '../api/notifications';
import Loader from '../components/ui/Loader';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { format } from 'date-fns';

interface AdminStats {
  totalUsers: number;
  totalTasks: number;
  activeTasks: number;
  overdueTasks: number;
  completionRate: number;
}

interface RecentActivity {
  id: string;
  type: 'task_created' | 'task_completed' | 'task_assigned' | 'user_registered' | 'task_updated';
  user: string;
  action: string;
  details?: string;
  timestamp: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAppSelector((state) => state.auth);

  const loadAdminData = useCallback(async () => {
    try {
      const [tasksData, usersData, notificationsData] = await Promise.all([
        taskApi.getTasks({ limit: 100 }),
        userApi.getAllUsers(),
        notificationApi.getNotifications(false, 20)
      ]);

      const tasks = tasksData.tasks || [];
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'Completed').length;
      const overdueTasks = tasks.filter(t => 
        new Date(t.dueDate) < new Date() && t.status !== 'Completed'
      ).length;

      const activities = processRecentActivities(notificationsData.data?.notifications || [], tasks, usersData);
      
      setStats({
        totalUsers: usersData.length,
        totalTasks,
        activeTasks: totalTasks - completedTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      });

      setRecentActivities(activities.slice(0, 10)); 
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user, loadAdminData]);

  const processRecentActivities = (
    notifications: any[], 
    tasks: any[], 
    users: any[]
  ): RecentActivity[] => {
    const activities: RecentActivity[] = [];

    // Process notifications
    notifications.forEach(notification => {
      const userObj = users.find(u => u._id === notification.userId);
      const taskObj = tasks.find(t => t._id === notification.taskId);
      
      let action = '';
      let details = '';
      
      switch(notification.type) {
        case 'task_assigned':
          action = 'assigned a task';
          details = taskObj ? `"${taskObj.title}"` : 'a task';
          break;
        case 'task_completed':
          action = 'completed a task';
          details = taskObj ? `"${taskObj.title}"` : 'a task';
          break;
        case 'task_updated':
          action = 'updated a task';
          details = taskObj ? `"${taskObj.title}"` : 'a task';
          break;
        case 'task_status_changed':
          action = 'changed task status';
          details = taskObj ? `"${taskObj.title}"` : 'a task';
          break;
        default:
          action = 'performed an action';
      }

      activities.push({
        id: notification._id,
        type: notification.type as any,
        user: userObj?.name || 'Unknown User',
        action,
        details,
        timestamp: notification.createdAt
      });
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    users
      .filter(u => new Date(u.createdAt) > weekAgo)
      .forEach(user => {
        activities.push({
          id: user._id,
          type: 'user_registered',
          user: user.name,
          action: 'joined the platform',
          details: user.role === 'admin' ? 'as Administrator' : 'as User',
          timestamp: user.createdAt
        });
      });

    // Sort by timestamp (newest first)
    return activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch(type) {
      case 'task_created':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'task_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'task_assigned':
        return <UserPlus className="h-4 w-4 text-purple-500" />;
      case 'user_registered':
        return <Users className="h-4 w-4 text-orange-500" />;
      case 'task_updated':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return format(past, 'MMM d, yyyy');
  };

  if (isLoading) {
    return <Loader />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You need administrator privileges to view this page.</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      trend: 'up',
    },
    {
      title: 'Total Tasks',
      value: stats?.totalTasks || 0,
      icon: CheckSquare,
      color: 'bg-green-500',
      change: '+8%',
      trend: 'up',
    },
    {
      title: 'Active Tasks',
      value: stats?.activeTasks || 0,
      icon: TrendingUp,
      color: 'bg-orange-500',
      change: '-3%',
      trend: 'down',
    },
    {
      title: 'Overdue Tasks',
      value: stats?.overdueTasks || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: '+5%',
      trend: 'up',
    },
  ];

  const refreshData = () => {
    setIsLoading(true);
    loadAdminData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">System overview and management</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={refreshData}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              <span className={`text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
          </Card>
        ))}
      </div>

      {/* Charts and management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task completion */}
        <Card title="Task Completion Rate">
          <div className="h-64 flex items-center justify-center">
            <div className="relative">
              <div className="w-48 h-48 rounded-full border-8 border-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900">
                    {stats ? Math.round(stats.completionRate) : 0}%
                  </p>
                  <p className="text-gray-600 mt-2">Completion Rate</p>
                </div>
              </div>
              <div 
                className="absolute top-0 left-0 w-48 h-48 rounded-full border-8 border-green-500 border-r-transparent border-b-transparent transform -rotate-45"
                style={{
                  clipPath: `inset(0 ${100 - (stats?.completionRate || 0)}% 0 0)`,
                }}
              />
            </div>
          </div>
        </Card>

        {/* Recent activity */}
        <Card 
          title="Recent Activity" 
          actions={
            <button 
              onClick={refreshData}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          }
        >
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{activity.user}</p>
                      <span className="text-sm text-gray-600">{activity.action}</span>
                    </div>
                    {activity.details && (
                      <p className="text-sm text-gray-500 mt-1">{activity.details}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {getTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* System management */}
      <Card title="System Management">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button 
            onClick={() => window.location.href = '/users'}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
          >
            <Users className="h-6 w-6 text-green-600 mb-2" />
            <p className="font-medium text-gray-900">User Management</p>
            <p className="text-sm text-gray-600 mt-1">Manage users and permissions</p>
          </button>
          <button 
            onClick={() => window.location.href = '/tasks'}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
          >
            <CheckSquare className="h-6 w-6 text-purple-600 mb-2" />
            <p className="font-medium text-gray-900">Task Reports</p>
            <p className="text-sm text-gray-600 mt-1">Generate task reports</p>
          </button>
          <button 
            onClick={() => window.location.href = '/tasks?status=overdue'}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
          >
            <AlertTriangle className="h-6 w-6 text-red-600 mb-2" />
            <p className="font-medium text-gray-900">Overdue Tasks</p>
            <p className="text-sm text-gray-600 mt-1">View and manage overdue tasks</p>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;