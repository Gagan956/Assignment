import React, { useState, useEffect, useCallback } from 'react';
import { Flag, AlertTriangle, CheckCircle, Clock, TrendingUp, Filter } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { taskApi } from '../api/tasks';
import Card from '../components/ui/Card';
import { Task, Priority } from '../types';

const Priorities: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Priority | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAppSelector((state) => state.auth);

  const loadTasks = useCallback(async () => {
    try {
      const data = await taskApi.getTasks({ limit: 100 });
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.priority === filter);

  const priorityStats = {
    Urgent: tasks.filter(t => t.priority === 'Urgent').length,
    High: tasks.filter(t => t.priority === 'High').length,
    Medium: tasks.filter(t => t.priority === 'Medium').length,
    Low: tasks.filter(t => t.priority === 'Low').length,
  };

  const priorityConfig: Record<Priority, {
    color: string;
    bgColor: string;
    icon: React.ReactNode;
    description: string;
  }> = {
    Urgent: {
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: <AlertTriangle className="h-5 w-5" />,
      description: 'Critical issues requiring immediate attention'
    },
    High: {
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      icon: <TrendingUp className="h-5 w-5" />,
      description: 'Important tasks with tight deadlines'
    },
    Medium: {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      icon: <Flag className="h-5 w-5" />,
      description: 'Standard priority tasks'
    },
    Low: {
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: <CheckCircle className="h-5 w-5" />,
      description: 'Low priority, can be deferred'
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Priority Management</h1>
        <p className="text-gray-600">Focus on what matters most</p>
      </div>

      {/* Priority Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(['Urgent', 'High', 'Medium', 'Low'] as Priority[]).map((priority) => (
          <Card key={priority} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-full ${priorityConfig[priority].bgColor}`}>
                <div className={priorityConfig[priority].color}>
                  {priorityConfig[priority].icon}
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {priorityStats[priority]}
              </span>
            </div>
            <h3 className={`font-semibold ${priorityConfig[priority].color}`}>
              {priority} Priority
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {priorityConfig[priority].description}
            </p>
          </Card>
        ))}
      </div>

      {/* Filter Tabs */}
      <Card>
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                filter === 'all' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>All Tasks</span>
              <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs">
                {tasks.length}
              </span>
            </button>
            
            {(['Urgent', 'High', 'Medium', 'Low'] as Priority[]).map((priority) => (
              <button
                key={priority}
                onClick={() => setFilter(priority)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  filter === priority 
                    ? `${priorityConfig[priority].bgColor} ${priorityConfig[priority].color}` 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {priorityConfig[priority].icon}
                <span>{priority}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  filter === priority 
                    ? 'bg-white bg-opacity-50' 
                    : 'bg-gray-200 text-gray-800'
                }`}>
                  {priorityStats[priority]}
                </span>
              </button>
            ))}
          </div>

          {/* Tasks List */}
          {isLoading ? (
            <div className="text-center py-12">
              <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Loading tasks...</p>
            </div>
          ) : filteredTasks.length > 0 ? (
            <div className="space-y-4">
              {filteredTasks.map(task => (
                <div 
                  key={task._id} 
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${priorityConfig[task.priority].bgColor}`}>
                        <div className={priorityConfig[task.priority].color}>
                          {priorityConfig[task.priority].icon}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                          <span className="mx-2">•</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'Review' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {task.assignedToId.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {task.assignedToId._id === user?._id ? 'Assigned to you' : 'Assigned'}
                      </div>
                    </div>
                    {task.isOverdue && (
                      <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                        Overdue
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {filter === 'all' ? '' : filter + ' priority'} tasks found
              </h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'Create your first task to get started' 
                  : `No ${filter.toLowerCase()} priority tasks at the moment`
                }
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Priority Guidelines */}
      <Card title="Priority Guidelines">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Urgent Priority</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5 shrink-0" />
                  Critical issues affecting core functionality
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5 shrink-0" />
                  Security vulnerabilities
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5 shrink-0" />
                  Deadlines within 24 hours
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">High Priority</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <TrendingUp className="h-4 w-4 text-orange-500 mr-2 mt-0.5 shrink-0" />
                  Important features for upcoming releases
                </li>
                <li className="flex items-start">
                  <TrendingUp className="h-4 w-4 text-orange-500 mr-2 mt-0.5 shrink-0" />
                  Client requests with short deadlines
                </li>
                <li className="flex items-start">
                  <TrendingUp className="h-4 w-4 text-orange-500 mr-2 mt-0.5 shrink-0" />
                  Blockers for other team members
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Priorities;