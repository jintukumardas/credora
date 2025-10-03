'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';
import { useBuyout, useBuyoutPrice, formatUsdc } from '@/lib/fractionalization-hooks';
import { toast } from 'react-hot-toast';

interface BuyoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: string;
  domainName: string;
}

export function BuyoutModal({
  isOpen,
  onClose,
  tokenId,
  domainName,
}: BuyoutModalProps) {
  const { buyout, isLoading: isBuyingOut, error: buyoutError } = useBuyout();
  const { price, isLoading: isPriceLoading, fetchPrice } = useBuyoutPrice(tokenId);

  useEffect(() => {
    if (isOpen && tokenId) {
      fetchPrice();
    }
  }, [isOpen, tokenId]);

  const handleBuyout = async () => {
    try {
      const result = await buyout(tokenId);
      toast.success('Domain bought out successfully!');
      onClose();
    } catch (err) {
      toast.error('Failed to buy out domain');
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const buyoutPriceUsdc = price ? formatUsdc(price.buyoutPrice) : '0';
  const minimumBuyoutPriceUsdc = price ? formatUsdc(price.minimumBuyoutPrice) : '0';
  const fdmcUsdc = price ? formatUsdc(price.fullyDilutedMarketCap) : '0';

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
            <h2 className="text-2xl font-bold">Buy Out Domain</h2>
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

          {/* Price Loading */}
          {isPriceLoading && (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 mt-4">Loading buyout price...</p>
            </div>
          )}

          {/* Price Information */}
          {!isPriceLoading && price && (
            <>
              {/* Buyout Price */}
              <div className="bg-gradient-to-r from-[var(--primary)]/10 to-[var(--secondary)]/10 border border-[var(--primary)]/20 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[var(--primary)]" />
                    <span className="text-sm text-gray-400">Buyout Price</span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[var(--primary)]">
                      ${parseFloat(buyoutPriceUsdc).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">USDC</p>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Minimum Buyout Price</span>
                  <span className="font-medium">${parseFloat(minimumBuyoutPriceUsdc).toFixed(2)} USDC</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    Fully Diluted Market Cap
                  </span>
                  <span className="font-medium">${parseFloat(fdmcUsdc).toFixed(2)} USDC</span>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p className="font-medium text-blue-400 mb-1">Buyout Details:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• You will pay the buyout price to reclaim the full domain</li>
                      <li>• All fractional token holders will be compensated</li>
                      <li>• You will receive the complete ownership of the NFT</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Error */}
          {buyoutError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-400">{buyoutError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isBuyingOut}
              className="flex-1 bg-[var(--background)] border border-[var(--border)] py-3 rounded-lg font-medium hover:bg-[var(--card-bg)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBuyout}
              disabled={isBuyingOut || isPriceLoading || !price}
              className="flex-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isBuyingOut ? 'Processing...' : `Buy Out for $${parseFloat(buyoutPriceUsdc).toFixed(2)}`}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
