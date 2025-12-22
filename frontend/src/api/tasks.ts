import api from './api';
import { Task } from '../types';

export interface TaskFilters {
  status?: string;
  priority?: string;
  sort?: string;
  page?: number;
  limit?: number;
  assigned?: boolean;
  created?: boolean;
}

export interface CreateTaskData {
  title: string;
  description: string;
  dueDate: string;
  priority: string;
  status?: string;
  assignedToId: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: string;
  status?: string;
  assignedToId?: string;
}

export interface TaskResponse {
  success: boolean;
  data: {
    tasks: Task[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export const taskApi = {
  getTasks: async (filters: TaskFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== false) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get<TaskResponse>(`/tasks?${params}`);
    
    return {
      tasks: response.data.data?.tasks || [],
      total: response.data.data?.total || 0,
      hasMore: response.data.data?.hasMore || false,
      page: response.data.data?.page || 1,
      limit: response.data.data?.limit || 10
    };
  },

  getRecentTasks: async (limit: number = 5) => {
    const response = await api.get(`/tasks/recent?limit=${limit}`);
    return response.data.data?.recentTasks || [];
  },

  getTaskById: async (id: string) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data.data?.task;
  },

  createTask: async (data: CreateTaskData) => {
    const response = await api.post('/tasks', data);
    return response.data.data?.task;
  },

  updateTask: async (id: string, data: UpdateTaskData) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data.data?.task;
  },

  updateTaskStatus: async (id: string, status: string) => {
    const response = await api.patch(`/tasks/${id}/status`, { status });
    return response.data.data;
  },

  deleteTask: async (id: string) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/tasks/dashboard');
    return response.data.data;
  },

  getAdminTasks: async (filters: TaskFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== false) {
        params.append(key, String(value));
      }
    });
    
    const response = await api.get(`/tasks/admin/all?${params}`);
    return response.data.data;
  },
};