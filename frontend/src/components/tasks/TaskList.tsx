/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useCallback } from 'react';
import { CheckSquare, AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { taskApi } from '../../api/tasks';
import { setTasks, setLoading, setError, setPagination } from '../../store/slices/taskSlice';
import TaskCard from './TaskCard';
import TaskFilters from './TaskFilters';
import Loader from '../ui/Loader';
import Button from '../ui/Button';

const TaskList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, isLoading, error, filters, pagination } = useAppSelector((state) => state.tasks);

  const loadTasks = useCallback(async () => {
    dispatch(setLoading(true));
    try {

      const filtersForApi: any = {
        ...filters,
        assigned: filters.assigned ? 'true' : undefined,
        created: filters.created ? 'true' : undefined,
      };

      // Remove undefined values
      Object.keys(filtersForApi).forEach(key => {
        if (filtersForApi[key] === undefined || filtersForApi[key] === '') {
          delete filtersForApi[key];
        }
      });

      // Make API call
      const data = await taskApi.getTasks({
        ...filtersForApi,
        page: pagination.page,
        limit: pagination.limit,
      });
      
      const tasksData = Array.isArray(data.tasks) ? data.tasks : [];
      const total = data.total || 0;
      const hasMore = data.hasMore || (tasksData.length >= pagination.limit);
      
      dispatch(setTasks({ 
        tasks: tasksData, 
        total, 
        hasMore 
      }));
    } catch (error: any) {
      console.error('Failed to load tasks:', error);
      dispatch(setError(error.response?.data?.message || 'Failed to load tasks'));
      dispatch(setTasks({ tasks: [], total: 0, hasMore: false }));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, filters, pagination.page, pagination.limit]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handlePageChange = (page: number) => {
    dispatch(setPagination({ page }));
  };

  const handleStatusChange = () => {
    // Refresh tasks when status changes
    loadTasks();
  };

  const handleTaskDelete = () => {
    // Refresh tasks when task is deleted
    loadTasks();
  };

  const handleRetry = () => {
    loadTasks();
  };

  if (isLoading && tasks.length === 0) {
    return <Loader />;
  }

  if (error && tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <AlertCircle className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Tasks</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={handleRetry} variant="primary">
          Retry
        </Button>
      </div>
    );
  }

  const completedTasks = Array.isArray(tasks) ? tasks.filter(t => t.status === 'Completed').length : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">
            {pagination.total} tasks • {completedTasks} completed
          </p>
        </div>
        <TaskFilters />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(tasks) && tasks.map((task) => (
          <TaskCard 
            key={task._id} 
            task={task}
            onStatusChange={handleStatusChange}
            onDelete={handleTaskDelete}
          />
        ))}
      </div>

      {tasks.length === 0 && !isLoading && !error && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <CheckSquare className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600">Try adjusting your filters or create a new task.</p>
        </div>
      )}

      {pagination.total > pagination.limit && (
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          <span className="text-gray-600">
            Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskList;