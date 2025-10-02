'use client';

import { Header } from '@/components/Header';
import { DomainCard } from '@/components/DomainCard';
import { DomaResources } from '@/components/DomaResources';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { fetchDomainsByOwner, DomainToken } from '@/lib/doma-client';
import { Wallet, TrendingUp, Globe, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [domains, setDomains] = useState<DomainToken[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) {
      setLoading(true);
      fetchDomainsByOwner(address)
        .then(setDomains)
        .finally(() => setLoading(false));
    }
  }, [address]);

  const handleBorrow = (domain: DomainToken) => {
    sessionStorage.setItem('selectedDomain', JSON.stringify(domain));
    router.push('/lending');
  };

  const handleLease = (domain: DomainToken) => {
    sessionStorage.setItem('selectedDomain', JSON.stringify(domain));
    router.push('/leasing');
  };

  const totalValue = domains.reduce((sum) => sum + 1000, 0); // Simplified
  const activeLoans = 0;
  const activeLeases = 0; // Will be updated when fractional tokens are implemented

  return (
    <>
      <Header />
      <main className="min-h-screen container mx-auto px-4 py-8">
        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400">Connect your wallet to view your domains and manage DeFi operations</p>
          </motion.div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <Globe className="w-5 h-5 text-[var(--primary)]" />
                  <span className="text-2xl font-bold">{domains.length}</span>
                </div>
                <div className="text-sm text-gray-400">Total Domains</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-2xl font-bold">${totalValue.toLocaleString()}</span>
                </div>
                <div className="text-sm text-gray-400">Portfolio Value</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span className="text-2xl font-bold">{activeLoans}</span>
                </div>
                <div className="text-sm text-gray-400">Active Loans</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <Globe className="w-5 h-5 text-purple-400" />
                  <span className="text-2xl font-bold">{activeLeases}</span>
                </div>
                <div className="text-sm text-gray-400">Active Leases</div>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Link
                href="/lending"
                className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white p-4 rounded-lg hover:opacity-90 transition-opacity text-center font-medium"
              >
                Borrow Against Domain
              </Link>
              <Link
                href="/leasing"
                className="bg-[var(--card-bg)] border border-[var(--border)] text-white p-4 rounded-lg hover:border-[var(--primary)] transition-colors text-center font-medium"
              >
                Lease Domain Rights
              </Link>
              <Link
                href="/revenue"
                className="bg-[var(--card-bg)] border border-[var(--border)] text-white p-4 rounded-lg hover:border-[var(--primary)] transition-colors text-center font-medium"
              >
                Manage Revenue
              </Link>
            </div>

            {/* Doma Resources */}
            <div className="mb-8">
              <DomaResources />
            </div>

            {/* Domain List */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-6">Your Domains</h2>
              {loading ? (
                <div className="text-center py-12 text-gray-400">Loading domains...</div>
              ) : domains.length === 0 ? (
                <div className="text-center py-12">
                  <Globe className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <h3 className="text-xl font-semibold mb-2">No Domains Found</h3>
                  <p className="text-gray-400 mb-4">
                    Tokenize your domains on Doma Protocol to get started
                  </p>
                  <a
                    href="https://docs.doma.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-[var(--primary)] text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Learn How to Tokenize
                  </a>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {domains.map((domain) => (
                    <DomainCard
                      key={domain.id}
                      domain={domain}
                      onBorrow={() => handleBorrow(domain)}
                      onLease={() => handleLease(domain)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
