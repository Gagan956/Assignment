/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, User, Flag, Clock, MoreVertical, CheckCircle, PlayCircle, Eye, RotateCcw, Trash2, Edit } from 'lucide-react';
import { Task, Status } from '../../types';
import { useAppSelector } from '../../store/hooks';
import { taskApi } from '../../api/tasks';
import toast from 'react-hot-toast';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, newStatus: Status) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onEdit, 
  onDelete,
  onStatusChange 
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Completed';
  const isAssignedToMe = task.assignedToId._id === user?._id;
  const isCreatedByMe = task.creatorId._id === user?._id;
  const isAdmin = user?.role === 'admin';
  
  const canUpdateStatus = isAssignedToMe;
  const canEdit = isAdmin || isCreatedByMe;
  const canDelete = isAdmin || (isCreatedByMe && task.status === 'Completed');
  const showCreatedByMe = isCreatedByMe && !isAdmin;

  const priorityColors: Record<string, string> = {
    Low: 'bg-green-100 text-green-800 border-green-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    High: 'bg-orange-100 text-orange-800 border-orange-200',
    Urgent: 'bg-red-100 text-red-800 border-red-200',
  };

  const statusColors: Record<Status, { bg: string, text: string, border: string, icon: string }> = {
    'To Do': {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-200',
      icon: 'text-gray-500'
    },
    'In Progress': {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: 'text-blue-500'
    },
    'Review': {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: 'text-purple-500'
    },
    'Completed': {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
      icon: 'text-green-500'
    },
  };

  const statusIcons: Record<Status, React.ReactNode> = {
    'To Do': <RotateCcw className="h-4 w-4 mr-1" />,
    'In Progress': <PlayCircle className="h-4 w-4 mr-1" />,
    'Review': <Eye className="h-4 w-4 mr-1" />,
    'Completed': <CheckCircle className="h-4 w-4 mr-1" />,
  };

  const handleStatusChange = async (newStatus: Status) => {
    if (!canUpdateStatus) {
      toast.error('Only assigned user can update task status');
      return;
    }

    setIsUpdating(true);
    try {
      await taskApi.updateTaskStatus(task._id, newStatus);
      
      if (onStatusChange) {
        onStatusChange(task._id, newStatus);
      }
      
      let message = '';
      
      switch(newStatus) {
        case 'In Progress':
          message = `Started working on "${task.title}"`;
          break;
        case 'Review':
          message = `Sent "${task.title}" for review`;
          break;
        case 'Completed':
          message = `Completed "${task.title}"`;
          break;
        default:
          message = `Updated "${task.title}" status`;
      }
      
      toast.success(message);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update task status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error('You are not authorized to delete this task');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await taskApi.deleteTask(task._id);
      
      if (onDelete) {
        onDelete(task._id);
      }
      
      toast.success('Task deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    if (onEdit && canEdit) {
      onEdit(task);
    }
  };

  const getStatusOptions = () => {
    if (!isAssignedToMe) {
      return [];
    }

    switch (task.status) {
      case 'To Do':
        return [
          { value: 'In Progress' as Status, label: 'Start Working', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' },
          { value: 'Completed' as Status, label: 'Mark Complete', color: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200' }
        ];
      case 'In Progress':
        return [
          { value: 'Review' as Status, label: 'Send for Review', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200' },
          { value: 'Completed' as Status, label: 'Mark Complete', color: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200' }
        ];
      case 'Review':
        return [
          { value: 'Completed' as Status, label: 'Approve & Complete', color: 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200' },
          { value: 'In Progress' as Status, label: 'Reopen', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' }
        ];
      case 'Completed':
        return [
          { value: 'To Do' as Status, label: 'Reopen', color: 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200' },
          { value: 'In Progress' as Status, label: 'Restart', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' }
        ];
      default:
        return [];
    }
  };

  const statusOptions = getStatusOptions();
  const currentStatusConfig = statusColors[task.status];

  return (
    <div className={`
      bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200
      ${task.status === 'Completed' ? 'border-green-200' : 
        isOverdue ? 'border-red-200' : 'border-gray-200'}
      ${(isUpdating || isDeleting) ? 'opacity-75' : ''}
    `}>
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{task.title}</h3>
              {task.status === 'Completed' && isAdmin && (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Ready to Delete
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
          </div>
          {(canEdit || canDelete) && (
            <div className="relative">
              <button 
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="More options"
              >
                <MoreVertical className="h-5 w-5 text-gray-400" />
              </button>
              
              {showMoreOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    {canEdit && (
                      <button
                        onClick={() => {
                          handleEdit();
                          setShowMoreOptions(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Task
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => {
                          handleDelete();
                          setShowMoreOptions(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isAdmin ? 'Delete Task' : 'Delete My Task'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-3 py-1 text-xs font-medium rounded-full border flex items-center gap-1 ${priorityColors[task.priority]}`}>
            <Flag className="h-3 w-3" />
            {task.priority}
          </span>
          
          <span className={`px-3 py-1 text-xs font-medium rounded-full border flex items-center gap-1 
            ${currentStatusConfig.bg} ${currentStatusConfig.text} ${currentStatusConfig.border}`}>
            <div className={currentStatusConfig.icon}>
              {statusIcons[task.status]}
            </div>
            {task.status}
          </span>
          
          {isOverdue && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Overdue
            </span>
          )}
          {isAssignedToMe && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Assigned to me
            </span>
          )}
          {showCreatedByMe && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
              Created by me
            </span>
          )}
        </div>

        {/* Details */}
        <div className="space-y-3 text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 shrink-0 text-gray-400" />
            <span>Due {format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
            {isOverdue && (
              <span className="ml-2 text-xs font-medium text-red-600">
                ({format(new Date(task.dueDate), 'MMM d')})
              </span>
            )}
          </div>
          
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 shrink-0 text-gray-400" />
            <div className="truncate">
              <span className="font-medium">Assigned to: </span>
              {task.assignedToId.name}
              {isAssignedToMe && ' (You)'}
            </div>
          </div>

          {(isCreatedByMe || !isAdmin) && (
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 shrink-0 text-gray-400" />
              <div className="truncate">
                <span className="font-medium">Created by: </span>
                {task.creatorId.name}
                {isCreatedByMe && ' (You)'}
              </div>
            </div>
          )}
        </div>

        {/* Status Update Section */}
        {statusOptions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="mb-3">
              <span className="text-sm font-medium text-gray-700">
                Update Status:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  disabled={isUpdating || task.status === option.value}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-lg transition-all
                    ${option.color}
                    ${task.status === option.value ? 'opacity-50 cursor-not-allowed' : ''}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {isUpdating ? 'Updating...' : option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Admin Delete Button */}
        {canDelete && task.status === 'Completed' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`
                w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors
                flex items-center justify-center gap-2
                ${isDeleting 
                  ? 'bg-red-400 cursor-not-allowed' 
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                }
              `}
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Deleting...' : 
                isAdmin ? 'Delete Completed Task' : 'Delete My Completed Task'
              }
            </button>
          </div>
        )}

        {/* Timeline */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Created {format(new Date(task.createdAt), 'MMM d, yyyy')}
            {task.updatedAt !== task.createdAt && (
              <span> • Updated {format(new Date(task.updatedAt), 'MMM d, yyyy')}</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Close dropdown when clicking outside */}
      {showMoreOptions && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowMoreOptions(false)}
        />
      )}
    </div>
  );
};

export default TaskCard;