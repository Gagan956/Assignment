/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { X, Calendar, User, Clock, CheckCircle, PlayCircle, Eye, RotateCcw, Edit, Trash2, FileText } from 'lucide-react';
import { Task, Status } from '../../types';
import { useAppSelector } from '../../store/hooks';
import { taskApi } from '../../api/tasks';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface TaskDetailModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (taskId: string, newStatus: Status) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onStatusChange,
  onEdit,
  onDelete
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAppSelector((state) => state.auth);

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Completed';
  const isAssignedToMe = task.assignedToId._id === user?._id;
  const isCreatedByMe = task.creatorId._id === user?._id;
  const isAdmin = user?.role === 'admin';
  
  const canUpdateStatus = isAssignedToMe;
  const canEdit = isAdmin || isCreatedByMe;
  const canDelete = isAdmin || (isCreatedByMe && task.status === 'Completed');

  const statusColors = {
    'To Do': 'bg-gray-100 text-gray-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Review': 'bg-purple-100 text-purple-800',
    'Completed': 'bg-green-100 text-green-800',
  };

  const priorityColors = {
    'Low': 'bg-green-100 text-green-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'High': 'bg-orange-100 text-orange-800',
    'Urgent': 'bg-red-100 text-red-800',
  };

  const handleStatusChange = async (newStatus: Status) => {
    if (!canUpdateStatus) return;

    setIsUpdating(true);
    try {
      await taskApi.updateTaskStatus(task._id, newStatus);
      
      if (onStatusChange) {
        onStatusChange(task._id, newStatus);
      }
      
      toast.success(`Status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;

    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await taskApi.deleteTask(task._id);
      
      if (onDelete) {
        onDelete(task._id);
      }
      
      toast.success('Task deleted successfully');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{task.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority]}`}>
                      {task.priority} Priority
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[task.status]}`}>
                      {task.status}
                    </span>
                    {isOverdue && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        Overdue
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {/* Description */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Assigned To</p>
                    <p className="text-gray-900">{task.assignedToId.name}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Due Date</p>
                    <p className={`${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                      {format(new Date(task.dueDate), 'MMMM d, yyyy')}
                      {isOverdue && ' (Overdue)'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created By</p>
                    <p className="text-gray-900">{task.creatorId.name}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created On</p>
                    <p className="text-gray-900">{format(new Date(task.createdAt), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Update Section */}
            {canUpdateStatus && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Update Status</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleStatusChange('In Progress')}
                    disabled={isUpdating || task.status === 'In Progress'}
                    className="p-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                  >
                    <PlayCircle className="h-5 w-5 mx-auto mb-2" />
                    <span className="text-sm font-medium">In Progress</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange('Review')}
                    disabled={isUpdating || task.status === 'Review'}
                    className="p-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50"
                  >
                    <Eye className="h-5 w-5 mx-auto mb-2" />
                    <span className="text-sm font-medium">Review</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange('Completed')}
                    disabled={isUpdating || task.status === 'Completed'}
                    className="p-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
                  >
                    <CheckCircle className="h-5 w-5 mx-auto mb-2" />
                    <span className="text-sm font-medium">Complete</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange('To Do')}
                    disabled={isUpdating || task.status === 'To Do'}
                    className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    <RotateCcw className="h-5 w-5 mx-auto mb-2" />
                    <span className="text-sm font-medium">Reopen</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between">
              <div className="flex space-x-3">
                {canEdit && (
                  <button
                    onClick={() => {
                      if (onEdit) onEdit(task);
                      onClose();
                    }}
                    className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg"
                  >
                    <Edit className="inline h-4 w-4 mr-1" />
                    Edit Task
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg disabled:opacity-50"
                  >
                    <Trash2 className="inline h-4 w-4 mr-1" />
                    {isDeleting ? 'Deleting...' : 'Delete Task'}
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;