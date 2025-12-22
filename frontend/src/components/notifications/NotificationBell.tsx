/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, RefreshCw } from "lucide-react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { notificationApi } from "../../api/notifications";
import {
  setNotifications,
  markAsRead,
  markAllAsRead,
} from "../../store/slices/NotificationSlice";
import toast from "react-hot-toast";

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const { notifications, unreadCount } = useAppSelector(
    (state) => state.notifications
  );
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadNotifications = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await notificationApi.getNotifications(false, 20);
      dispatch(setNotifications(response.data.notifications));
      setLastFetched(new Date());
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, isLoading]);

  // fetch once when component mounts
  useEffect(() => {
    loadNotifications();
  }, []);

  // Mark notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await notificationApi.markAsRead(id);
      if (response.success) {
        dispatch(markAsRead(id));
        toast.success("Notification marked as read");
      } else {
        toast.error(response.message || "Failed to mark notification as read");
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        dispatch(markAsRead(id));
        toast.success("Notification marked as read (offline)");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to mark notification as read"
        );
      }
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      const response = await notificationApi.markAllAsRead();
      if (response.success) {
        dispatch(markAllAsRead());
        await loadNotifications(); // Refresh the list
        toast.success("All notifications marked as read");
      } else {
        toast.error(response.message || "Failed to mark all as read");
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        dispatch(markAllAsRead());
        toast.success("All notifications marked as read (offline)");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to mark all as read"
        );
      }
    }
  };

  // Open/close notification dropdown
  const handleBellClick = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {lastFetched && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last updated:{" "}
                    {lastFetched.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={loadNotifications}
                  disabled={isLoading}
                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Mark all read
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleMarkAsRead(notification._id)}
                  >
                    <div className="flex justify-between">
                      <p className="text-sm text-gray-800">
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleDateString()} at{" "}
                      {new Date(notification.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-200">
            <a
              href="/notifications"
              className="block text-center text-sm text-blue-600 hover:text-blue-700"
            >
              View all notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
