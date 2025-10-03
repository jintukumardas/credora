/**
 * Doma Protocol Fractionalization API
 * Integration with Doma's fractionalization system
 *
 * Note: These endpoints may not be available in testnet yet.
 * This is a reference implementation based on the documentation.
 */

import { domaApiRequest } from './doma-api';

// ===== TYPES =====

export interface FractionalTokenInfo {
  name: string;
  symbol: string;
}

export interface FractionalizeParams {
  tokenId: string;
  fractionalTokenInfo: FractionalTokenInfo;
  minimumBuyoutPrice: string; // In wei or base currency units
}

export interface BuyoutParams {
  tokenId: string;
}

export interface ExchangeFractionalTokenParams {
  fractionalToken: string; // Address of the fractional token
  amount: string; // Amount to exchange (in wei)
}

export interface FractionalizedDomain {
  tokenId: string;
  fractionalToken: string;
  totalSupply: string;
  minimumBuyoutPrice: string;
  currentBuyoutPrice: string;
  owner: string;
}

export interface BuyoutPriceResponse {
  tokenId: string;
  buyoutPrice: string;
  minimumBuyoutPrice: string;
  fullyDilutedMarketCap: string;
}

// ===== FRACTIONALIZATION API =====

/**
 * Fractionalize a domain NFT into tradable fractional tokens
 * @param params - Fractionalization parameters
 * @param signature - User signature for the transaction
 * @returns Transaction data for fractionalizing the NFT
 */
export async function fractionalizeOwnershipToken(
  params: FractionalizeParams,
  signature: string
): Promise<{ transactionHash: string; fractionalToken: string }> {
  return domaApiRequest('/v1/fractionalization/fractionalize', {
    method: 'POST',
    body: JSON.stringify({ ...params, signature }),
  });
}

/**
 * Buy out a fractionalized domain NFT
 * Caller must pay the full buyout price to reclaim the whole NFT
 * @param params - Buyout parameters
 * @param signature - User signature for the transaction
 * @returns Transaction data for the buyout
 */
export async function buyoutOwnershipToken(
  params: BuyoutParams,
  signature: string
): Promise<{ transactionHash: string; success: boolean }> {
  return domaApiRequest('/v1/fractionalization/buyout', {
    method: 'POST',
    body: JSON.stringify({ ...params, signature }),
  });
}

/**
 * Exchange fractional tokens back for the original NFT or value
 * @param params - Exchange parameters
 * @param signature - User signature for the transaction
 * @returns Transaction data for the exchange
 */
export async function exchangeFractionalToken(
  params: ExchangeFractionalTokenParams,
  signature: string
): Promise<{ transactionHash: string; amount: string }> {
  return domaApiRequest('/v1/fractionalization/exchange', {
    method: 'POST',
    body: JSON.stringify({ ...params, signature }),
  });
}

/**
 * Get the current buyout price for a fractionalized domain
 * Buyout price = max(Minimum Buyout Price, Fully Diluted Market Cap)
 * @param tokenId - Token ID of the domain NFT
 * @returns Current buyout price and related data
 */
export async function getOwnershipTokenBuyoutPrice(
  tokenId: string
): Promise<BuyoutPriceResponse> {
  return domaApiRequest(`/v1/fractionalization/buyout-price/${tokenId}`);
}

/**
 * Get details about a fractionalized domain
 * @param tokenId - Token ID of the domain NFT
 * @returns Fractionalization details
 */
export async function getFractionalizedDomain(
  tokenId: string
): Promise<FractionalizedDomain> {
  return domaApiRequest(`/v1/fractionalization/domain/${tokenId}`);
}

/**
 * Get all fractionalized domains
 * @param take - Number of results to return
 * @param skip - Number of results to skip
 * @returns List of fractionalized domains
 */
export async function getFractionalizedDomains(
  take: number = 20,
  skip: number = 0
): Promise<FractionalizedDomain[]> {
  try {
    return await domaApiRequest(
      `/v1/fractionalization/domains?take=${take}&skip=${skip}`
    );
  } catch (error) {
    console.warn('Fractionalization API not available yet, returning mock data');
    // Return empty array or mock data for development
    return generateMockFractionalizedDomains(take);
  }
}

/**
 * Generate mock fractionalized domains for development
 */
function generateMockFractionalizedDomains(count: number): FractionalizedDomain[] {
  const mockDomains: FractionalizedDomain[] = [];

  for (let i = 0; i < Math.min(count, 5); i++) {
    mockDomains.push({
      tokenId: `${100 + i}`,
      fractionalToken: `0x${Math.random().toString(16).slice(2, 42)}`,
      totalSupply: (1000000 * 1e18).toString(),
      minimumBuyoutPrice: ((2 + i * 0.5) * 1e18).toString(),
      currentBuyoutPrice: ((2.5 + i * 0.5) * 1e18).toString(),
      owner: `0x${Math.random().toString(16).slice(2, 42)}`,
    });
  }

  return mockDomains;
}

// ===== HELPER FUNCTIONS =====

/**
 * Calculate fully diluted market cap based on token price and supply
 * FDMC = Total Token Supply * Token Price
 */
export function calculateFDMC(totalSupply: string, tokenPrice: string): bigint {
  return BigInt(totalSupply) * BigInt(tokenPrice);
}

/**
 * Determine the actual buyout price
 * Uses the maximum of Minimum Buyout Price or FDMC
 */
export function calculateBuyoutPrice(
  minimumBuyoutPrice: string,
  fdmc: string
): bigint {
  return BigInt(minimumBuyoutPrice) > BigInt(fdmc)
    ? BigInt(minimumBuyoutPrice)
    : BigInt(fdmc);
}
