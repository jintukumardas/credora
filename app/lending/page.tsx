'use client';

import { Header } from '@/components/Header';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { DollarSign, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { DomainToken, estimateDomainValue } from '@/lib/doma-client';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/contract-addresses';
import DomainLendingABI from '@/artifacts/contracts/DomainLending.sol/DomainLending.json';

export default function LendingPage() {
  const router = useRouter();
  const { address } = useAccount();
  const [selectedDomain, setSelectedDomain] = useState<DomainToken | null>(null);
  const [loanAmount, setLoanAmount] = useState('');
  const [duration, setDuration] = useState('30');
  const [interestRate] = useState(8.5); // Fixed for demo
  const [domainValue, setDomainValue] = useState(0);

  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    const storedDomain = sessionStorage.getItem('selectedDomain');
    if (storedDomain) {
      const domain = JSON.parse(storedDomain);
      setSelectedDomain(domain);
      setDomainValue(estimateDomainValue(domain));
    }
  }, []);

  useEffect(() => {
    if (isSuccess) {
      alert('Loan created successfully!');
      setLoanAmount('');
    }
  }, [isSuccess]);

  const calculateInterest = () => {
    const amount = parseFloat(loanAmount) || 0;
    const days = parseInt(duration) || 0;
    return (amount * interestRate * days) / (365 * 100);
  };

  const totalRepayment = (parseFloat(loanAmount) || 0) + calculateInterest();
  const maxLoanAmount = domainValue * 0.8; // 80% LTV

  const handleCreateLoan = async () => {
    if (!selectedDomain || !address) {
      alert('Please connect wallet and select a domain');
      return;
    }

    const amount = parseFloat(loanAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid loan amount');
      return;
    }

    if (amount > maxLoanAmount) {
      alert(`Loan amount exceeds max LTV (80% of $${domainValue})`);
      return;
    }

    const durationDays = parseInt(duration);
    if (durationDays < 7 || durationDays > 365) {
      alert('Duration must be between 7 and 365 days');
      return;
    }

    try {
      // Convert amounts to proper decimals (USDC has 6 decimals)
      const loanAmountWei = parseUnits(amount.toString(), 6);
      const domainValueWei = parseUnits(domainValue.toString(), 6);
      const durationSeconds = BigInt(durationDays * 24 * 60 * 60);
      const interestRateBps = BigInt(Math.floor(interestRate * 100)); // Convert to basis points

      writeContract({
        address: CONTRACT_ADDRESSES.DomainLending as `0x${string}`,
        abi: DomainLendingABI.abi,
        functionName: 'createLoan',
        args: [
          CONTRACT_ADDRESSES.DomainOwnershipToken, // domainNFT address
          BigInt(selectedDomain.tokenId || '0'), // tokenId
          loanAmountWei, // loanAmount
          interestRateBps, // interestRate in bps
          durationSeconds, // duration in seconds
          domainValueWei, // collateralValue
        ],
      });
    } catch (error) {
      console.error('Error creating loan:', error);
      alert('Failed to create loan. Check console for details.');
    }
  };

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
                {selectedDomain ? (
                  <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Selected Domain</p>
                        <p className="text-lg font-semibold">{selectedDomain.name}</p>
                      </div>
                      <button
                        onClick={() => router.push('/dashboard')}
                        className="text-sm text-[var(--primary)] hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <p className="text-yellow-500 text-sm">
                      No domain selected.{' '}
                      <button
                        onClick={() => router.push('/dashboard')}
                        className="underline hover:no-underline"
                      >
                        Go to dashboard
                      </button>
                    </p>
                  </div>
                )}

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
                  <p className="text-xs text-gray-500 mt-1">
                    Max LTV: 80% = ${maxLoanAmount.toFixed(2)}
                  </p>
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

                <button
                  onClick={handleCreateLoan}
                  disabled={isPending || isConfirming || !selectedDomain}
                  className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending || isConfirming ? 'Creating Loan...' : 'Create Loan'}
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
                    <span className="text-gray-400">Domain Value</span>
                    <span className="text-white font-medium">${domainValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Available Credit</span>
                    <span className="text-green-400 font-medium">${maxLoanAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Borrowed</span>
                    <span className="text-white font-medium">$0</span>
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
