/**
 * React hooks for Doma Fractionalization
 * Wagmi-based hooks for interacting with fractionalization smart contract
 */

'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, parseUnits } from 'viem';
import { CONTRACT_ADDRESSES } from './contract-addresses';
import DomaFractionalizationABI from './abis/DomaFractionalization.json';

/**
 * Hook for fractionalizing a domain NFT
 */
export function useFractionalize() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const fractionalize = async (
    tokenId: string,
    tokenInfo: { name: string; symbol: string },
    minimumBuyoutPriceUsdc: string
  ) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert USDC to base units (6 decimals)
      const minimumBuyoutPrice = parseUnits(minimumBuyoutPriceUsdc, 6);

      // Call contract
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.DomaFractionalization as `0x${string}`,
        abi: DomaFractionalizationABI,
        functionName: 'fractionalizeOwnershipToken',
        args: [
          BigInt(tokenId),
          {
            name: tokenInfo.name,
            symbol: tokenInfo.symbol,
          },
          minimumBuyoutPrice,
        ],
      });

      return { transactionHash: hash };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fractionalization failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { fractionalize, isLoading, error };
}

/**
 * Hook for buying out a fractionalized domain
 */
export function useBuyout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const buyout = async (tokenId: string) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call contract
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.DomaFractionalization as `0x${string}`,
        abi: DomaFractionalizationABI,
        functionName: 'buyoutOwnershipToken',
        args: [BigInt(tokenId)],
      });

      return { transactionHash: hash, success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Buyout failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { buyout, isLoading, error };
}

/**
 * Hook for exchanging fractional tokens
 */
export function useExchangeFractionalToken() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const exchange = async (fractionalToken: string, amountTokens: string) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert tokens to base units (18 decimals for ERC-20)
      const amount = parseEther(amountTokens);

      // Call contract
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.DomaFractionalization as `0x${string}`,
        abi: DomaFractionalizationABI,
        functionName: 'exchangeFractionalToken',
        args: [fractionalToken as `0x${string}`, amount],
      });

      return { transactionHash: hash, amount: amountTokens };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Exchange failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { exchange, isLoading, error };
}

/**
 * Hook for fetching buyout price from smart contract
 */
export function useBuyoutPrice(tokenId: string | null) {
  const { data: buyoutPrice, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.DomaFractionalization as `0x${string}`,
    abi: DomaFractionalizationABI,
    functionName: 'getOwnershipTokenBuyoutPrice',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: !!tokenId,
    },
  });

  const price = buyoutPrice ? {
    tokenId: tokenId || '',
    buyoutPrice: buyoutPrice.toString(),
    minimumBuyoutPrice: '0', // Would need additional contract call if stored separately
    fullyDilutedMarketCap: '0', // Would need calculation from token supply and price
  } : null;

  return {
    price,
    isLoading,
    error: error ? error.message : null,
    fetchPrice: refetch,
  };
}

/**
 * Hook for tracking fractionalized domains via events (simplified version)
 */
export function useFractionalizedDomains(take: number = 20, skip: number = 0) {
  const [domains, setDomains] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDomains = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, you would:
      // 1. Query events from the contract (NameTokenFractionalized)
      // 2. Or use a subgraph/indexer to get fractionalized domains
      // For now, return mock data
      const mockDomains = generateMockFractionalizedDomains(take);
      setDomains(mockDomains);
      return mockDomains;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch domains';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { domains, isLoading, error, fetchDomains };
}

/**
 * Generate mock fractionalized domains for development
 * In production, this would query events or a subgraph
 */
function generateMockFractionalizedDomains(count: number): any[] {
  const mockDomains: any[] = [];

  for (let i = 0; i < Math.min(count, 5); i++) {
    mockDomains.push({
      tokenId: `${100 + i}`,
      fractionalToken: `0x${Math.random().toString(16).slice(2, 42).padStart(40, '0')}`,
      totalSupply: (1000000 * 1e18).toString(),
      minimumBuyoutPrice: parseUnits((2000 + i * 500).toString(), 6).toString(), // USDC has 6 decimals
      currentBuyoutPrice: parseUnits((2500 + i * 500).toString(), 6).toString(),
      owner: `0x${Math.random().toString(16).slice(2, 42).padStart(40, '0')}`,
    });
  }

  return mockDomains;
}

/**
 * Utility function to format wei to ETH
 */
export function formatWeiToEth(wei: string): string {
  try {
    return formatEther(BigInt(wei));
  } catch {
    return '0';
  }
}

/**
 * Utility function to format USDC base units to readable format
 */
export function formatUsdc(amount: string): string {
  try {
    // USDC has 6 decimals
    const value = BigInt(amount);
    const divisor = BigInt(1000000);
    const whole = value / divisor;
    const fraction = value % divisor;
    return `${whole}.${fraction.toString().padStart(6, '0')}`;
  } catch {
    return '0';
  }
}

/**
 * Utility function to parse ETH to wei
 */
export function parseEthToWei(eth: string): string {
  try {
    return parseEther(eth).toString();
  } catch {
    return '0';
  }
}
