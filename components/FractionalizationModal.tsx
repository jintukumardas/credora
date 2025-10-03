'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Coins, AlertCircle } from 'lucide-react';
import { useFractionalize } from '@/lib/fractionalization-hooks';
import { toast } from 'react-hot-toast';

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

  const { fractionalize, isLoading, error } = useFractionalize();

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

      const result = await fractionalize(tokenId, {
        name: tokenName,
        symbol: tokenSymbol,
      }, minimumBuyoutPrice);

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
              disabled={isLoading}
              className="flex-1 bg-[var(--background)] border border-[var(--border)] py-3 rounded-lg font-medium hover:bg-[var(--card-bg)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleFractionalize}
              disabled={isLoading || !tokenName || !tokenSymbol || !minimumBuyoutPrice}
              className="flex-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Fractionalize'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
