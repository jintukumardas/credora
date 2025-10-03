/**
 * Real-time Transaction Monitoring Hook
 * Monitors blockchain transactions and updates UI accordingly
 */

import { useEffect } from 'react';
import { useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { useAppStore } from '@/lib/store';
import toast from 'react-hot-toast';

export function useTransactionMonitor(hash?: `0x${string}`) {
  const {
    markTransactionComplete,
    markTransactionFailed,
    addNotification,
  } = useAppStore();

  const publicClient = usePublicClient();

  const { data: receipt, isError, isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (!hash) return;

    if (isSuccess && receipt) {
      markTransactionComplete(hash);

      // Add success notification
      addNotification({
        type: 'success',
        title: 'Transaction Confirmed',
        message: `Transaction ${hash.slice(0, 10)}... has been confirmed`,
      });

      toast.success(`Transaction confirmed: ${hash.slice(0, 10)}...`);
    }

    if (isError) {
      markTransactionFailed(hash);

      // Add error notification
      addNotification({
        type: 'error',
        title: 'Transaction Failed',
        message: `Transaction ${hash.slice(0, 10)}... has failed`,
      });

      toast.error(`Transaction failed: ${hash.slice(0, 10)}...`);
    }
  }, [isSuccess, isError, hash, receipt]);

  return {
    receipt,
    isLoading,
    isSuccess,
    isError,
  };
}

// Hook for monitoring all pending transactions
export function useAllTransactionsMonitor() {
  const { pendingTransactions } = useAppStore((state) => state.transactions);

  // Note: Cannot call hooks in a loop. This would need a different approach
  // such as creating a component for each transaction to monitor
  // For now, just return the pending transactions without monitoring

  return {
    pendingCount: pendingTransactions.length,
    pendingTransactions,
  };
}