/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setLoading, setUser, clearAuth } from '../../store/slices/authSlice';
import { authApi } from '../../api/auth';
import Header from './Header';
import Sidebar from './Sidebar';
import Loader from '../ui/Loader';
import { useSocket } from '../../hooks/useSocket';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, token } = useAppSelector((state) => state.auth);
  
  // Initialize socket connection
  const { isConnected, getSocket } = useSocket();

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        dispatch(setLoading(false));
        navigate('/login');
        return;
      }

      try {
        const response = await authApi.getCurrentUser();
        if (response.success) {
          dispatch(setUser(response.data.user));
        } else {
          dispatch(clearAuth());
          navigate('/login');
        }
      } catch (error: any) {
        dispatch(clearAuth());
        navigate('/login');
      }
    };

    loadUser();
  }, [dispatch, navigate, token]);

  // Use socket for custom events if needed
  useEffect(() => {
    const socket = getSocket();
    if (socket && isConnected && isAuthenticated) {
      // You can set up custom socket events here
    }
    
    return () => {
      if (socket) {
        socket.offAny(); // Remove all listeners
      }
    };
  }, [getSocket, isConnected, isAuthenticated]);

  if (isLoading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Connection status indicator */}
      {isConnected && (
        <div className="fixed top-2 right-2 z-50">
          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>Live</span>
          </div>
        </div>
      )}
      
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} />
        
        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;