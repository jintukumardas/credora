'use client';

import { Header } from '@/components/Header';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Search, TrendingUp, Filter, ShoppingCart, Tag, ExternalLink } from 'lucide-react';
import { fetchTrendingDomains, fetchListings, DomaName, DomaListing } from '@/lib/doma-api';
import Link from 'next/link';

export default function MarketplacePage() {
  const [trendingDomains, setTrendingDomains] = useState<DomaName[]>([]);
  const [listings, setListings] = useState<DomaListing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trending' | 'listings'>('trending');

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const loadMarketplaceData = async () => {
    setLoading(true);
    try {
      const [trending, marketListings] = await Promise.all([
        fetchTrendingDomains(20),
        fetchListings(20),
      ]);
      setTrendingDomains(trending);
      setListings(marketListings);
    } catch (error) {
      console.error('Error loading marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDomains = trendingDomains.filter((domain) =>
    domain.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredListings = listings.filter((listing) =>
    listing.token?.name?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <h1 className="text-4xl font-bold mb-2">Domain Marketplace</h1>
            <p className="text-gray-400">
              Discover, trade, and invest in tokenized domains
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
                placeholder="Search domains..."
                className="w-full bg-[var(--card-bg)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-3 text-white"
              />
            </div>
            <button className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-6 py-3 flex items-center gap-2 hover:bg-[var(--background)]">
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-[var(--border)]">
            <button
              onClick={() => setActiveTab('trending')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'trending'
                  ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trending Domains
              </div>
            </button>
            <button
              onClick={() => setActiveTab('listings')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'listings'
                  ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Buy Now Listings
              </div>
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 mt-4">Loading marketplace...</p>
            </div>
          )}

          {/* Trending Domains */}
          {!loading && activeTab === 'trending' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDomains.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-400">
                  No domains found
                </div>
              ) : (
                filteredDomains.map((domain) => (
                  <DomainCard key={domain.id} domain={domain} />
                ))
              )}
            </div>
          )}

          {/* Listings */}
          {!loading && activeTab === 'listings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-400">
                  No listings available
                </div>
              ) : (
                filteredListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))
              )}
            </div>
          )}
        </motion.div>
      </main>
    </>
  );
}

function DomainCard({ domain }: { domain: DomaName }) {
  const token = domain.tokens?.[0];
  const expiresAt = domain.expiresAt ? new Date(domain.expiresAt) : null;
  const isExpiringSoon = expiresAt && expiresAt.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--primary)] transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1 truncate">{domain.name}</h3>
          <p className="text-sm text-gray-400">
            {domain.network?.name || 'Unknown Network'}
          </p>
        </div>
        {isExpiringSoon && (
          <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-1 rounded">
            Expiring Soon
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {token && (
          <div className="text-sm">
            <span className="text-gray-400">Token ID:</span>{' '}
            <span className="font-mono">{token.tokenId}</span>
          </div>
        )}
        {expiresAt && (
          <div className="text-sm">
            <span className="text-gray-400">Expires:</span>{' '}
            <span>{expiresAt.toLocaleDateString()}</span>
          </div>
        )}
        {domain.registrar && (
          <div className="text-sm">
            <span className="text-gray-400">Registrar:</span>{' '}
            <span>{domain.registrar.name}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Link
          href={`/marketplace/${encodeURIComponent(domain.name)}`}
          className="flex-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-2 rounded-lg font-medium hover:opacity-90 transition-opacity text-center"
        >
          View Details
        </Link>
        <button className="bg-[var(--background)] border border-[var(--border)] px-4 py-2 rounded-lg hover:bg-[var(--card-bg)]">
          <Tag className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function ListingCard({ listing }: { listing: DomaListing }) {
  const domainName = listing.token?.name?.name || 'Unknown Domain';
  const price = parseFloat(listing.price || '0');

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--primary)] transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1 truncate">{domainName}</h3>
          <p className="text-sm text-gray-400">
            Listed by {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
          </p>
        </div>
        <span className="bg-green-500/10 text-green-500 text-xs px-2 py-1 rounded">
          {listing.status}
        </span>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-1">Price</div>
        <div className="text-2xl font-bold text-[var(--primary)]">
          {price > 0 ? `$${price.toFixed(2)}` : 'Make Offer'}
        </div>
        <div className="text-xs text-gray-500">{listing.currency || 'USDC'}</div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="text-sm">
          <span className="text-gray-400">Token ID:</span>{' '}
          <span className="font-mono">{listing.token?.tokenId}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-400">Listed:</span>{' '}
          <span>{new Date(listing.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/marketplace/${encodeURIComponent(domainName)}`}
          className="flex-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-2 rounded-lg font-medium hover:opacity-90 transition-opacity text-center"
        >
          Buy Now
        </Link>
        <button className="bg-[var(--background)] border border-[var(--border)] px-4 py-2 rounded-lg hover:bg-[var(--card-bg)]">
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
