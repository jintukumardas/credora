'use client';

import { Header } from '@/components/Header';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Search, Filter, Sparkles, Coins } from 'lucide-react';
import { aiTrendingService, TrendingDomain } from '@/lib/ai-trending-service';
import { useAppStore } from '@/lib/store';
import Link from 'next/link';

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiTrendingDomains, setAiTrendingDomains] = useState<TrendingDomain[]>([]);
  const [marketInsights, setMarketInsights] = useState<{
    hotCategories: string[];
    risingKeywords: string[];
    priceMovers: { domain: string; change: number }[];
    marketSentiment: 'bullish' | 'bearish' | 'neutral';
    insights: string[];
  } | null>(null);
  const { addNotification } = useAppStore();

  // Fetch AI-powered trending domains and market insights
  useEffect(() => {
    const fetchTrendingData = async () => {
      setLoading(true);
      try {
        // Fetch trending domains using AI
        const trending = await aiTrendingService.getTrendingDomains(10);
        setAiTrendingDomains(trending);

        // Fetch market insights
        const insights = await aiTrendingService.getMarketInsights();
        setMarketInsights(insights);

        // Add notification for market update
        addNotification({
          type: 'info',
          title: 'Market Data Updated',
          message: `Market sentiment: ${insights.marketSentiment}`,
        });
      } catch (error) {
        console.error('Failed to fetch trending data:', error);
        // Use fallback data if AI fails
        const fallbackData = [
          { name: 'crypto', tld: 'xyz', price: 5000, change: 12.5, volume24h: 75000, category: 'Crypto', aiScore: 85, reason: 'High demand' },
          { name: 'defi', tld: 'io', price: 3500, change: 8.3, volume24h: 52000, category: 'DeFi', aiScore: 78, reason: 'DeFi growth' },
          { name: 'nft', tld: 'eth', price: 4200, change: -3.2, volume24h: 63000, category: 'NFT', aiScore: 72, reason: 'NFT market activity' },
          { name: 'meta', tld: 'com', price: 15000, change: 25.7, volume24h: 225000, category: 'Tech', aiScore: 95, reason: 'Metaverse boom' },
          { name: 'web3', tld: 'dao', price: 2800, change: 5.1, volume24h: 42000, category: 'Web3', aiScore: 69, reason: 'Web3 adoption' },
        ];
        setAiTrendingDomains(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingData();
    // Refresh trending data every 5 minutes
    const interval = setInterval(fetchTrendingData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredDomains = aiTrendingDomains.filter((domain) =>
    domain.name.toLowerCase().includes(searchTerm.toLowerCase())
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Domain Marketplace</h1>
                <p className="text-gray-400">
                  Discover, trade, and invest in tokenized domains
                </p>
              </div>
              <Link
                href="/marketplace/fractionalized"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Coins className="w-5 h-5" />
                Fractionalized Domains
              </Link>
            </div>
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

          {/* AI-Powered Trending Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[var(--primary)]" />
              AI-Powered Trending Domains
            </h2>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 mt-4">Loading marketplace...</p>
            </div>
          )}

          {/* AI-Powered Trending Domains */}
          {!loading && (
            <div>
              {marketInsights && (
                <div className="mb-6 flex items-center gap-4">
                  <h3 className="text-xl font-semibold">Market Sentiment:</h3>
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    marketInsights.marketSentiment === 'bullish' ? 'bg-green-500/20 text-green-400' :
                    marketInsights.marketSentiment === 'bearish' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {marketInsights.marketSentiment} market
                  </span>
                </div>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                {filteredDomains.map((domain, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--primary)] transition-all hover:shadow-lg cursor-pointer group"
                    onClick={() => {
                      // Redirect to Interstellar search with domain
                      const domainName = `${domain.name}.${domain.tld}`;
                      window.open(`https://testnet.interstellar.xyz/search?query=${encodeURIComponent(domainName)}&partner=com&type=web2`, '_blank');
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">#{index + 1}</span>
                        <div className="w-12 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-full"
                             style={{ width: `${(domain.aiScore / 100) * 48}px` }} />
                        <span className="text-xs text-[var(--primary)]">{domain.aiScore}</span>
                      </div>
                      <span className={`text-sm font-medium ${domain.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {domain.change > 0 ? '+' : ''}{domain.change}%
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{domain.name}.{domain.tld}</h3>
                    <p className="text-xl font-bold text-[var(--primary)] mb-2">${domain.price.toLocaleString()}</p>
                    <div className="text-xs text-gray-400 mb-2">
                      Vol: ${(domain.volume24h / 1000).toFixed(0)}k
                    </div>
                    <p className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors line-clamp-2">
                      {domain.reason}
                    </p>
                    <span className="inline-block mt-2 text-xs px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded">
                      {domain.category}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Market Insights */}
              {marketInsights && (
                <div className="mt-6 grid md:grid-cols-3 gap-4">
                  <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4">
                    <h4 className="text-sm text-gray-400 mb-2">Hot Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {marketInsights.hotCategories?.map((cat: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4">
                    <h4 className="text-sm text-gray-400 mb-2">Rising Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {marketInsights.risingKeywords?.map((kw: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-4">
                    <h4 className="text-sm text-gray-400 mb-2">Market Insight</h4>
                    <p className="text-xs text-gray-300">
                      {marketInsights.insights?.[0]}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </>
  );
}
