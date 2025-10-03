'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Coins, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { useFractionalize } from '@/lib/fractionalization-hooks';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contract-addresses';
import { toast } from 'react-hot-toast';

// Minimal ERC721 ABI for approve function
const ERC721_ABI = [
  {
    name: 'setApprovalForAll',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
  {
    name: 'isApprovedForAll',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

interface FractionalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: string;
  domainName: string;
}

export function FractionalizationModal({
  isOpen,
  onClose,
  tokenId,
  domainName,
}: FractionalizationModalProps) {
  const [tokenName, setTokenName] = useState(`${domainName} Fraction`);
  const [tokenSymbol, setTokenSymbol] = useState('FRAC');
  const [minimumBuyoutPrice, setMinimumBuyoutPrice] = useState('1000');
  const [totalSupply, setTotalSupply] = useState('1000000');
  const [approvalStep, setApprovalStep] = useState<'idle' | 'approving' | 'approved'>('idle');

  const { address } = useAccount();
  const { fractionalize, isLoading, error } = useFractionalize();
  const { data: approvalHash, writeContract: writeApproval, isPending: isApproving, reset: resetApproval } = useWriteContract();
  const { isLoading: isApprovingConfirm, isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({ hash: approvalHash });

  // Check if operator has approval
  const { data: isApprovedForAll, refetch: refetchApproval } = useReadContract({
    address: CONTRACT_ADDRESSES.DomaOwnershipToken as `0x${string}`,
    abi: ERC721_ABI,
    functionName: 'isApprovedForAll',
    args: address ? [address as `0x${string}`, CONTRACT_ADDRESSES.DomaFractionalization as `0x${string}`] : undefined,
  });

  // Update approval step when approval status changes
  useEffect(() => {
    if (isApprovedForAll === true) {
      setApprovalStep('approved');
    } else if (isApprovedForAll === false) {
      setApprovalStep('idle');
    }
  }, [isApprovedForAll]);

  // Handle approval success
  useEffect(() => {
    if (isApprovalSuccess) {
      setApprovalStep('approved');
      toast.success('NFT approved for fractionalization!');
      refetchApproval();
      resetApproval();
    }
  }, [isApprovalSuccess, refetchApproval, resetApproval]);

  const handleApprove = async () => {
    try {
      setApprovalStep('approving');
      writeApproval({
        address: CONTRACT_ADDRESSES.DomaOwnershipToken as `0x${string}`,
        abi: ERC721_ABI,
        functionName: 'setApprovalForAll',
        args: [CONTRACT_ADDRESSES.DomaFractionalization as `0x${string}`, true],
      });
    } catch (err) {
      console.error('Approval error:', err);
      toast.error('Failed to approve NFT');
      setApprovalStep('idle');
    }
  };

  const handleFractionalize = async () => {
    try {
      // Check if fractionalization contract is deployed
      if (process.env.NEXT_PUBLIC_DOMA_FRACTIONALIZATION === '0x0000000000000000000000000000000000000000' ||
          !process.env.NEXT_PUBLIC_DOMA_FRACTIONALIZATION) {
        toast.error(
          'Fractionalization contract not deployed on testnet yet. Feature coming soon!',
          { duration: 6000 }
        );
        return;
      }

      const result = await fractionalize(
        tokenId,
        {
          name: tokenName,
          symbol: tokenSymbol,
        },
        minimumBuyoutPrice,
        totalSupply
      );

      toast.success('Domain fractionalized successfully!');
      onClose();
    } catch (err) {
      toast.error('Failed to fractionalize domain');
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl max-w-md w-full p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Fractionalize Domain</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--background)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Domain Info */}
          <div className="bg-[var(--background)] rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400 mb-1">Domain</p>
            <p className="text-lg font-semibold">{domainName}</p>
            <p className="text-xs text-gray-500 font-mono mt-1">Token ID: {tokenId}</p>
          </div>

          {/* Form */}
          <div className="space-y-4 mb-6">
            {/* Token Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Coins className="w-4 h-4 inline mr-2" />
                Fractional Token Name
              </label>
              <input
                type="text"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="e.g., Domain Fraction"
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-3 text-white"
              />
            </div>

            {/* Token Symbol */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Token Symbol
              </label>
              <input
                type="text"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., FRAC"
                maxLength={10}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-3 text-white uppercase"
              />
            </div>

            {/* Total Supply */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Coins className="w-4 h-4 inline mr-2" />
                Total Supply
              </label>
              <input
                type="number"
                value={totalSupply}
                onChange={(e) => setTotalSupply(e.target.value)}
                placeholder="1000000"
                step="100000"
                min="1"
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-3 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Total number of fractional tokens to create (you will receive 97.5% after protocol fee)
              </p>
            </div>

            {/* Minimum Buyout Price */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Minimum Buyout Price (USDC)
              </label>
              <input
                type="number"
                value={minimumBuyoutPrice}
                onChange={(e) => setMinimumBuyoutPrice(e.target.value)}
                placeholder="1000"
                step="100"
                min="0"
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-3 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                The minimum price in USDC someone must pay to buy out the entire domain
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="font-medium text-blue-400 mb-1">How it works:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Your domain will be split into tradable fractional tokens</li>
                  <li>• Buyout price = max(Minimum Price, Market Cap)</li>
                  <li>• Anyone can buy out the full domain at that price</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Approval Status */}
          {approvalStep !== 'approved' && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p className="font-medium text-yellow-400 mb-1">Approval Required</p>
                  <p>You need to approve the fractionalization contract to transfer your NFT.</p>
                </div>
              </div>
            </div>
          )}

          {approvalStep === 'approved' && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
              <div className="flex gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p className="font-medium text-green-400">NFT Approved ✓</p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading || isApproving || isApprovingConfirm}
              className="flex-1 bg-[var(--background)] border border-[var(--border)] py-3 rounded-lg font-medium hover:bg-[var(--card-bg)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            {approvalStep !== 'approved' ? (
              <button
                onClick={handleApprove}
                disabled={isApproving || isApprovingConfirm}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Shield className="w-5 h-5 inline mr-2" />
                {isApproving || isApprovingConfirm ? 'Approving...' : 'Approve NFT'}
              </button>
            ) : (
              <button
                onClick={handleFractionalize}
                disabled={isLoading || !tokenName || !tokenSymbol || !minimumBuyoutPrice || !totalSupply}
                className="flex-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Coins className="w-5 h-5 inline mr-2" />
                {isLoading ? 'Processing...' : 'Fractionalize'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
