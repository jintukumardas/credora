'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, MessageCircle, TrendingUp, Shield } from 'lucide-react';
import { useNotifications, useAppStore } from '@/lib/store';
import { useAccount } from 'wagmi';
import { pinataService, IPFSNotification, IPFSMessage } from '@/lib/pinata-service';
import { Address } from 'viem';

export function Notifications() {
  const notifications = useNotifications();
  const { markNotificationRead, addNotification } = useAppStore();
  const { address, isConnected } = useAccount();
  const [visibleNotifications, setVisibleNotifications] = useState<string[]>([]);
  const [hasShownDummyNotifications, setHasShownDummyNotifications] = useState(false);
  const [ipfsNotifications, setIpfsNotifications] = useState<IPFSNotification[]>([]);
  const [ipfsMessages, setIpfsMessages] = useState<IPFSMessage[]>([]);
  const [isLoadingIPFS, setIsLoadingIPFS] = useState(false);

  // Load IPFS notifications and messages for the logged-in user
  useEffect(() => {
    if (isConnected && address) {
      loadIPFSContent(address as Address);
    }
  }, [isConnected, address]);

  const loadIPFSContent = async (userAddress: Address) => {
    setIsLoadingIPFS(true);
    try {
      // Initialize Pinata service if needed (will use mock if no API keys)
      const initialized = await pinataService.initialize();

      if (!initialized) {
        console.warn('Using mock IPFS storage for development');
      }

      // Load notifications from IPFS for the current user
      const fetchedNotifications = await pinataService.getNotificationsForUser(userAddress);
      setIpfsNotifications(fetchedNotifications);

      // Load messages from IPFS for the current user
      const fetchedMessages = await pinataService.getMessagesForUser(userAddress);
      setIpfsMessages(fetchedMessages);

      // Add IPFS notifications to the visible notifications
      fetchedNotifications.forEach((notif, index) => {
        if (!notif.read) {
          // Add a small delay to ensure unique timestamps
          setTimeout(() => {
            addNotification({
              type: notif.priority === 'high' ? 'warning' : notif.type === 'message' ? 'info' : 'success',
              title: notif.title,
              message: notif.content,
              metadata: {
                sender: notif.sender,
                timestamp: notif.timestamp.toISOString(),
                ipfsHash: notif.ipfsHash,
                actionUrl: notif.actionUrl,
                uniqueKey: `ipfs-notif-${notif.id || index}-${Date.now()}-${Math.random()}`,
              }
            });
          }, index * 10); // Stagger by 10ms
        }
      });

      // Show unread messages as notifications
      fetchedMessages.forEach((msg, index) => {
        setTimeout(() => {
          addNotification({
            type: 'info',
            title: 'New Message',
            message: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
            metadata: {
              sender: msg.sender,
              domainContext: msg.domainContext,
              timestamp: msg.timestamp.toISOString(),
              uniqueKey: `ipfs-msg-${msg.id || index}-${Date.now()}-${Math.random()}`,
            }
          });
        }, (fetchedNotifications.length + index) * 10); // Stagger after notifications
      });
    } catch (error) {
      console.error('Failed to load IPFS content:', error);
    } finally {
      setIsLoadingIPFS(false);
    }
  };

  // Add dummy notifications on first load
  useEffect(() => {
    if (!hasShownDummyNotifications && (!notifications || notifications.length === 0)) {
      setTimeout(() => {
        addNotification({
          type: 'success',
          title: 'Welcome to Credora!',
          message: 'Your domain DeFi platform is ready',
        });
      }, 1500);
      setHasShownDummyNotifications(true);
    }
  }, [hasShownDummyNotifications, notifications?.length, addNotification]);

  useEffect(() => {
    // Show new notifications
    (notifications || []).forEach(notif => {
      if (!notif.read && !visibleNotifications.includes(notif.id)) {
        setVisibleNotifications(prev => [...prev, notif.id]);

        // Auto-hide after 7 seconds for non-important notifications
        const hideTimeout = notif.type === 'warning' || notif.type === 'error' ? 10000 : 7000;
        setTimeout(() => {
          markNotificationRead(notif.id);
          setVisibleNotifications(prev => prev.filter(id => id !== notif.id));
        }, hideTimeout);
      }
    });
  }, [notifications, visibleNotifications, markNotificationRead]);

  const getIcon = (type: string, metadata?: any) => {
    // Check for message-related notifications
    if (metadata?.sender || metadata?.domainContext) {
      return <MessageCircle className="w-5 h-5 text-blue-400" />;
    }

    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-blue-400" />;
      case 'domain':
        return <Shield className="w-5 h-5 text-purple-400" />;
      case 'trending':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const activeNotifications = (notifications || []).filter(n => visibleNotifications.includes(n.id));

  // Handle notification click for actions
  const handleNotificationClick = (notification: any) => {
    if (notification.metadata?.actionUrl) {
      window.location.href = notification.metadata.actionUrl;
    }
    markNotificationRead(notification.id);
    setVisibleNotifications(prev => prev.filter(id => id !== notification.id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {activeNotifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className={`bg-[var(--card-bg)] border border-[var(--border)] rounded-lg shadow-lg p-4 ${
              notification.metadata?.actionUrl ? 'cursor-pointer hover:border-[var(--primary)]' : ''
            }`}
            onClick={() => notification.metadata?.actionUrl && handleNotificationClick(notification)}
          >
            <div className="flex items-start gap-3">
              {getIcon(notification.type, notification.metadata)}
              <div className="flex-1">
                <h4 className="font-semibold text-white">{notification.title}</h4>
                <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
                {notification.metadata?.sender && (
                  <p className="text-xs text-gray-500 mt-2">
                    From: {notification.metadata.sender.slice(0, 6)}...{notification.metadata.sender.slice(-4)}
                  </p>
                )}
                {notification.metadata?.domainContext && (
                  <p className="text-xs text-[var(--primary)] mt-1">
                    Domain: {notification.metadata.domainContext}
                  </p>
                )}
                {notification.metadata?.actionUrl && (
                  <p className="text-xs text-blue-400 mt-2 hover:underline">
                    Click to view →
                  </p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
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

      {/* IPFS Loading Indicator */}
      {isLoadingIPFS && isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-3"
        >
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--primary)]"></div>
            <p className="text-sm text-gray-400">Loading messages from IPFS...</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}