import api from './api';

export const notificationApi = {
  getNotifications: async (unreadOnly?: boolean, limit?: number) => {
    const params = new URLSearchParams();
    if (unreadOnly) params.append('unreadOnly', 'true');
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get(`/notifications?${params.toString()}`);
    return response.data;
  },
  
  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`, {});
    return response.data;
  },
  
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all', {});
    return response.data;
  },
  
  deleteNotification: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  }
};