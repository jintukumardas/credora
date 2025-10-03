'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  TrendingUp,
  Clock,
  DollarSign,
  BarChart3,
  ShoppingCart,
  Eye,
  MessageCircle
} from 'lucide-react';
import { domainService, Domain, DomainValuation } from '@/lib/domain-service';
import toast from 'react-hot-toast';

interface MarketplaceProps {
  initialDomains?: Domain[];
}

interface OrderBook {
  bids: Array<{ price: bigint; amount: number; trader: string }>;
  asks: Array<{ price: bigint; amount: number; trader: string }>;
}

export function DomainMarketplace({ initialDomains = [] }: MarketplaceProps) {
  const { address, isConnected } = useAccount();
  const [domains, setDomains] = useState<Domain[]>(initialDomains);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    tld: 'all',
    sortBy: 'value' as const,
  });
  const [orderBook, setOrderBook] = useState<OrderBook>({ bids: [], asks: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Real-time price updates
  useEffect(() => {
    const unsubscribe = domainService.subscribeToEvents((event) => {
      if (event.type === 'listed' || event.type === 'sold') {
        refreshDomains();
      }
    });

    return unsubscribe;
  }, []);

  // Search and filter domains
  const searchDomains = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await domainService.searchDomains({
        query: searchQuery,
        minValue: filters.minPrice ? parseEther(filters.minPrice) : undefined,
        maxValue: filters.maxPrice ? parseEther(filters.maxPrice) : undefined,
        tld: filters.tld === 'all' ? undefined : filters.tld,
        sortBy: filters.sortBy,
      });
      setDomains(results);
    } catch (error) {
      toast.error('Failed to search domains');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filters]);

  // Refresh domain list
  const refreshDomains = async () => {
    await searchDomains();
  };

  // Handle domain purchase
  const handlePurchase = async (domain: Domain) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      toast.loading('Processing purchase...');
      // Contract interaction would go here
      toast.success(`Successfully purchased ${domain.name}.${domain.tld}`);
      refreshDomains();
    } catch (error) {
      toast.error('Purchase failed');
      console.error(error);
    }
  };

  // Handle placing an order
  const handlePlaceOrder = async (
    domainId: string,
    orderType: 'buy' | 'sell',
    price: string,
    amount: number
  ) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      toast.loading(`Placing ${orderType} order...`);
      // Contract interaction would go here
      toast.success(`${orderType} order placed successfully`);
      // Update orderbook
      await fetchOrderBook(domainId);
    } catch (error) {
      toast.error('Failed to place order');
      console.error(error);
    }
  };

  // Fetch orderbook for a domain
  const fetchOrderBook = async (domainId: string) => {
    // Mock orderbook data
    setOrderBook({
      bids: [
        { price: parseEther('1.5'), amount: 100, trader: '0x123...' },
        { price: parseEther('1.4'), amount: 200, trader: '0x456...' },
      ],
      asks: [
        { price: parseEther('1.6'), amount: 150, trader: '0x789...' },
        { price: parseEther('1.7'), amount: 100, trader: '0xabc...' },
      ],
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Domain Marketplace
          </h1>
          <p className="text-gray-400">
            Discover, trade, and invest in premium domains
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search domains..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchDomains()}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={filters.tld}
                onChange={(e) => setFilters({ ...filters, tld: e.target.value })}
                className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">All TLDs</option>
                <option value="com">.com</option>
                <option value="io">.io</option>
                <option value="xyz">.xyz</option>
                <option value="eth">.eth</option>
              </select>

              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="value">Price</option>
                <option value="name">Name</option>
                <option value="expiry">Expiry</option>
              </select>

              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
              >
                {viewMode === 'grid' ? 'List' : 'Grid'}
              </button>
            </div>
          </div>

          {/* Price Range */}
          <div className="flex gap-4 mt-4">
            <input
              type="number"
              placeholder="Min Price (ETH)"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
            <input
              type="number"
              placeholder="Max Price (ETH)"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={searchDomains}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Volume</p>
                <p className="text-2xl font-bold text-white">1,234 ETH</p>
              </div>
              <TrendingUp className="text-green-500" />
            </div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Listed Domains</p>
                <p className="text-2xl font-bold text-white">{domains.length}</p>
              </div>
              <BarChart3 className="text-purple-500" />
            </div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Price</p>
                <p className="text-2xl font-bold text-white">2.5 ETH</p>
              </div>
              <DollarSign className="text-yellow-500" />
            </div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">24h Change</p>
                <p className="text-2xl font-bold text-green-500">+12.5%</p>
              </div>
              <Clock className="text-blue-500" />
            </div>
          </div>
        </div>

        {/* Domain List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <AnimatePresence>
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
            }>
              {domains.map((domain) => (
                <motion.div
                  key={domain.tokenId}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={viewMode === 'grid'
                    ? 'bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all cursor-pointer'
                    : 'bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all cursor-pointer flex justify-between items-center'
                  }
                  onClick={() => setSelectedDomain(domain)}
                >
                  <div className={viewMode === 'list' ? 'flex items-center gap-6 flex-1' : ''}>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {domain.name}.{domain.tld}
                      </h3>
                      <p className="text-gray-400 text-sm mb-3">
                        Confidence: {domain.confidence}%
                      </p>
                    </div>

                    {viewMode === 'grid' && (
                      <>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-2xl font-bold text-purple-400">
                            {formatEther(domain.valuation)} ETH
                          </span>
                          {domain.isPremium && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded text-xs">
                              Premium
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm transition-colors">
                            Buy Now
                          </button>
                          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors">
                            <Eye size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {viewMode === 'list' && (
                    <div className="flex items-center gap-6">
                      <span className="text-2xl font-bold text-purple-400">
                        {formatEther(domain.valuation)} ETH
                      </span>
                      {domain.isPremium && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded text-xs">
                          Premium
                        </span>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchase(domain);
                          }}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm transition-colors"
                        >
                          Buy Now
                        </button>
                        <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors">
                          <ShoppingCart size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}