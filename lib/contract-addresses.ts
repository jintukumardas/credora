/**
 * Smart Contract Addresses
 * Update these after deployment
 */

export const CONTRACT_ADDRESSES = {
  // Main contracts
  DomainLending: process.env.NEXT_PUBLIC_LENDING_CONTRACT || '0x0000000000000000000000000000000000000000',
  DomainLeasing: process.env.NEXT_PUBLIC_LEASING_CONTRACT || '0x0000000000000000000000000000000000000000',
  RevenueDistributor: process.env.NEXT_PUBLIC_REVENUE_CONTRACT || '0x0000000000000000000000000000000000000000',

  // Doma Protocol contracts (update with actual addresses)
  DomainOwnershipToken: process.env.NEXT_PUBLIC_DOMAIN_NFT_CONTRACT || '0x0000000000000000000000000000000000000000',
  SyntheticTokenFactory: process.env.NEXT_PUBLIC_SYNTHETIC_FACTORY || '0x0000000000000000000000000000000000000000',

  // Payment tokens
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: process.env.NEXT_PUBLIC_USDT_ADDRESS || '0xdAC17F958D2ee523a2206206994597C13D831ec7',
} as const;

export type ContractName = keyof typeof CONTRACT_ADDRESSES;

export function getContractAddress(name: ContractName): string {
  // In production, return different addresses per chain
  return CONTRACT_ADDRESSES[name];
}
