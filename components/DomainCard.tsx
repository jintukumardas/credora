'use client';

import { motion } from 'framer-motion';
import { Globe, Calendar, TrendingUp, CheckCircle, DollarSign, Link2, Tag } from 'lucide-react';
import { DomainToken } from '@/lib/doma-client';
import { formatExpirationDate, daysUntilExpiration, estimateDomainValue } from '@/lib/doma-client';

interface DomainCardProps {
  domain: DomainToken;
  onBorrow?: (domain: DomainToken) => void;
  onLease?: (domain: DomainToken) => void;
}

export function DomainCard({ domain, onBorrow, onLease }: DomainCardProps) {
  const daysLeft = domain.expirationDate ? daysUntilExpiration(domain.expirationDate) : 365;
  const estimatedValue = domain.price ? domain.price : estimateDomainValue(domain);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--primary)] transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{domain.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {domain.tokenized && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                  <CheckCircle className="w-3 h-3" />
                  Tokenized
                </span>
              )}
              {domain.listing?.status && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                  <Tag className="w-3 h-3" />
                  Listed
                </span>
              )}
            </div>
          </div>
        </div>
        {domain.chain && (
          <div className="text-xs text-gray-500">
            <Link2 className="w-3 h-3 inline mr-1" />
            {domain.chain.name}
          </div>
        )}
      </div>

      <div className="space-y-1 mb-4">
        <div className="text-xs text-gray-500 font-mono break-all">
          Token: #{domain.tokenId ? `${domain.tokenId.slice(0, 8)}...${domain.tokenId.slice(-6)}` : 'N/A'}
        </div>
        {domain.tokenizationTX && (
          <div className="text-xs text-gray-500">
            TX:
            <a
              href={`https://explorer-testnet.doma.xyz/tx/${domain.tokenizationTX}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary)] hover:underline ml-1"
            >
              {domain.tokenizationTX.slice(0, 8)}...{domain.tokenizationTX.slice(-6)}
            </a>
          </div>
        )}
      </div>

      <div className="space-y-3 mb-4">
        {domain.expirationDate && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Expires
              </span>
              <span className="text-white font-medium">
                {formatExpirationDate(domain.expirationDate)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Days Left</span>
              <span
                className={`font-medium ${
                  daysLeft < 30 ? 'text-red-400' : daysLeft < 90 ? 'text-yellow-400' : 'text-green-400'
                }`}
              >
                {daysLeft} days
              </span>
            </div>
          </>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            {domain.price ? 'Price' : 'Est. Value'}
          </span>
          <span className="text-white font-medium">${estimatedValue.toLocaleString()}</span>
        </div>

        {domain.listing?.fixedPrice && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Listed Price</span>
            <span className="text-[var(--primary)] font-medium">
              ${domain.listing.fixedPrice.toLocaleString()}
            </span>
          </div>
        )}

        {domain.highestOffer?.price && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Best Offer</span>
            <span className="text-green-400 font-medium">
              ${domain.highestOffer.price.toLocaleString()}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Owner</span>
          <span className="text-white font-mono text-xs">
            {(() => {
              // Extract address from CAIP-10 format (eip155:1:0x...) or use as-is
              const addr = domain.owner.includes(':')
                ? domain.owner.split(':').pop() || domain.owner
                : domain.owner;
              return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
            })()}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {onBorrow && (
          <button
            onClick={() => onBorrow(domain)}
            className="flex-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
          >
            Borrow
          </button>
        )}
        {onLease && (
          <button
            onClick={() => onLease(domain)}
            className="flex-1 bg-[var(--border)] text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Lease Rights
          </button>
        )}
      </div>
    </motion.div>
  );
}
