/**
 * React hooks for Doma Orderbook operations
 */

'use client';

import { useState } from 'react';
import { useWalletClient } from 'wagmi';
import type { WalletClient } from 'viem';
import {
  createDomainListing,
  buyDomainListing,
  createDomainOffer,
  acceptDomainOffer,
  cancelDomainListing,
  cancelDomainOffer,
  getSupportedCurrencies,
  getOrderbookFees,
} from './orderbook-service';

/**
 * Hook for creating a domain listing
 */
export function useCreateListing() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const { data: walletClient } = useWalletClient();

  const createListing = async (params: {
    tokenId: string;
    contract: string;
    price: string;
    currencyAddress?: string;
    duration?: number;
  }) => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);
    setProgress('');

    try {
      const result = await createDomainListing({
        ...params,
        walletClient: walletClient as WalletClient,
      });

      setProgress(result.progress);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create listing';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { createListing, isLoading, error, progress };
}

/**
 * Hook for buying a domain listing
 */
export function useBuyListing() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const { data: walletClient } = useWalletClient();

  const buyListing = async (orderId: string) => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);
    setProgress('');

    try {
      const result = await buyDomainListing({
        orderId,
        walletClient: walletClient as WalletClient,
      });

      setProgress(result.progress);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to buy listing';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { buyListing, isLoading, error, progress };
}

/**
 * Hook for creating a domain offer
 */
export function useCreateOffer() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const { data: walletClient } = useWalletClient();

  const createOffer = async (params: {
    tokenId: string;
    contract: string;
    price: string;
    currencyAddress?: string;
    duration?: number;
  }) => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);
    setProgress('');

    try {
      const result = await createDomainOffer({
        ...params,
        walletClient: walletClient as WalletClient,
      });

      setProgress(result.progress);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create offer';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { createOffer, isLoading, error, progress };
}

/**
 * Hook for accepting a domain offer
 */
export function useAcceptOffer() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const { data: walletClient } = useWalletClient();

  const acceptOffer = async (orderId: string) => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);
    setProgress('');

    try {
      const result = await acceptDomainOffer({
        orderId,
        walletClient: walletClient as WalletClient,
      });

      setProgress(result.progress);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept offer';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { acceptOffer, isLoading, error, progress };
}

/**
 * Hook for canceling a listing
 */
export function useCancelListing() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();

  const cancelListing = async (orderId: string) => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await cancelDomainListing({
        orderId,
        walletClient: walletClient as WalletClient,
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel listing';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { cancelListing, isLoading, error };
}

/**
 * Hook for canceling an offer
 */
export function useCancelOffer() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient();

  const cancelOffer = async (orderId: string) => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await cancelDomainOffer({
        orderId,
        walletClient: walletClient as WalletClient,
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel offer';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { cancelOffer, isLoading, error };
}

/**
 * Hook for fetching supported currencies
 */
export function useSupportedCurrencies() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currencies, setCurrencies] = useState<Array<{
    contractAddress: string;
    name: string;
    symbol: string;
    decimals: number;
  }>>([]);

  const fetchCurrencies = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getSupportedCurrencies();
      setCurrencies(result.currencies || []);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch currencies';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { currencies, fetchCurrencies, isLoading, error };
}

/**
 * Hook for fetching orderbook fees
 */
export function useOrderbookFees() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fees, setFees] = useState<Array<{
    recipient: string;
    basisPoints: number;
    feeType: string;
  }>>([]);

  const fetchFees = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getOrderbookFees();
      setFees(result.marketplaceFees || []);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch fees';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { fees, fetchFees, isLoading, error };
}
