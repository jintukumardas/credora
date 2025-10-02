'use client';

import { Header } from '@/components/Header';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { DollarSign, Calendar, TrendingUp, AlertCircle } from 'lucide-react';

export default function LendingPage() {
  const [loanAmount, setLoanAmount] = useState('');
  const [duration, setDuration] = useState('30');
  const [interestRate] = useState(8.5); // Fixed for demo

  const calculateInterest = () => {
    const amount = parseFloat(loanAmount) || 0;
    const days = parseInt(duration) || 0;
    return (amount * interestRate * days) / (365 * 100);
  };

  const totalRepayment = (parseFloat(loanAmount) || 0) + calculateInterest();

  return (
    <>
      <Header />
      <main className="min-h-screen container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl font-bold mb-2">Domain Lending</h1>
          <p className="text-gray-400 mb-8">
            Borrow stablecoins using your tokenized domains as collateral
          </p>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Loan Creation Form */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6">Create Loan</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Select Domain</label>
                  <select className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-4 py-3 text-white">
                    <option>example.com - Est. Value: $5,000</option>
                    <option>mydomain.io - Est. Value: $3,500</option>
                    <option>premium.eth - Est. Value: $10,000</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Loan Amount (USDC)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                    <input
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-3 text-white"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Max LTV: 80% = $4,000</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Duration (Days)</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
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
                    <span className="text-gray-400">Interest Rate</span>
                    <span className="text-white font-medium">{interestRate}% APR</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Interest Amount</span>
                    <span className="text-white font-medium">${calculateInterest().toFixed(2)}</span>
                  </div>
                  <div className="border-t border-[var(--border)] pt-2 flex justify-between">
                    <span className="text-white font-medium">Total Repayment</span>
                    <span className="text-[var(--primary)] font-bold">${totalRepayment.toFixed(2)}</span>
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
                  Create Loan
                </button>
              </div>
            </div>

            {/* Info & Active Loans */}
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-400 mb-2">How it works</h3>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Your domain NFT is locked as collateral</li>
                      <li>• Receive stablecoins instantly</li>
                      <li>• Repay within the loan duration</li>
                      <li>• If you default, lender receives your domain</li>
                      <li>• Maximum 80% loan-to-value ratio</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
                <h3 className="font-bold mb-4">Your Active Loans</h3>
                <div className="text-center py-8 text-gray-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active loans</p>
                </div>
              </div>

              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
                <h3 className="font-bold mb-4">Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Borrowed</span>
                    <span className="text-white font-medium">$0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Available Credit</span>
                    <span className="text-green-400 font-medium">$18,500</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Platform Fee</span>
                    <span className="text-white font-medium">0.5%</span>
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
