import { GraphQLClient } from 'graphql-request';

/**
 * Doma Protocol Client
 * Integrates with Doma's subgraph and APIs for domain management
 */

// Use the Next.js API route to avoid CORS issues with x-api-key header
const getDomaUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/doma`;
  }
  return process.env.NEXT_PUBLIC_DOMA_SUBGRAPH_URL || 'https://api-testnet.doma.xyz/graphql';
};

export const DOMA_SUBGRAPH_URL = getDomaUrl();

export const DOMA_API_KEY = process.env.NEXT_PUBLIC_DOMA_API_KEY || '';

export const domaClient = new GraphQLClient(DOMA_SUBGRAPH_URL);

export interface DomainToken {
  id: string;
  name: string;
  owner: string;
  expirationDate?: number;
  registrar?: string;
  transferLock?: boolean;
  chain: {
    id: string;
    name: string;
  };
  tokenAddress?: string;
  tokenId?: string;
}

export interface TokenData {
  id: string;
  tokenId: string;
  owner: string;
  name: {
    id: string;
    name: string;
    expirationDate?: number;
    registrar?: {
      id: string;
      name: string;
    };
    chain?: {
      id: string;
      name: string;
    };
  };
  chain: {
    id: string;
    name: string;
  };
}

export interface DomainMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string;
  }[];
}

/**
 * Fetch domain tokens owned by an address
 * Note: Doma API requires an API key - set NEXT_PUBLIC_DOMA_API_KEY in .env
 */
export async function fetchDomainsByOwner(owner: string, chainId: number = 1): Promise<DomainToken[]> {
  if (!DOMA_API_KEY) {
    console.warn('DOMA_API_KEY not configured - skipping domain fetch');
    return [];
  }

  const query = `
    query GetNames($ownedBy: [AddressCAIP10!]!) {
      names(ownedBy: $ownedBy, take: 100, claimStatus: CLAIMED) {
        items {
          name
          expiresAt
          tokens {
            tokenId
            ownerAddress
          }
        }
        totalCount
      }
    }
  `;

  try {
    interface NameItem {
      name: string;
      expiresAt?: string;
      tokens?: Array<{
        tokenId: string;
        ownerAddress: string;
      }>;
    }

    // Convert address to CAIP-10 format: eip155:<chainId>:<address>
    const caip10Address = `eip155:${chainId}:${owner.toLowerCase()}`;

    const data = await domaClient.request<{ names: { items: NameItem[]; totalCount: number } }>(
      query,
      { ownedBy: [caip10Address] }
    );

    // Transform to DomainToken format
    const domains: DomainToken[] = (data.names?.items || []).flatMap(item =>
      (item.tokens || []).map(token => ({
        id: token.tokenId,
        name: item.name,
        owner: token.ownerAddress,
        expirationDate: item.expiresAt ? new Date(item.expiresAt).getTime() / 1000 : undefined,
        chain: { id: chainId.toString(), name: '' },
        tokenId: token.tokenId,
      }))
    );

    return domains;
  } catch (error) {
    console.error('Error fetching domains:', error);
    return [];
  }
}

/**
 * Fetch a specific domain by token ID
 */
export async function fetchDomainByTokenId(tokenId: string): Promise<DomainToken | null> {
  const query = `
    query GetToken($tokenId: String!) {
      token(id: $tokenId) {
        id
        tokenId
        owner
        name {
          id
          name
          expirationDate
          registrar {
            id
            name
          }
        }
        chain {
          id
          name
        }
      }
    }
  `;

  try {
    const data = await domaClient.request<{ token: TokenData | null }>(query, { tokenId });

    if (!data.token) return null;

    return {
      id: data.token.id,
      name: data.token.name.name,
      owner: data.token.owner,
      expirationDate: 0,
      registrar: data.token.name.name,
      chain: data.token.name.chain || { id: '', name: '' },
      tokenAddress: data.token.id.split('-')[0],
      tokenId: data.token.tokenId,
    };
  } catch (error) {
    console.error('Error fetching domain:', error);
    return null;
  }
}

export interface FractionalToken {
  id: string;
  name: {
    id: string;
    name: string;
  };
  tokenAddress: string;
  totalSupply: string;
  buyoutPrice: string;
}

/**
 * Fetch fractional tokens for a domain (Doma's equivalent of synthetic tokens)
 */
export async function fetchFractionalTokens(nameId: string): Promise<FractionalToken[]> {
  const query = `
    query GetFractionalTokens($nameId: String!) {
      fractionalTokens(nameId: $nameId) {
        id
        name {
          id
          name
        }
        tokenAddress
        totalSupply
        buyoutPrice
      }
    }
  `;

  try {
    const data = await domaClient.request<{ fractionalTokens: FractionalToken[] }>(query, { nameId });
    return data.fractionalTokens || [];
  } catch (error) {
    console.error('Error fetching fractional tokens:', error);
    return [];
  }
}

/**
 * Check if a domain is expired
 */
export function isDomainExpired(expirationDate: number): boolean {
  return Date.now() / 1000 > expirationDate;
}

/**
 * Format domain expiration date
 */
export function formatExpirationDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString();
}

/**
 * Calculate days until expiration
 */
export function daysUntilExpiration(expirationDate: number): number {
  const now = Date.now() / 1000;
  const secondsRemaining = expirationDate - now;
  return Math.ceil(secondsRemaining / 86400);
}

/**
 * Estimate domain value based on characteristics
 * This is a simplified estimation - production would use oracles or market data
 */
export function estimateDomainValue(domain: DomainToken): number {
  const baseValue = 100; // Base value in USD
  let multiplier = 1;

  const domainName = domain.name.toLowerCase();

  // Shorter domains are more valuable
  if (domainName.length <= 4) multiplier *= 10;
  else if (domainName.length <= 6) multiplier *= 5;
  else if (domainName.length <= 8) multiplier *= 2;

  // Premium TLDs
  if (domainName.endsWith('.com')) multiplier *= 3;
  else if (domainName.endsWith('.org')) multiplier *= 2;
  else if (domainName.endsWith('.io')) multiplier *= 2.5;
  else if (domainName.endsWith('.eth')) multiplier *= 4;

  return Math.floor(baseValue * multiplier);
}
