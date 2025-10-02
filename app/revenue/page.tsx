'use client';

import { Header } from '@/components/Header';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Users, PieChart } from 'lucide-react';

export default function RevenuePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <h1 className="text-4xl font-bold mb-2">Revenue Distribution</h1>
          <p className="text-gray-400 mb-8">
            Automated on-chain yield distribution from your domain activities
          </p>

          {/* Revenue Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
              <DollarSign className="w-8 h-8 text-green-400 mb-3" />
              <div className="text-2xl font-bold mb-1">$1,234</div>
              <div className="text-sm text-gray-400">Total Revenue</div>
            </div>

            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
              <TrendingUp className="w-8 h-8 text-blue-400 mb-3" />
              <div className="text-2xl font-bold mb-1">$567</div>
              <div className="text-sm text-gray-400">This Month</div>
            </div>

            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
              <PieChart className="w-8 h-8 text-purple-400 mb-3" />
              <div className="text-2xl font-bold mb-1">3</div>
              <div className="text-sm text-gray-400">Active Streams</div>
            </div>

            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
              <Users className="w-8 h-8 text-orange-400 mb-3" />
              <div className="text-2xl font-bold mb-1">7</div>
              <div className="text-sm text-gray-400">Beneficiaries</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Revenue Streams */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6">Revenue Streams</h2>

              <div className="space-y-4">
                <div className="bg-[var(--background)] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-white">example.com - Parking</div>
                      <div className="text-xs text-gray-400">Domain parking revenue</div>
                    </div>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Active</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Collected</span>
                      <span className="text-white font-medium">$450</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Beneficiaries</span>
                      <span className="text-white font-medium">3</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    <div className="text-xs text-gray-400 mb-2">Distribution</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-300">0x1234...5678 (Owner)</span>
                        <span className="text-white">70%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">0xabcd...ef01 (Lender)</span>
                        <span className="text-white">20%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">0x9876...5432 (Partner)</span>
                        <span className="text-white">10%</span>
                      </div>
                    </div>
                  </div>

                  <button className="w-full mt-3 bg-[var(--border)] text-white py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors">
                    Manage Stream
                  </button>
                </div>

                <div className="bg-[var(--background)] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-white">mydomain.io - Lease</div>
                      <div className="text-xs text-gray-400">DNS control lease income</div>
                    </div>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Active</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Collected</span>
                      <span className="text-white font-medium">$784</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Beneficiaries</span>
                      <span className="text-white font-medium">2</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    <div className="text-xs text-gray-400 mb-2">Distribution</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-300">0x1234...5678 (Owner)</span>
                        <span className="text-white">85%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Protocol</span>
                        <span className="text-white">15%</span>
                      </div>
                    </div>
                  </div>

                  <button className="w-full mt-3 bg-[var(--border)] text-white py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors">
                    Manage Stream
                  </button>
                </div>
              </div>

              <button className="w-full mt-4 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
                Create New Stream
              </button>
            </div>

            {/* Withdrawals & Stats */}
            <div className="space-y-6">
              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
                <h3 className="font-bold mb-4">Available to Withdraw</h3>

                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                  <div className="text-3xl font-bold text-green-400 mb-1">$234.50</div>
                  <div className="text-sm text-gray-400">Across all streams</div>
                </div>

                <button className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors">
                  Withdraw All
                </button>
              </div>

              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
                <h3 className="font-bold mb-4">Revenue Breakdown</h3>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Domain Parking</span>
                      <span className="text-white font-medium">$450 (36%)</span>
                    </div>
                    <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] w-[36%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Lease Income</span>
                      <span className="text-white font-medium">$784 (64%)</span>
                    </div>
                    <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 w-[64%]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
                <h3 className="font-bold mb-4">Recent Distributions</h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <div>
                      <div className="text-white">Parking Revenue</div>
                      <div className="text-xs text-gray-400">2 days ago</div>
                    </div>
                    <div className="text-green-400 font-medium">+$50</div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div>
                      <div className="text-white">Lease Payment</div>
                      <div className="text-xs text-gray-400">5 days ago</div>
                    </div>
                    <div className="text-green-400 font-medium">+$100</div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div>
                      <div className="text-white">Parking Revenue</div>
                      <div className="text-xs text-gray-400">7 days ago</div>
                    </div>
                    <div className="text-green-400 font-medium">+$45</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </>
  );
}
