'use client';

import { motion } from 'framer-motion';
import { Globe, Calendar, TrendingUp } from 'lucide-react';
import { DomainToken } from '@/lib/doma-client';
import { formatExpirationDate, daysUntilExpiration, estimateDomainValue } from '@/lib/doma-client';

interface DomainCardProps {
  domain: DomainToken;
  onBorrow?: (domain: DomainToken) => void;
  onLease?: (domain: DomainToken) => void;
}

export function DomainCard({ domain, onBorrow, onLease }: DomainCardProps) {
  const daysLeft = domain.expirationDate ? daysUntilExpiration(domain.expirationDate) : 365;
  const estimatedValue = estimateDomainValue(domain);

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
            <p className="text-sm text-gray-400">Token</p>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-4 font-mono break-all">
        #{domain.tokenId || 'N/A'}
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
            <TrendingUp className="w-4 h-4" />
            Est. Value
          </span>
          <span className="text-white font-medium">${estimatedValue.toLocaleString()}</span>
        </div>

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
