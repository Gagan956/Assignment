/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, List, User, Calendar, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { taskApi } from '../api/tasks';
import { setFilters, clearFilters } from '../store/slices/taskSlice';
import Button from '../components/ui/Button';
import TaskList from '../components/tasks/TaskList';
import Modal from '../components/ui/Modal';
import TaskForm from '../components/tasks/TaskForm';

const Tasks: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'all' | 'assigned' | 'created' | 'overdue'>('all');
  
  const dispatch = useAppDispatch();
  const { filters } = useAppSelector((state) => state.tasks);

  const applyViewFilters = useCallback(() => {
    switch (activeView) {
      case 'assigned':
        dispatch(setFilters({ assigned: true, created: false }));
        break;
      case 'created':
        dispatch(setFilters({ assigned: false, created: true }));
        break;
      case 'overdue':
        dispatch(setFilters({ 
          assigned: false, 
          created: false,
          status: undefined 
        }));
        break;
      default:
        dispatch(setFilters({ assigned: false, created: false }));
    }
  }, [activeView, dispatch]);

  useEffect(() => {
    applyViewFilters();
  }, [applyViewFilters]);

  const handleCreateTask = async (data: any) => {
    setIsSubmitting(true);
    try {
      await taskApi.createTask(data);
      toast.success('Task created successfully!');
      setIsCreateModalOpen(false);
  
    } catch (error: any) {
      console.error('Create task error:', error);
      toast.error(error.response?.data?.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const clearAllFilters = () => {
    dispatch(clearFilters());
    setActiveView('all');
    setSearchQuery('');
  };

  const viewOptions = [
    { id: 'all', label: 'All Tasks', icon: List, color: 'bg-gray-100 text-gray-700' },
    { id: 'assigned', label: 'Assigned to Me', icon: User, color: 'bg-blue-100 text-blue-700' },
    { id: 'created', label: 'Created by Me', icon: Calendar, color: 'bg-green-100 text-green-700' },
    { id: 'overdue', label: 'Overdue', icon: Flag, color: 'bg-red-100 text-red-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600">Create, assign, and track tasks</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          icon={Plus}
          iconPosition="left"
          className="whitespace-nowrap"
        >
          New Task
        </Button>
      </div>

      {/* View Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* View options */}
          <div className="flex flex-wrap gap-2">
            {viewOptions.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as any)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg transition-all
                  ${activeView === view.id 
                    ? `${view.color} ring-2 ring-opacity-50 ring-current` 
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <view.icon className="h-4 w-4" />
                <span className="font-medium">{view.label}</span>
              </button>
            ))}
            
            {(filters.status || filters.priority || searchQuery) && (
              <button
                onClick={clearAllFilters}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Filter className="h-4 w-4" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Active filters indicator */}
        {(filters.status || filters.priority) && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.status && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Status: {filters.status}
                </span>
              )}
              {filters.priority && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  Priority: {filters.priority}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task list */}
      <TaskList />

      {/* Create task modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Task"
        size="lg"
      >
        <TaskForm
          onSubmit={handleCreateTask}
          isSubmitting={isSubmitting}
          submitLabel="Create Task"
        />
      </Modal>
    </div>
  );
};

export default Tasks;