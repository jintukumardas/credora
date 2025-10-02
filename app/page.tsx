'use client';

import { Header } from '@/components/Header';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp, Zap, Globe, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Turn Your Domains Into
              <span className="block gradient-text mt-2">DeFi Assets</span>
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Unlock liquidity from your domains with Doma Protocol. Borrow against domain
              collateral, lease granular rights, and earn automated yield.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/dashboard"
                className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                Launch App <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="https://docs.doma.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[var(--card-bg)] border border-[var(--border)] text-white px-8 py-3 rounded-lg font-medium hover:border-[var(--primary)] transition-colors"
              >
                Learn More
              </a>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-8 hover:border-[var(--primary)] transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Domain Lending</h3>
              <p className="text-gray-400">
                Use your tokenized domains as collateral to borrow stablecoins with competitive
                rates and flexible terms.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-8 hover:border-[var(--primary)] transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Rights Leasing</h3>
              <p className="text-gray-400">
                Split and lease specific domain permissions like DNS control, nameservers, or
                parking rights to generate revenue.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-8 hover:border-[var(--primary)] transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Automated Yield</h3>
              <p className="text-gray-400">
                Earn passive income through automated on-chain revenue distribution from domain
                parking, ads, and leases.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="bg-gradient-to-r from-[var(--primary)]/10 to-[var(--accent)]/10 border border-[var(--primary)]/20 rounded-2xl p-12"
          >
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold gradient-text mb-2">On-Chain</div>
                <div className="text-gray-400">100% Transparent</div>
              </div>
              <div>
                <div className="text-4xl font-bold gradient-text mb-2">Multi-Chain</div>
                <div className="text-gray-400">Base, Ethereum, Doma</div>
              </div>
              <div>
                <div className="text-4xl font-bold gradient-text mb-2">Permissionless</div>
                <div className="text-gray-400">No KYC Required</div>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </>
  );
}
