import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, User, AlertCircle, ShieldAlert } from 'lucide-react';
import type { z } from 'zod';
import { useAppSelector } from '../../store/hooks';
import { User as UserType } from '../../types';
import { taskSchema } from '../../utils/validation';
import { userApi } from '../../api/users';

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  initialData?: Partial<TaskFormData> & { _id?: string };
  onSubmit: (data: TaskFormData) => Promise<void>;
  isSubmitting: boolean;
  submitLabel?: string;
}

const TaskForm: React.FC<TaskFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
  submitLabel = 'Create Task',
}) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const isAdmin = currentUser?.role === 'admin';
  const isCreating = !initialData?._id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      ...initialData,
      status: 'To Do' 
    },
  });

  useEffect(() => {
    loadUsers();
    if (initialData) {
      reset({
        ...initialData,
        status: initialData.status || 'To Do'
      });
    }
  }, );

  const loadUsers = async () => {
    try {
      const data = await userApi.getAllUsers();
      const filteredUsers = data.filter(u => u._id !== currentUser?._id);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleFormSubmit = async (data: TaskFormData) => {
    if (isCreating) {
      data.status = 'To Do';
    }
    
    await onSubmit(data);
  };

  const dueDate = watch('dueDate');
  const isDateInPast = dueDate && new Date(dueDate) <= new Date();
  const assignedToId = watch('assignedToId');

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Task Title *
        </label>
        <input
          type="text"
          id="title"
          {...register('title')}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
            ${errors.title ? 'border-red-300' : 'border-gray-300'}
          `}
          placeholder="Enter task title"
          maxLength={100}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.title.message}
          </p>
        )}
        <div className="mt-1 text-xs text-gray-500 text-right">
          {watch('title')?.length || 0}/100 characters
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={4}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
            ${errors.description ? 'border-red-300' : 'border-gray-300'}
          `}
          placeholder="Describe the task in detail"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Due Date */}
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
            Due Date *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="datetime-local"
              id="dueDate"
              {...register('dueDate')}
              className={`
                w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                ${errors.dueDate || isDateInPast ? 'border-red-300' : 'border-gray-300'}
              `}
            />
          </div>
          {(errors.dueDate || isDateInPast) && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.dueDate?.message || 'Due date must be in the future'}
            </p>
          )}
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority *
          </label>
          <select
            id="priority"
            {...register('priority')}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
              ${errors.priority ? 'border-red-300' : 'border-gray-300'}
            `}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
          {errors.priority && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.priority.message}
            </p>
          )}
        </div>

        {/* Assigned To */}
        <div>
          <label htmlFor="assignedToId" className="block text-sm font-medium text-gray-700 mb-1">
            Assign To *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              id="assignedToId"
              {...register('assignedToId')}
              className={`
                w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                ${errors.assignedToId ? 'border-red-300' : 'border-gray-300'}
                ${isAdmin && isCreating && assignedToId === currentUser?._id ? 'border-red-300' : ''}
              `}
              disabled={isAdmin && !isCreating && initialData?.assignedToId === currentUser?._id}
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email}) {user.role === 'admin' ? '- Admin' : ''}
                </option>
              ))}
            </select>
          </div>
          {errors.assignedToId && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.assignedToId.message}
            </p>
          )}
          {isAdmin && assignedToId === currentUser?._id && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <ShieldAlert className="h-4 w-4 mr-1" />
              Admin cannot assign tasks to themselves
            </p>
          )}
        </div>

        {/* Status - Only show for editing non-admin tasks */}
        {!isCreating && !isAdmin && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        )}

        {/* Status - Hidden for admin (always "To Do" for new tasks) */}
        {isAdmin && isCreating && (
          <div className="hidden">
            <input type="hidden" {...register('status')} value="To Do" />
          </div>
        )}
      </div>

  

      {/* Submit button */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || (isAdmin && assignedToId === currentUser?._id)}
          className={`
            px-6 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2
            ${isSubmitting || (isAdmin && assignedToId === currentUser?._id)
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            } text-white
          `}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;