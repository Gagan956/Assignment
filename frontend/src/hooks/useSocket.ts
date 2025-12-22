// hooks/useSocket.ts - FIXED VERSION
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addTask, updateTask, deleteTask } from '../store/slices/taskSlice';
import { addNotification } from '../store/slices/NotificationSlice';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const dispatch = useAppDispatch();
  const { token, isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Get socket instance - useCallback to memoize the function
  const getSocket = useCallback(() => socketRef.current, []);

  useEffect(() => {
    // Clean up previous connection
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (!token || !isAuthenticated || !user) {
      return;
    }

    // Create new socket connection
    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
    });

    // Real-time events
    socket.on('notification', (notification) => {
      if (!notification.userId || notification.userId === user._id) {
        dispatch(addNotification(notification));
        
        if (notification.type === 'task_assigned' || notification.type === 'task_completed') {
          toast.success(notification.message, {
            duration: 5000,
            icon: notification.type === 'task_assigned' ? '📋' : '✅',
          });
        }
      }
    });

    socket.on('task_created', (task) => {
      dispatch(addTask(task));
      
      if (user.role === 'admin' && task.creatorId?._id !== user._id) {
        toast.success(`New task created: ${task.title}`, {
          duration: 4000,
          icon: '📝',
        });
      }
    });

    socket.on('task_updated', (task) => {
      dispatch(updateTask(task));
    });

    socket.on('task_deleted', (taskId) => {
      dispatch(deleteTask(taskId));
      
      toast.success('Task deleted', {
        duration: 3000,
        icon: '🗑️',
      });
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [token, isAuthenticated, user, dispatch]);

  return {
    getSocket, // Method to get socket
    isConnected,
  };
};