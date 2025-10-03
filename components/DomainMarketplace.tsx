'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  TrendingUp,
  Clock,
  DollarSign,
  BarChart3,
  ShoppingCart,
  Eye
} from 'lucide-react';
import { domainService, Domain } from '@/lib/domain-service';
import {
  createDomainListing,
  buyDomainListing,
  createDomainOffer
} from '@/lib/orderbook-service';
import { useWalletClient } from 'wagmi';
import toast from 'react-hot-toast';

interface MarketplaceProps {
  initialDomains?: Domain[];
}

export function DomainMarketplace({ initialDomains = [] }: MarketplaceProps) {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [domains, setDomains] = useState<Domain[]>(initialDomains);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{
    minPrice: string;
    maxPrice: string;
    tld: string;
    sortBy: 'value' | 'name' | 'expiry';
  }>({
    minPrice: '',
    maxPrice: '',
    tld: 'all',
    sortBy: 'value',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showListingModal, setShowListingModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [listingPrice, setListingPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');

  // Real-time price updates
  useEffect(() => {
    const unsubscribe = domainService.subscribeToEvents((event) => {
      if (event.type === 'listed' || event.type === 'sold') {
        refreshDomains();
      }
    });

    return unsubscribe;
  }, [refreshDomains]);

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
  const refreshDomains = useCallback(async () => {
    await searchDomains();
  }, [searchDomains]);

  // Handle domain purchase through orderbook
  const handlePurchase = async (domain: Domain, orderId?: string) => {
    if (!isConnected || !walletClient) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const toastId = toast.loading('Processing purchase...');

      if (orderId) {
        // Buy existing listing
        const result = await buyDomainListing({
          walletClient,
          orderId,
        });

        toast.dismiss(toastId);
        toast.success(`Successfully purchased ${domain.name}.${domain.tld}! TX: ${result.transactionHash?.slice(0, 10)}...`);
      } else {
        // Create offer if no listing exists
        setSelectedDomain(domain);
        setShowOfferModal(true);
        toast.dismiss(toastId);
        return;
      }

      refreshDomains();
    } catch (error) {
      toast.error('Purchase failed: ' + (error as Error).message);
      console.error(error);
    }
  };

  // Create domain listing
  const handleCreateListing = async (domain: Domain) => {
    if (!isConnected || !walletClient) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!listingPrice || parseFloat(listingPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      const toastId = toast.loading(`Creating listing for ${domain.name}.${domain.tld}...`);

      const result = await createDomainListing({
        walletClient,
        tokenId: domain.tokenId,
        contract: '0x424bDf2E8a6F52Bd2c1C81D9437b0DC0309DF90f', // Doma Ownership Token contract
        price: listingPrice,
        duration: 30 * 86400, // 30 days
      });

      toast.dismiss(toastId);
      toast.success(`Listing created successfully! Order ID: ${result.orderId}`);
      setShowListingModal(false);
      setListingPrice('');
      refreshDomains();
    } catch (error) {
      toast.error('Failed to create listing: ' + (error as Error).message);
      console.error(error);
    }
  };

  // Create domain offer
  const handleCreateOffer = async (domain: Domain) => {
    if (!isConnected || !walletClient) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      toast.error('Please enter a valid offer price');
      return;
    }

    try {
      const toastId = toast.loading(`Creating offer for ${domain.name}.${domain.tld}...`);

      const result = await createDomainOffer({
        walletClient,
        tokenId: domain.tokenId,
        contract: '0x424bDf2E8a6F52Bd2c1C81D9437b0DC0309DF90f',
        price: offerPrice,
        duration: 7 * 86400, // 7 days
      });

      toast.dismiss(toastId);
      toast.success(`Offer created successfully! Order ID: ${result.orderId}`);
      setShowOfferModal(false);
      setOfferPrice('');
    } catch (error) {
      toast.error('Failed to create offer: ' + (error as Error).message);
      console.error(error);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
      {/* Listing Modal */}
      {showListingModal && selectedDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowListingModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-white mb-4">List Domain for Sale</h2>
            <div className="mb-4">
              <p className="text-gray-400 mb-2">Domain:</p>
              <p className="text-xl font-semibold text-white">{selectedDomain.name}.{selectedDomain.tld}</p>
            </div>
            <div className="mb-6">
              <label className="block text-gray-400 mb-2">Listing Price (ETH)</label>
              <input
                type="number"
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => handleCreateListing(selectedDomain)}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
              >
                Create Listing
              </button>
              <button
                onClick={() => setShowListingModal(false)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Offer Modal */}
      {showOfferModal && selectedDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowOfferModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-white mb-4">Make an Offer</h2>
            <div className="mb-4">
              <p className="text-gray-400 mb-2">Domain:</p>
              <p className="text-xl font-semibold text-white">{selectedDomain.name}.{selectedDomain.tld}</p>
              <p className="text-sm text-gray-400 mt-1">Listed for: {formatEther(selectedDomain.valuation)} ETH</p>
            </div>
            <div className="mb-6">
              <label className="block text-gray-400 mb-2">Your Offer (ETH)</label>
              <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => handleCreateOffer(selectedDomain)}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
              >
                Submit Offer
              </button>
              <button
                onClick={() => setShowOfferModal(false)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Domain Marketplace
            </h1>
            <p className="text-gray-400">
              Discover, trade, and invest in premium domains
            </p>
          </div>
          <button
            onClick={() => {
              if (!isConnected) {
                toast.error('Please connect your wallet');
                return;
              }
              // Open a modal to select user's domain
              toast('Select a domain from your portfolio to list', { icon: '📝' });
              // In production, you'd show a modal with user's domains
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-medium transition-colors"
          >
            Sell Your Domain
          </button>
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
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as 'value' | 'name' | 'expiry' })}
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