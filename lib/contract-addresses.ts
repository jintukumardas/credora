/**
 * Smart Contract Addresses
 * Credora and Doma Protocol contracts
 */

export const CONTRACT_ADDRESSES = {
  // Credora deployed contracts
  DomainLending: process.env.NEXT_PUBLIC_LENDING_CONTRACT || '0x0000000000000000000000000000000000000000',
  DomainLeasing: process.env.NEXT_PUBLIC_LEASING_CONTRACT || '0x0000000000000000000000000000000000000000',
  RevenueDistributor: process.env.NEXT_PUBLIC_REVENUE_CONTRACT || '0x0000000000000000000000000000000000000000',

  // Doma Protocol Official Contracts (Doma Testnet)
  DomaOwnershipToken: process.env.NEXT_PUBLIC_DOMA_OWNERSHIP_TOKEN || '0x424bDf2E8a6F52Bd2c1C81D9437b0DC0309DF90f',
  DomaRecord: process.env.NEXT_PUBLIC_DOMA_RECORD || '0xF6A92E0f8bEa4174297B0219d9d47fEe335f84f8',
  DomaGateway: process.env.NEXT_PUBLIC_DOMA_GATEWAY || '0xCE1476C791ff195e462632bf9Eb22f3d3cA07388',
  DomaForwarder: process.env.NEXT_PUBLIC_DOMA_FORWARDER || '0xf17beC16794e018E2F0453a1282c3DA3d121f410',
  DomaProxyRecord: process.env.NEXT_PUBLIC_DOMA_PROXY_RECORD || '0xb1508299A01c02aC3B70c7A8B0B07105aaB29E99',

  // Legacy aliases
  DomainOwnershipToken: process.env.NEXT_PUBLIC_DOMA_OWNERSHIP_TOKEN || '0x424bDf2E8a6F52Bd2c1C81D9437b0DC0309DF90f',
  SyntheticTokenFactory: process.env.NEXT_PUBLIC_SYNTHETIC_FACTORY || '0x0000000000000000000000000000000000000000',

  // Payment tokens
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x1DDb71890b950D8659075D66c9c2b960B92C9047',
  USDT: process.env.NEXT_PUBLIC_USDT_ADDRESS || '0xdAC17F958D2ee523a2206206994597C13D831ec7',
} as const;

export type ContractName = keyof typeof CONTRACT_ADDRESSES;

export function getContractAddress(name: ContractName): string {
  // In production, return different addresses per chain
  return CONTRACT_ADDRESSES[name];
}
