'use client';

import { Header } from '@/components/Header';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Search, Filter, Coins, Users, DollarSign } from 'lucide-react';
import { useFractionalizedDomains } from '@/lib/fractionalization-hooks';
import { useAppStore } from '@/lib/store';
import { useExchangeFractionalToken } from '@/lib/fractionalization-hooks';
import toast from 'react-hot-toast';

export default function FractionalizedMarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { domains: fractionalizedDomains, fetchDomains, isLoading } = useFractionalizedDomains(20);
  const { addNotification } = useAppStore();
  const { exchange, isLoading: isExchanging } = useExchangeFractionalToken();
  const [selectedDomain, setSelectedDomain] = useState<any>(null);
  const [buyAmount, setBuyAmount] = useState('');

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const filteredDomains = fractionalizedDomains.filter((domain) =>
    domain.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBuyShares = async (domain: any) => {
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast.error('Please enter a valid amount of shares');
      return;
    }

    const toastId = toast.loading('Processing transaction...');

    try {
      // Use fractionalToken or fractionalTokenAddress property
      const tokenAddress = domain.fractionalTokenAddress || domain.fractionalToken;

      // Validate that we have a valid address (40 hex chars plus 0x prefix = 42 total)
      if (tokenAddress && tokenAddress.length === 42 && tokenAddress.startsWith('0x')) {
        await exchange(tokenAddress, buyAmount);

        // Update available shares in localStorage
        const stored = localStorage.getItem('fractionalized_domains');
        if (stored) {
          const domains = JSON.parse(stored);
          const domainIndex = domains.findIndex((d: any) => d.tokenId === domain.tokenId);
          if (domainIndex !== -1) {
            domains[domainIndex].availableShares -= parseFloat(buyAmount);
            localStorage.setItem('fractionalized_domains', JSON.stringify(domains));
          }
        }

        toast.success(`Successfully purchased ${buyAmount} shares of ${domain.name}!`, { id: toastId });
        setBuyAmount('');
        setSelectedDomain(null);
        fetchDomains(); // Refresh the list
      } else {
        // Mock success for demo
        toast.success(`Demo: Would purchase ${buyAmount} shares of ${domain.name}`, { id: toastId });
      }
    } catch (error) {
      console.error('Error buying shares:', error);
      toast.error('Failed to buy shares', { id: toastId });
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Coins className="w-10 h-10 text-[var(--primary)]" />
              Fractionalized Domains
            </h1>
            <p className="text-gray-400">
              Buy fractional shares of premium domains
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search fractionalized domains..."
                className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-3 text-white"
              />
            </div>
            <button className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-6 py-3 flex items-center gap-2 hover:bg-[var(--background)]">
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 mt-4">Loading fractionalized domains...</p>
            </div>
          )}

          {/* Fractionalized Domains Grid */}
          {!isLoading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDomains.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 max-w-md mx-auto">
                    <p className="text-purple-400 mb-2">No fractionalized domains available yet</p>
                    <p className="text-sm text-gray-400">
                      Check back later or fractionalize your own domains
                    </p>
                  </div>
                </div>
              ) : (
                filteredDomains.map((domain, index) => (
                  <motion.div
                    key={domain.tokenId || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--primary)] transition-all hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1 truncate">{domain.name || `Domain #${domain.tokenId}`}</h3>
                        <p className="text-sm text-gray-400">
                          Total Shares: {domain.totalShares || 1000000}
                        </p>
                      </div>
                      <span className="bg-purple-500/10 text-purple-500 text-xs px-2 py-1 rounded">
                        Fractionalized
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Available
                        </span>
                        <span className="text-white font-medium">
                          {domain.availableShares || 1000000} shares
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400 flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          Price/Share
                        </span>
                        <span className="text-[var(--primary)] font-medium">
                          ${domain.pricePerShare || 0.01}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Market Cap</span>
                        <span className="text-green-400 font-medium">
                          ${((domain.totalShares || 1000000) * (domain.pricePerShare || 0.01)).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {selectedDomain?.tokenId === domain.tokenId ? (
                      <div className="space-y-2">
                        <input
                          type="number"
                          value={buyAmount}
                          onChange={(e) => setBuyAmount(e.target.value)}
                          placeholder="Number of shares"
                          className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-white"
                          min="1"
                          max={domain.availableShares}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleBuyShares(domain)}
                            disabled={isExchanging}
                            className="flex-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            {isExchanging ? 'Processing...' : 'Confirm Buy'}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDomain(null);
                              setBuyAmount('');
                            }}
                            className="px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--card-bg)]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedDomain(domain)}
                        className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                      >
                        Buy Shares
                      </button>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-12 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-3">How Fractionalized Domains Work</h2>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Domain owners can fractionalize their domains into tradeable shares</li>
              <li>• Each share represents partial ownership of the domain</li>
              <li>• Share holders can receive proportional revenue from domain monetization</li>
              <li>• Domains can be bought out at the minimum buyout price set by the owner</li>
              <li>• Trade shares on secondary markets for potential profit</li>
            </ul>
          </div>
        </motion.div>
      </main>
    </>
  );
}