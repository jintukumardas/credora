'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotifications, useAppStore } from '@/lib/store';

export function Notifications() {
  const notifications = useNotifications();
  const { markNotificationRead } = useAppStore();
  const [visibleNotifications, setVisibleNotifications] = useState<string[]>([]);

  useEffect(() => {
    // Show new notifications
    notifications.forEach(notif => {
      if (!notif.read && !visibleNotifications.includes(notif.id)) {
        setVisibleNotifications(prev => [...prev, notif.id]);

        // Auto-hide after 5 seconds
        setTimeout(() => {
          markNotificationRead(notif.id);
          setVisibleNotifications(prev => prev.filter(id => id !== notif.id));
        }, 5000);
      }
    });
  }, [notifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const activeNotifications = notifications.filter(n => visibleNotifications.includes(n.id));

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {activeNotifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg shadow-lg p-4"
          >
            <div className="flex items-start gap-3">
              {getIcon(notification.type)}
              <div className="flex-1">
                <h4 className="font-semibold text-white">{notification.title}</h4>
                <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
              </div>
              <button
                onClick={() => {
                  markNotificationRead(notification.id);
                  setVisibleNotifications(prev => prev.filter(id => id !== notification.id));
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}