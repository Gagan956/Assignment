import api from './api';
import { User } from '../types';

export interface UpdateProfileData {
  name: string;
}

export const userApi = {
  updateProfile: async (data: UpdateProfileData) => {
    const response = await api.put<{ data: { user: User } }>('/users/profile', data);
    return response.data.data.user;
  },

  getAllUsers: async () => {
    const response = await api.get<{ data: { users: User[] } }>('/users/all');
    return response.data.data.users;
  },
};