'use client';

import { Header } from '@/components/Header';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Globe, DollarSign, Clock, Shield } from 'lucide-react';

const PERMISSION_TYPES = [
  { id: 'dns', name: 'DNS Control', description: 'Full DNS record management', icon: Globe },
  { id: 'nameserver', name: 'Nameserver', description: 'Nameserver configuration', icon: Shield },
  { id: 'subdomain', name: 'Subdomain Rights', description: 'Create and manage subdomains', icon: Globe },
  { id: 'parking', name: 'Domain Parking', description: 'Monetize through parking', icon: DollarSign },
];

export default function LeasingPage() {
  const [selectedPermission, setSelectedPermission] = useState('dns');
  const [rentalPrice, setRentalPrice] = useState('');
  const [duration, setDuration] = useState('30');

  return (
    <>
      <Header />
      <main className="min-h-screen container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl font-bold mb-2">Domain Rights Leasing</h1>
          <p className="text-gray-400 mb-8">
            Split and lease specific domain permissions to generate passive income
          </p>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Lease Creation Form */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6">Create Lease</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Select Domain</label>
                  <select className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-3 text-white">
                    <option>example.com</option>
                    <option>mydomain.io</option>
                    <option>premium.eth</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Permission Type</label>
                  <div className="space-y-2">
                    {PERMISSION_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <div
                          key={type.id}
                          onClick={() => setSelectedPermission(type.id)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedPermission === type.id
                              ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                              : 'border-[var(--border)] hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="w-5 h-5 text-[var(--primary)] mt-0.5" />
                            <div>
                              <div className="font-medium text-white">{type.name}</div>
                              <div className="text-xs text-gray-400">{type.description}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Rental Price (USDC/month)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                    <input
                      type="number"
                      value={rentalPrice}
                      onChange={(e) => setRentalPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-3 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Duration (Days)</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-3 text-white"
                    />
                  </div>
                </div>

                <div className="bg-[var(--background)] rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Platform Fee (2.5%)</span>
                    <span className="text-white font-medium">
                      ${((parseFloat(rentalPrice) || 0) * 0.025).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">You Receive</span>
                    <span className="text-green-400 font-medium">
                      ${((parseFloat(rentalPrice) || 0) * 0.975).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
                  Create Lease Listing
                </button>
              </div>
            </div>

            {/* Active Leases & Info */}
            <div className="space-y-6">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
                <h3 className="font-semibold text-purple-400 mb-3">Synthetic Tokens</h3>
                <p className="text-sm text-gray-300 mb-3">
                  Doma Protocol splits your domain into synthetic tokens representing specific rights.
                  You retain ownership while leasing out permissions.
                </p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Permissions are mutually exclusive</li>
                  <li>• Automatic return after lease period</li>
                  <li>• Lessee can only use granted permission</li>
                  <li>• Fully on-chain and transparent</li>
                </ul>
              </div>

              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
                <h3 className="font-bold mb-4">Your Active Leases</h3>
                <div className="space-y-3">
                  <div className="bg-[var(--background)] rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-white">example.com</div>
                        <div className="text-xs text-gray-400">DNS Control Rights</div>
                      </div>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Active</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-gray-400">Earning</div>
                        <div className="text-white font-medium">$50/month</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Ends In</div>
                        <div className="text-white font-medium">15 days</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
                <h3 className="font-bold mb-4">Earnings</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Earned</span>
                    <span className="text-white font-medium">$150</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Pending Payment</span>
                    <span className="text-yellow-400 font-medium">$50</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Available to Withdraw</span>
                    <span className="text-green-400 font-medium">$100</span>
                  </div>
                  <button className="w-full bg-green-500/20 text-green-400 py-2 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors">
                    Withdraw Earnings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </>
  );
}
