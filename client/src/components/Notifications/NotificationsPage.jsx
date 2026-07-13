import React, { useState, useEffect, useCallback } from 'react';
import {
  FiBell, FiBellOff, FiCheck, FiCheckCircle, FiTrash2, FiFilter,
  FiChevronLeft, FiChevronRight, FiAlertCircle, FiInfo, FiUser,
  FiMessageCircle, FiRefreshCw,
} from 'react-icons/fi';
import { notificationAPI } from '../../utils/api';

const TYPE_CONFIG = {
  complaint_update: {
    icon: FiMessageCircle,
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    label: 'Complaint Update',
  },
  assignment: {
    icon: FiUser,
    color: 'text-purple-500',
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    label: 'Assignment',
  },
  system: {
    icon: FiInfo,
    color: 'text-gray-500',
    bg: 'bg-gray-100 dark:bg-gray-700/40',
    label: 'System',
  },
  resolution: {
    icon: FiCheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-100 dark:bg-green-900/40',
    label: 'Resolution',
  },
  escalation: {
    icon: FiAlertCircle,
    color: 'text-red-500',
    bg: 'bg-red-100 dark:bg-red-900/40',
    label: 'Escalation',
  },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const ITEMS_PER_PAGE = 10;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await notificationAPI.getAll();
      setNotifications(res.data?.notifications || res.notifications || []);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !(n.read || n.is_read)).length;

  const filtered = notifications.filter((n) => {
    if (typeFilter === 'all') return true;
    return n.type === typeFilter;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setPage(1);
  }, [typeFilter]);

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          (n.id === id || n._id === id) ? { ...n, read: true, is_read: true } : n
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await notificationAPI.markAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, is_read: true }))
      );
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      if (notificationAPI.delete) {
        await notificationAPI.delete(id);
      }
      setNotifications((prev) => prev.filter((n) => (n.id || n._id) !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <FiBell size={24} className="text-gray-800 dark:text-gray-100" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Refresh"
          >
            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <FiCheckCircle size={14} />
              {markingAll ? 'Marking...' : 'Mark all read'}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <FiFilter size={14} className="text-gray-400 flex-shrink-0" />
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
            typeFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All
        </button>
        {Object.entries(TYPE_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              typeFilter === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
          <FiAlertCircle className="mx-auto mb-2 text-red-500" size={24} />
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          <button
            onClick={fetchNotifications}
            className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && paginated.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
            <FiBellOff size={28} className="text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
            No notifications
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You&apos;re all caught up! Notifications will appear here.
          </p>
        </div>
      )}

      {!loading && !error && paginated.length > 0 && (
        <div className="space-y-2">
          {paginated.map((n) => {
            const id = n.id || n._id;
            const isUnread = !(n.read || n.is_read);
            const typeConf = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
            const IconComp = typeConf.icon;

            return (
              <div
                key={id}
                className={`relative flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  isUnread
                    ? 'bg-blue-50/60 dark:bg-blue-900/15 border-blue-200 dark:border-blue-800/50'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
                onClick={() => {
                  if (isUnread) handleMarkRead(id);
                }}
              >
                {isUnread && (
                  <span className="absolute top-4 left-1.5 w-2 h-2 bg-blue-500 rounded-full" />
                )}

                <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${typeConf.bg}`}>
                  <IconComp size={16} className={typeConf.color} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                      {n.title || 'Notification'}
                    </p>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                      {timeAgo(n.created_at || n.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                    {n.message || n.body || ''}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(id);
                  }}
                  className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete notification"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <FiChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Page <span className="font-semibold">{page}</span> of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <FiChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
