"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ui/ToastContainer';
import { useRouter } from 'next/navigation';
import { notificationService } from '@/lib/services/notification';
import type { Notification, CreateNotificationDTO } from '@/lib/types/notification';
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  Info,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Send,
} from 'lucide-react';

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const typeColors = {
  info: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  error: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function DashboardNotificationsPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateNotificationDTO & { userId: string }>({
    title: '',
    message: '',
    type: 'info',
    link: '',
    userId: '',
  });
  const [users, setUsers] = useState<{ uid: string; email: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!loading && !isAdmin) {
      toast.error('You do not have permission to access this page');
      router.push('/dashboard');
    }
  }, [loading, isAdmin, router, toast]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getAllNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users for dropdown
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchNotifications();
      fetchUsers();

      // Subscribe to realtime updates
      const unsubscribe = notificationService.subscribeToAllNotifications((data) => {
        setNotifications(data);
      });

      return () => unsubscribe();
    }
  }, [isAdmin]);

  const handleCreate = async () => {
    if (!formData.title || !formData.message || !formData.userId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await notificationService.create(formData);
      toast.success('Notification created successfully');
      resetForm();
    } catch (error) {
      console.error('Error creating notification:', error);
      toast.error('Failed to create notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    if (!formData.title || !formData.message || !formData.userId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await notificationService.update(editingId, formData);
      toast.success('Notification updated successfully');
      resetForm();
    } catch (error) {
      console.error('Error updating notification:', error);
      toast.error('Failed to update notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
      await notificationService.delete(id);
      toast.success('Notification deleted successfully');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleEdit = (notification: Notification) => {
    setEditingId(notification.id);
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      link: notification.link || '',
      userId: notification.userId,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      title: '',
      message: '',
      type: 'info',
      link: '',
      userId: '',
    });
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-gray-300">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-gray-400 mt-1">
            Create and manage notifications for your users
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingId(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Notification
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Total</p>
          <p className="text-2xl font-bold text-white">{notifications.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Unread</p>
          <p className="text-2xl font-bold text-white">
            {notifications.filter((n) => !n.read).length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Read</p>
          <p className="text-2xl font-bold text-white">
            {notifications.filter((n) => n.read).length}
          </p>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-12 text-center">
          <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-sm mb-2">No notifications created</p>
          <p className="text-xs text-gray-500">
            Create your first notification to send to users
          </p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {notifications.map((notification) => {
                  const Icon = iconMap[notification.type] || Info;
                  const colorClass = typeColors[notification.type] || typeColors.info;

                  return (
                    <tr key={notification.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-400 truncate max-w-xs">
                            {notification.message}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-300">
                          {notification.userId.slice(0, 8)}...
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            notification.read
                              ? 'bg-gray-600 text-gray-300'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {notification.read ? 'Read' : 'Unread'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-400">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(notification)}
                            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Edit Notification' : 'Create Notification'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter notification title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Message *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter notification message"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as 'info' | 'success' | 'warning' | 'error',
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Link (optional)
                </label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  User ID *
                </label>
                <select
                  value={formData.userId}
                  onChange={(e) =>
                    setFormData({ ...formData, userId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.uid} value={user.uid}>
                      {user.email} ({user.uid.slice(0, 8)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingId ? handleUpdate : handleCreate}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {isSubmitting
                  ? 'Sending...'
                  : editingId
                  ? 'Update'
                  : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
