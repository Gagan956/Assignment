/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setFilters } from '../../store/slices/taskSlice';
import { Status, Priority } from '../../types';

const TaskFilters: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { filters } = useAppSelector((state) => state.tasks);
  
  const [showFilters, setShowFilters] = useState(false);
  const isAdmin = user?.role === 'admin';

  const statusOptions = ['All', 'To Do', 'In Progress', 'Review', 'Completed'];
  const priorityOptions = ['All', 'Low', 'Medium', 'High', 'Urgent'];
  const viewOptions = isAdmin 
    ? ['All Tasks', 'Assigned Tasks', 'Created Tasks', 'Completed Tasks']
    : ['My Tasks', 'Assigned to Me', 'Created by Me', 'Completed'];

  const handleStatusChange = (status: string) => {
    const newStatus = status === 'All' ? undefined : status as Status;
    dispatch(setFilters({ ...filters, status: newStatus }));
  };

  const handlePriorityChange = (priority: string) => {
    const newPriority = priority === 'All' ? undefined : priority as Priority;
    dispatch(setFilters({ ...filters, priority: newPriority }));
  };

  const handleViewChange = (view: string) => {
    const newFilters: any = { ...filters };
    
    switch(view) {
      case 'All Tasks':
        delete newFilters.assigned;
        delete newFilters.created;
        delete newFilters.status;
        break;
      case 'Assigned Tasks':
      case 'Assigned to Me':
        newFilters.assigned = true;
        delete newFilters.created;
        delete newFilters.status;
        break;
      case 'Created Tasks':
      case 'Created by Me':
        newFilters.created = true;
        delete newFilters.assigned;
        delete newFilters.status;
        break;
      case 'Completed Tasks':
      case 'Completed':
        newFilters.status = 'Completed';
        delete newFilters.assigned;
        delete newFilters.created;
        break;
    }
    
    dispatch(setFilters(newFilters));
  };

  const clearFilters = () => {
    dispatch(setFilters({}));
  };

  const getActiveView = () => {
    if (filters.status === 'Completed') return isAdmin ? 'Completed Tasks' : 'Completed';
    if (filters.assigned === true) return isAdmin ? 'Assigned Tasks' : 'Assigned to Me';
    if (filters.created === true) return isAdmin ? 'Created Tasks' : 'Created by Me';
    return isAdmin ? 'All Tasks' : 'My Tasks';
  };

  // Helper function to compare status values safely
  const isStatusSelected = (status: string): boolean => {
    if (status === 'All' && !filters.status) return true;
    return filters.status === status;
  };

  // Helper function to compare priority values safely
  const isPrioritySelected = (priority: string): boolean => {
    if (priority === 'All' && !filters.priority) return true;
    return filters.priority === priority;
  };

  return (
    <div className="space-y-4">
      {/* Quick View Buttons */}
      <div className="flex flex-wrap gap-2">
        {viewOptions.map((view) => (
          <button
            key={view}
            onClick={() => handleViewChange(view)}
            className={`
              px-3 py-2 text-sm font-medium rounded-lg transition-colors
              ${getActiveView() === view 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
              }
            `}
          >
            {view}
          </button>
        ))}
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg flex items-center"
        >
          <Filter className="h-4 w-4 mr-1" />
          {showFilters ? 'Hide Filters' : 'More Filters'}
        </button>
        
        {(filters.status || filters.priority) && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`
                    px-3 py-2 text-sm rounded-lg transition-colors
                    ${isStatusSelected(status)
                      ? 'bg-gray-800 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }
                  `}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map((priority) => (
                <button
                  key={priority}
                  onClick={() => handlePriorityChange(priority)}
                  className={`
                    px-3 py-2 text-sm rounded-lg transition-colors
                    ${isPrioritySelected(priority)
                      ? 'bg-gray-800 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }
                  `}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          {/* Active filters display */}
          <div className="pt-3 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Active filters:
              {filters.status && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  Status: {filters.status}
                </span>
              )}
              {filters.priority && (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                  Priority: {filters.priority}
                </span>
              )}
              {filters.assigned && (
                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                  Assigned Tasks
                </span>
              )}
              {filters.created && (
                <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                  Created Tasks
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskFilters;