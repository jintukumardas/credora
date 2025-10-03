'use client';

import { Header } from '@/components/Header';
import { DomainCard } from '@/components/DomainCard';
import { DomaResources } from '@/components/DomaResources';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { fetchDomainsByOwner, DomainToken, estimateDomainValue } from '@/lib/doma-client';
import { Wallet, TrendingUp, Globe, DollarSign, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contract-addresses';
import DomainLendingABI from '@/artifacts/contracts/DomainLending.sol/DomainLending.json';
import { useFractionalizedDomains } from '@/lib/fractionalization-hooks';
import { aiTrendingService, TrendingDomain } from '@/lib/ai-trending-service';
import { useAppStore } from '@/lib/store';

export default function Dashboard() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [domains, setDomains] = useState<DomainToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [trendingDomains, setTrendingDomains] = useState<TrendingDomain[]>([]);
  const [marketInsights, setMarketInsights] = useState<{
    hotCategories: string[];
    risingKeywords: string[];
    priceMovers: { domain: string; change: number }[];
    marketSentiment: 'bullish' | 'bearish' | 'neutral';
    insights: string[];
  } | null>(null);
  const { addNotification } = useAppStore();

  // Fetch active loans from the lending contract
  const { data: loanIds } = useReadContract({
    address: CONTRACT_ADDRESSES.DomainLending as `0x${string}`,
    abi: DomainLendingABI.abi,
    functionName: 'getBorrowerLoans',
    args: address ? [address] : undefined,
  });

  // Fetch fractionalized domains
  const { domains: fractionalizedDomains, fetchDomains: fetchFractionalizedDomains } = useFractionalizedDomains(5);

  useEffect(() => {
    if (address) {
      setLoading(true);
      fetchDomainsByOwner(address)
        .then(setDomains)
        .finally(() => setLoading(false));

      // Fetch fractionalized domains
      fetchFractionalizedDomains();
    }
  }, [address, fetchFractionalizedDomains]);

  const handleBorrow = (domain: DomainToken) => {
    sessionStorage.setItem('selectedDomain', JSON.stringify(domain));
    router.push('/lending');
  };

  const handleLease = (domain: DomainToken) => {
    sessionStorage.setItem('selectedDomain', JSON.stringify(domain));
    router.push('/leasing');
  };

  // Fetch AI-powered trending domains and market insights
  useEffect(() => {
    const fetchTrendingData = async () => {
      try {
        // Fetch trending domains using AI
        const trending = await aiTrendingService.getTrendingDomains(5);
        setTrendingDomains(trending);

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
        setTrendingDomains(fallbackData);
      }
    };

    fetchTrendingData();
    // Refresh trending data every 5 minutes
    const interval = setInterval(fetchTrendingData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [addNotification]);

  const totalValue = domains.reduce((sum, domain) => sum + estimateDomainValue(domain), 0);
  const activeLoans = Array.isArray(loanIds) ? loanIds.length : 0; // Get actual loan count
  const activeLeases = 0; // Will be updated when fractional tokens are implemented
  const fractionalizedCount = fractionalizedDomains?.length || 0;

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

            {/* Trending Domains */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[var(--primary)]" />
                AI-Powered Trending Domains
                {marketInsights && (
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    marketInsights.marketSentiment === 'bullish' ? 'bg-green-500/20 text-green-400' :
                    marketInsights.marketSentiment === 'bearish' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {marketInsights.marketSentiment} market
                  </span>
                )}
              </h2>
              <div className="grid md:grid-cols-5 gap-4">
                {trendingDomains.map((domain, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--primary)] transition-all hover:shadow-lg cursor-pointer group"
                    onClick={() => router.push('/marketplace')}
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

            {/* Fractionalized Domains */}
            {fractionalizedCount > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6">Fractionalized Domains</h2>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <p className="text-green-400">
                    ✓ {fractionalizedCount} domain(s) successfully fractionalized and available in the marketplace
                  </p>
                </div>
              </div>
            )}

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
