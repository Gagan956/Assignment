import React, { useEffect, useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  Calendar,
  Flag,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { taskApi } from '../../api/tasks';

interface SidebarProps {
  isOpen: boolean;
}

interface QuickStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  todayTasks: number;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { user } = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState<QuickStats>({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    todayTasks: 0
  });
  const [loading, setLoading] = useState(false);

  const loadQuickStats = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const tasksResponse = await taskApi.getTasks({ limit: 100 });
      const tasks = tasksResponse.tasks || [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.status === 'Completed').length;
      const overdueTasks = tasks.filter(task => 
        new Date(task.dueDate) < new Date() && task.status !== 'Completed'
      ).length;
      const todayTasks = tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate < tomorrow && task.status !== 'Completed';
      }).length;

      setStats({
        totalTasks,
        completedTasks,
        overdueTasks,
        todayTasks
      });
    } catch (error) {
      console.error('Failed to load quick stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadQuickStats();
    }
  }, [user, loadQuickStats]);

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/priorities', icon: Flag, label: 'Priorities' },
    ...(user?.role === 'admin' ? [
      { to: '/users', icon: Users, label: 'Users' },
    ] : []),
  ];

  const getStatsForUser = () => {
 
    return stats;
  };

  const currentStats = getStatsForUser();

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 lg:hidden"
          onClick={() => {}}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 
        transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Sidebar header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Task Manager</h2>
                <p className="text-sm text-gray-500">{user?.role === 'admin' ? 'Admin' : 'User'} Panel</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-500' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  end
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </div>

            {/* Stats section */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Quick Stats</h3>
                {loading ? (
                  <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                ) : (
                  <button 
                    onClick={loadQuickStats}
                    className="text-xs text-blue-600 hover:text-blue-800"
                    title="Refresh stats"
                  >
                    Refresh
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {/* Total Tasks */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Total Tasks</span>
                  </div>
                  <span className="font-semibold">{currentStats.totalTasks}</span>
                </div>

                {/* Completed Tasks */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Completed</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    {currentStats.completedTasks}
                    {currentStats.totalTasks > 0 && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({Math.round((currentStats.completedTasks / currentStats.totalTasks) * 100)}%)
                      </span>
                    )}
                  </span>
                </div>

                {/* Overdue Tasks */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Overdue</span>
                  </div>
                  <span className="font-semibold text-red-600">
                    {currentStats.overdueTasks}
                    {currentStats.totalTasks > 0 && currentStats.overdueTasks > 0 && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({(currentStats.overdueTasks / currentStats.totalTasks * 100).toFixed(1)}%)
                      </span>
                    )}
                  </span>
                </div>

                {/* Today's Tasks */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Due Today</span>
                  </div>
                  <span className="font-semibold text-yellow-600">{currentStats.todayTasks}</span>
                </div>

                {/* Progress bar for completion rate */}
                {currentStats.totalTasks > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{Math.round((currentStats.completedTasks / currentStats.totalTasks) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(currentStats.completedTasks / currentStats.totalTasks) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <NavLink
                  to="/tasks?status=todo"
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-100 rounded"
                >
                  <CheckSquare className="h-4 w-4" />
                  <span>View To-Do Tasks</span>
                </NavLink>
                <NavLink
                  to="/tasks?status=overdue"
                  className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Check Overdue</span>
                </NavLink>
                <NavLink
                  to="/calendar"
                  className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-800 p-2 hover:bg-purple-50 rounded"
                >
                  <Calendar className="h-4 w-4" />
                  <span>View Calendar</span>
                </NavLink>
              </div>
            </div>
          </nav>

          {/* User info at bottom */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-semibold text-blue-600">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                {currentStats.overdueTasks > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white">{currentStats.overdueTasks}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <div className="flex items-center mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    user?.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user?.role === 'admin' ? 'Administrator' : 'User'}
                  </span>
                  {currentStats.todayTasks > 0 && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {currentStats.todayTasks} today
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;