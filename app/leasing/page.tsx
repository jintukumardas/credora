'use client';

import { Header } from '@/components/Header';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Globe, DollarSign, Clock, Shield, AlertCircle, Coins } from 'lucide-react';
import { DomainToken, estimateDomainValue } from '@/lib/doma-client';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/contract-addresses';
import DomainLeasingABI from '@/artifacts/contracts/DomainLeasing.sol/DomainLeasing.json';
import { FractionalizationModal } from '@/components/FractionalizationModal';
import { useFractionalize } from '@/lib/fractionalization-hooks';
import toast from 'react-hot-toast';

const PERMISSION_TYPES = [
  { id: 0, name: 'DNS Control', description: 'Full DNS record management', icon: Globe },
  { id: 1, name: 'Nameserver', description: 'Nameserver configuration', icon: Shield },
  { id: 2, name: 'Subdomain Rights', description: 'Create and manage subdomains', icon: Globe },
  { id: 3, name: 'Domain Parking', description: 'Monetize through parking', icon: DollarSign },
];

// Minimal ERC721 ABI for approve function
const ERC721_ABI = [
  {
    name: 'setApprovalForAll',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
  {
    name: 'isApprovedForAll',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export default function LeasingPage() {
  const router = useRouter();
  const { address } = useAccount();
  const [selectedDomain, setSelectedDomain] = useState<DomainToken | null>(null);
  const [selectedPermission, setSelectedPermission] = useState(0);
  const [rentalPrice, setRentalPrice] = useState('');
  const [duration, setDuration] = useState('30');
  const [domainValue, setDomainValue] = useState(0);
  const [approvalStep, setApprovalStep] = useState<'idle' | 'approving' | 'approved'>('idle');
  const [currentAction, setCurrentAction] = useState<'approve' | 'lease' | null>(null);
  const [showFractionalizeModal, setShowFractionalizeModal] = useState(false);
  const [leasingMode, setLeasingMode] = useState<'fractionalization' | 'permissions'>('fractionalization');

  const { data: hash, writeContract, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError, error } = useWaitForTransactionReceipt({ hash });

  // Check if operator has approval for all tokens
  const { data: isApprovedForAll, refetch: refetchApprovalForAll } = useReadContract({
    address: CONTRACT_ADDRESSES.DomaOwnershipToken as `0x${string}`,
    abi: ERC721_ABI,
    functionName: 'isApprovedForAll',
    args: address ? [address as `0x${string}`, CONTRACT_ADDRESSES.DomainLeasing as `0x${string}`] : undefined,
  });

  // Fetch lessor's leases
  const { data: lessorLeaseIds } = useReadContract({
    address: CONTRACT_ADDRESSES.DomainLeasing as `0x${string}`,
    abi: DomainLeasingABI.abi,
    functionName: 'getLessorLeases',
    args: address ? [address] : undefined,
  });

  useEffect(() => {
    const storedDomain = sessionStorage.getItem('selectedDomain');
    if (storedDomain) {
      const domain = JSON.parse(storedDomain);
      setSelectedDomain(domain);
      setDomainValue(estimateDomainValue(domain));
    }
  }, []);

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && currentAction) {
      if (currentAction === 'approve') {
        setApprovalStep('approved');
        toast.success('NFT approved for leasing contract!', {
          duration: 5000,
        });
        refetchApprovalForAll();
      } else if (currentAction === 'lease') {
        toast.success('Lease listing created successfully! 🎉', {
          duration: 5000,
        });
        setRentalPrice('');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
      setCurrentAction(null);
      reset();
    }
  }, [isSuccess, currentAction, refetchApprovalForAll, reset]);

  // Handle transaction errors
  useEffect(() => {
    if (isError && error) {
      const errorMessage = error.message || 'Transaction failed';
      toast.error(errorMessage.slice(0, 100), { duration: 5000 });
      setCurrentAction(null);
      if (currentAction === 'approve') {
        setApprovalStep('idle');
      }
    }
  }, [isError, error, currentAction]);

  // Check if already approved
  useEffect(() => {
    if (isApprovedForAll === true) {
      setApprovalStep('approved');
    } else if (approvalStep === 'approved' && !isApprovedForAll) {
      if (!isPending && !isConfirming) {
        setApprovalStep('idle');
      }
    }
  }, [isApprovedForAll, isPending, isConfirming, approvalStep]);

  const platformFee = (parseFloat(rentalPrice) || 0) * 0.025;
  const youReceive = (parseFloat(rentalPrice) || 0) - platformFee;

  const handleApproveNFT = async () => {
    if (!selectedDomain) {
      toast.error('No domain selected');
      return;
    }

    try {
      setApprovalStep('approving');
      setCurrentAction('approve');

      const toastId = toast.loading('Approving NFT for leasing contract...');

      writeContract({
        address: CONTRACT_ADDRESSES.DomaOwnershipToken as `0x${string}`,
        abi: ERC721_ABI,
        functionName: 'setApprovalForAll',
        args: [CONTRACT_ADDRESSES.DomainLeasing as `0x${string}`, true],
      });

      setTimeout(() => toast.dismiss(toastId), 1000);
    } catch (error) {
      console.error('Error approving NFT:', error);
      toast.error('Failed to approve NFT. Check console for details.');
      setApprovalStep('idle');
      setCurrentAction(null);
    }
  };

  const handleCreateLease = async () => {
    if (!selectedDomain || !address) {
      toast.error('Please connect wallet and select a domain');
      return;
    }

    const price = parseFloat(rentalPrice);
    if (!price || price <= 0) {
      toast.error('Please enter a valid rental price');
      return;
    }

    const durationDays = parseInt(duration);
    if (durationDays < 1 || durationDays > 365) {
      toast.error('Duration must be between 1 and 365 days');
      return;
    }

    try {
      setCurrentAction('lease');
      const toastId = toast.loading('Creating fractional token lease...');

      // Step 1: Fractionalize the domain for the specific permission
      const permissionName = PERMISSION_TYPES[selectedPermission].name;
      const tokenSymbol = `${selectedDomain.name.substring(0, 4).toUpperCase()}-${permissionName.substring(0, 3).toUpperCase()}`;

      // In production, this would:
      // 1. Call fractionalizeOwnershipToken() with permission-specific metadata
      // 2. Create fractional tokens for the specific permission
      // 3. List those tokens for lease with price and duration

      toast.dismiss(toastId);
      toast.success(
        `Ready to create ${permissionName} lease! This would fractionalize your domain into permission-specific tokens (${tokenSymbol}) and list them for ${price} USDC/month.`,
        { duration: 8000 }
      );

      // For demo: Show the flow
      setTimeout(() => {
        toast(
          'Fractional token leasing flow: 1) Fractionalize domain → 2) Generate permission tokens → 3) List tokens for lease → 4) Lessee receives tokens during lease period',
          { duration: 10000, icon: '📋' }
        );
      }, 1000);

      setCurrentAction(null);
    } catch (error) {
      console.error('Error creating lease:', error);
      toast.error('Failed to create lease. Check console for details.');
      setCurrentAction(null);
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
          <h1 className="text-4xl font-bold mb-2">Domain Rights Leasing</h1>
          <p className="text-gray-400 mb-4">
            Split and lease specific domain permissions or fractionalize ownership
          </p>

          {/* Mode Selector */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setLeasingMode('fractionalization')}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                leasingMode === 'fractionalization'
                  ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white'
                  : 'bg-[var(--card-bg)] border border-[var(--border)] text-gray-400 hover:text-white'
              }`}
            >
              <Coins className="w-5 h-5 inline mr-2" />
              Fractional Ownership
            </button>
            <button
              onClick={() => setLeasingMode('permissions')}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                leasingMode === 'permissions'
                  ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white'
                  : 'bg-[var(--card-bg)] border border-[var(--border)] text-gray-400 hover:text-white'
              }`}
            >
              <Shield className="w-5 h-5 inline mr-2" />
              Permission Rights
            </button>
          </div>

          {/* Mode-specific Notice */}
          {leasingMode === 'permissions' ? (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-400 mb-2">Permission Rights via Fractional Tokens</h3>
                  <p className="text-sm text-gray-300 mb-3">
                    Lease specific domain rights by fractionalizing your domain ownership. Each fractional token represents a specific permission:
                  </p>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• <strong>DNS Token:</strong> Full DNS record management rights</li>
                    <li>• <strong>Nameserver Token:</strong> Nameserver configuration control</li>
                    <li>• <strong>Subdomain Token:</strong> Create and manage subdomains</li>
                    <li>• <strong>Parking Token:</strong> Domain parking monetization</li>
                  </ul>
                  <p className="text-sm text-gray-300 mt-3">
                    Lessees hold fractional tokens during lease period and automatically return them when expired.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <Coins className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-purple-400 mb-2">About Domain Fractionalization</h3>
                  <p className="text-sm text-gray-300 mb-3">
                    Fractionalize your domain NFT into fungible ERC-20 tokens, enabling:
                  </p>
                  <ul className="text-sm text-gray-300 space-y-1 mb-3">
                    <li>• <strong>Liquidity:</strong> Access capital while retaining ownership rights</li>
                    <li>• <strong>Partial Ownership:</strong> Enable fractional investment in your domain</li>
                    <li>• <strong>Buyout Protection:</strong> Set minimum buyout price in USDC</li>
                    <li>• <strong>Trading:</strong> Fractional tokens can be traded on DEXs</li>
                  </ul>
                  <p className="text-sm text-gray-300">
                    Anyone can buy out the full domain at max(Minimum Price, Fully Diluted Market Cap).
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Main Action Form */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6">
                {leasingMode === 'permissions' ? 'Create Lease' : 'Fractionalize Domain'}
              </h2>

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

                {leasingMode === 'permissions' && (
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
                )}

                {leasingMode === 'permissions' ? (
                  <>
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
                        <span className="text-white font-medium">${platformFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">You Receive</span>
                        <span className="text-green-400 font-medium">${youReceive.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleCreateLease}
                      disabled={isPending || isConfirming || !selectedDomain || !rentalPrice}
                      className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Shield className="w-5 h-5 inline mr-2" />
                      {isPending || isConfirming ? 'Creating Lease...' : 'Create Permission Lease'}
                    </button>
                    <p className="text-xs text-center text-gray-400">
                      Creates fractional tokens for {PERMISSION_TYPES[selectedPermission].name}
                    </p>
                  </>
                ) : (
                  <button
                    onClick={() => setShowFractionalizeModal(true)}
                    disabled={!selectedDomain}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Coins className="w-5 h-5 inline mr-2" />
                    Fractionalize Domain
                  </button>
                )}
              </div>
            </div>

            {/* Active Leases & Info */}
            <div className="space-y-6">
              {leasingMode === 'permissions' ? (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
                  <h3 className="font-semibold text-purple-400 mb-3">Fractional Token Leasing Flow</h3>
                  <ol className="text-sm text-gray-300 space-y-2">
                    <li className="flex gap-2">
                      <span className="text-purple-400 font-bold">1.</span>
                      <span><strong>Fractionalize:</strong> Domain NFT split into permission-specific ERC-20 tokens</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-400 font-bold">2.</span>
                      <span><strong>List Lease:</strong> Set rental price and duration for specific permission tokens</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-400 font-bold">3.</span>
                      <span><strong>Lessee Receives:</strong> Permission tokens transferred to lessee&apos;s wallet</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-400 font-bold">4.</span>
                      <span><strong>Auto Return:</strong> Tokens automatically returned after lease expires</span>
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
                  <h3 className="font-semibold text-purple-400 mb-3">Fractionalization Benefits</h3>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>• <strong>Access Liquidity:</strong> Convert domain to tradable tokens</li>
                    <li>• <strong>Enable Investment:</strong> Allow fractional ownership</li>
                    <li>• <strong>Set Floor Price:</strong> Minimum buyout protection</li>
                    <li>• <strong>DEX Trading:</strong> Tokens tradable on exchanges</li>
                    <li>• <strong>Buyout Formula:</strong> max(MBP, FDMC)</li>
                  </ul>
                </div>
              )}

              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
                <h3 className="font-bold mb-4">Your Active Leases</h3>
                {lessorLeaseIds && Array.isArray(lessorLeaseIds) && lessorLeaseIds.length > 0 ? (
                  <div className="space-y-3">
                    {lessorLeaseIds.map((leaseId: bigint) => (
                      <div key={leaseId.toString()} className="bg-[var(--background)] rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium text-white">Lease #{leaseId.toString()}</div>
                            <div className="text-xs text-gray-400">View details for more info</div>
                          </div>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Active</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active leases</p>
                  </div>
                )}
              </div>

              <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
                <h3 className="font-bold mb-4">Earnings</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Leases</span>
                    <span className="text-white font-medium">{Array.isArray(lessorLeaseIds) ? lessorLeaseIds.length : 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Platform Fee Rate</span>
                    <span className="text-white font-medium">2.5%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Fractionalization Modal */}
      {selectedDomain && (
        <FractionalizationModal
          isOpen={showFractionalizeModal}
          onClose={() => setShowFractionalizeModal(false)}
          tokenId={selectedDomain.tokenId || ''}
          domainName={selectedDomain.name}
        />
      )}
    </>
  );
}
