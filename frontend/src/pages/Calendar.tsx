import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { taskApi } from '../api/tasks';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Task } from '../types';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await taskApi.getTasks({ limit: 100 });
      setTasks(data.tasks);
    } catch (error) {
      console.error('Failed to load tasks for calendar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">View and manage your tasks by due date</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={goToToday} variant="secondary">
            Today
          </Button>
          <Button icon={Plus} iconPosition="left">
            New Task
          </Button>
        </div>
      </div>

      {/* Calendar Controls */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <h2 className="text-xl font-bold text-gray-900">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span>To Do</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>Overdue</span>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Week days header */}
            {weekDays.map(day => (
              <div key={day} className="text-center font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map(day => {
              const dayTasks = getTasksForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);
              
              return (
                <div
                  key={day.toString()}
                  className={`
                    min-h-32 p-2 border rounded-lg transition-colors
                    ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                    ${isCurrentDay ? 'border-blue-500 border-2' : 'border-gray-200'}
                    ${dayTasks.length > 0 ? 'hover:bg-blue-50' : 'hover:bg-gray-50'}
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`
                      text-sm font-medium
                      ${isCurrentDay ? 'text-blue-600' : 
                        isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                    `}>
                      {format(day, 'd')}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map(task => (
                      <div
                        key={task._id}
                        className={`
                          text-xs p-1.5 rounded truncate cursor-pointer hover:opacity-90
                          ${task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            task.isOverdue ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'}
                        `}
                        title={`${task.title} - ${task.priority} Priority`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{task.title}</span>
                          <span className={`text-xs px-1 rounded ${
                            task.priority === 'High' || task.priority === 'Urgent' 
                              ? 'bg-red-200 text-red-800' 
                              : 'bg-green-200 text-green-800'
                          }`}>
                            {task.priority.charAt(0)}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Upcoming Tasks */}
      <Card title="Upcoming Tasks">
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Loading calendar...</p>
            </div>
          ) : tasks.filter(t => !t.isOverdue && t.status !== 'Completed').length > 0 ? (
            tasks
              .filter(t => !t.isOverdue && t.status !== 'Completed')
              .slice(0, 10)
              .map(task => (
                <div key={task._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>Due {format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                      <span className="mx-2">•</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        task.priority === 'High' || task.priority === 'Urgent'
                          ? 'bg-red-100 text-red-800'
                          : task.priority === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                    task.status === 'Review' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status}
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No upcoming tasks</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Calendar;