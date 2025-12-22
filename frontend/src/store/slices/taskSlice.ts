import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task, Priority, Status } from '../../types';

interface Filters {
  status?: Status;
  priority?: Priority;
  sort: string;
  assigned?: boolean;
  created?: boolean;
  search?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

interface TaskState {
  tasks: Task[];
  recentTasks: Task[];
  selectedTask: Task | null;
  isLoading: boolean;
  error: string | null;
  filters: Filters;
  pagination: Pagination;
}

const initialState: TaskState = {
  tasks: [],
  recentTasks: [],
  selectedTask: null,
  isLoading: false,
  error: null,
  filters: {
    sort: 'dueDate:asc',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false,
  },
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<{ tasks: Task[]; total: number; hasMore: boolean }>) => {
      state.tasks = Array.isArray(action.payload.tasks) ? action.payload.tasks : [];
      state.pagination.total = action.payload.total || 0;
      state.pagination.hasMore = action.payload.hasMore || false;
      state.isLoading = false;
      state.error = null;
    },

    setRecentTasks: (state, action: PayloadAction<Task[]>) => {
      state.recentTasks = Array.isArray(action.payload) ? action.payload : [];
    },

    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks = [action.payload, ...state.tasks];
      state.recentTasks = [action.payload, ...state.recentTasks.slice(0, 4)];
      state.pagination.total += 1;
    },

    updateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(task => task._id === action.payload._id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
      
      const recentIndex = state.recentTasks.findIndex(task => task._id === action.payload._id);
      if (recentIndex !== -1) {
        state.recentTasks[recentIndex] = action.payload;
      }
      
      if (state.selectedTask?._id === action.payload._id) {
        state.selectedTask = action.payload;
      }
    },

    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(task => task._id !== action.payload);
      state.recentTasks = state.recentTasks.filter(task => task._id !== action.payload);
      state.pagination.total = Math.max(0, state.pagination.total - 1);
      if (state.selectedTask?._id === action.payload) {
        state.selectedTask = null;
      }
    },

    setSelectedTask: (state, action: PayloadAction<Task | null>) => {
      state.selectedTask = action.payload;
    },

    setFilters: (state, action: PayloadAction<Partial<Filters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },

    setPagination: (state, action: PayloadAction<Partial<Pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    clearError: (state) => {
      state.error = null;
    },

    clearFilters: (state) => {
      state.filters = {
        sort: 'dueDate:asc',
      };
      state.pagination.page = 1;
    },
  },
});

export const {
  setTasks,
  setRecentTasks,
  addTask,
  updateTask,
  deleteTask,
  setSelectedTask,
  setFilters,
  setPagination,
  setLoading,
  setError,
  clearError,
  clearFilters,
} = taskSlice.actions;

export default taskSlice.reducer;