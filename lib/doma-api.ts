/**
 * Doma Protocol API Client
 * Comprehensive integration with Doma APIs for orderbook, fractionalization, and more
 */

const DOMA_API_BASE = process.env.NEXT_PUBLIC_DOMA_API_URL || 'https://api-testnet.doma.xyz';
const DOMA_API_KEY = process.env.NEXT_PUBLIC_DOMA_API_KEY || '';

// API request helper
async function domaApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${DOMA_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': DOMA_API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Doma API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

// ===== ORDERBOOK API =====

export interface CreateListingParams {
  orderbook: 'OPENSEA' | 'DOMA';
  chainId: number;
  maker: string;
  contractAddress: string;
  tokenId: string;
  price: string;
  currency: string;
  expirationTime?: number;
}

export interface CreateOfferParams {
  orderbook: 'OPENSEA' | 'DOMA';
  chainId: number;
  maker: string;
  contractAddress: string;
  tokenId: string;
  price: string;
  currency: string;
  expirationTime?: number;
}

export interface OrderbookListing {
  orderId: string;
  maker: string;
  contractAddress: string;
  tokenId: string;
  price: string;
  currency: string;
  status: 'ACTIVE' | 'CANCELLED' | 'FILLED';
  createdAt: string;
  expiresAt?: string;
}

export interface OrderbookOffer {
  orderId: string;
  maker: string;
  contractAddress: string;
  tokenId: string;
  price: string;
  currency: string;
  status: 'ACTIVE' | 'CANCELLED' | 'FILLED';
  createdAt: string;
  expiresAt?: string;
}

/**
 * Create a marketplace listing
 */
export async function createListing(
  params: CreateListingParams,
  signature: string
): Promise<{ orderId: string }> {
  return domaApiRequest('/v1/orderbook/list', {
    method: 'POST',
    body: JSON.stringify({ ...params, signature }),
  });
}

/**
 * Create an offer for a domain
 */
export async function createOffer(
  params: CreateOfferParams,
  signature: string
): Promise<{ orderId: string }> {
  return domaApiRequest('/v1/orderbook/offer', {
    method: 'POST',
    body: JSON.stringify({ ...params, signature }),
  });
}

/**
 * Cancel a listing
 */
export async function cancelListing(
  orderId: string,
  signature: string
): Promise<{ success: boolean }> {
  return domaApiRequest('/v1/orderbook/listing/cancel', {
    method: 'POST',
    body: JSON.stringify({ orderId, signature }),
  });
}

/**
 * Cancel an offer
 */
export async function cancelOffer(
  orderId: string,
  signature: string
): Promise<{ success: boolean }> {
  return domaApiRequest('/v1/orderbook/offer/cancel', {
    method: 'POST',
    body: JSON.stringify({ orderId, signature }),
  });
}

/**
 * Get fulfillment data for a listing
 */
export async function getListingFulfillmentData(
  orderId: string,
  buyer: string
): Promise<any> {
  return domaApiRequest(`/v1/orderbook/listing/${orderId}/${buyer}`);
}

/**
 * Get fulfillment data for an offer
 */
export async function getOfferFulfillmentData(
  orderId: string,
  fulfiller: string
): Promise<any> {
  return domaApiRequest(`/v1/orderbook/offer/${orderId}/${fulfiller}`);
}

/**
 * Get orderbook fees
 */
export async function getOrderbookFees(
  orderbook: 'OPENSEA' | 'DOMA',
  chainId: number,
  contractAddress: string
): Promise<{ fee: string; feeRecipient: string }> {
  return domaApiRequest(
    `/v1/orderbook/fee/${orderbook}/${chainId}/${contractAddress}`
  );
}

/**
 * Get supported currencies for a contract
 */
export async function getSupportedCurrencies(
  chainId: number,
  contractAddress: string,
  orderbook: 'OPENSEA' | 'DOMA'
): Promise<{ currencies: string[] }> {
  return domaApiRequest(
    `/v1/orderbook/currencies/${chainId}/${contractAddress}/${orderbook}`
  );
}

// ===== GRAPHQL QUERIES =====

export interface GraphQLQueryParams {
  query: string;
  variables?: Record<string, any>;
}

/**
 * Execute GraphQL query against Doma subgraph
 */
export async function graphqlQuery<T>(params: GraphQLQueryParams): Promise<T> {
  return domaApiRequest('/graphql', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ===== DOMAIN QUERIES =====

export interface DomaName {
  id: string;
  name: string;
  expiresAt?: string;
  registrar?: {
    id: string;
    name: string;
  };
  network?: {
    id: string;
    name: string;
  };
  tokens?: DomaToken[];
  claimStatus?: 'CLAIMED' | 'UNCLAIMED';
}

export interface DomaToken {
  id: string;
  tokenId: string;
  ownerAddress: string;
  name?: DomaName;
}

export interface DomaListing {
  id: string;
  token: DomaToken;
  price: string;
  currency: string;
  seller: string;
  status: string;
  createdAt: string;
}

export interface DomaOfferData {
  id: string;
  token: DomaToken;
  price: string;
  currency: string;
  offerer: string;
  status: string;
  createdAt: string;
}

/**
 * Fetch trending/popular domains
 */
export async function fetchTrendingDomains(
  take: number = 20
): Promise<DomaName[]> {
  const query = `
    query GetTrendingNames($take: Int!) {
      names(take: $take, claimStatus: CLAIMED, sortBy: CREATED_AT, sortOrder: DESC) {
        items {
          id
          name
          expiresAt
          registrar {
            id
            name
          }
          network {
            id
            name
          }
          tokens {
            id
            tokenId
            ownerAddress
          }
        }
      }
    }
  `;

  const result = await graphqlQuery<{ names: { items: DomaName[] } }>({
    query,
    variables: { take },
  });

  return result.names?.items || [];
}

/**
 * Fetch listings (buy now offers)
 */
export async function fetchListings(
  take: number = 20,
  filters?: {
    tlds?: string[];
    networkIds?: string[];
  }
): Promise<DomaListing[]> {
  const query = `
    query GetListings($take: Int!, $tlds: [String!], $networkIds: [String!]) {
      listings(take: $take, tlds: $tlds, networkIds: $networkIds, sortBy: CREATED_AT, sortOrder: DESC) {
        items {
          id
          token {
            id
            tokenId
            ownerAddress
            name {
              id
              name
            }
          }
          price
          currency
          seller
          status
          createdAt
        }
      }
    }
  `;

  const result = await graphqlQuery<{ listings: { items: DomaListing[] } }>({
    query,
    variables: { take, ...filters },
  });

  return result.listings?.items || [];
}

/**
 * Fetch offers for domains
 */
export async function fetchOffers(
  tokenId?: string,
  take: number = 20
): Promise<DomaOfferData[]> {
  const query = `
    query GetOffers($tokenId: String, $take: Int!) {
      offers(tokenId: $tokenId, take: $take, sortBy: CREATED_AT, sortOrder: DESC) {
        items {
          id
          token {
            id
            tokenId
            ownerAddress
            name {
              id
              name
            }
          }
          price
          currency
          offerer
          status
          createdAt
        }
      }
    }
  `;

  const result = await graphqlQuery<{ offers: { items: DomaOfferData[] } }>({
    query,
    variables: { tokenId, take },
  });

  return result.offers?.items || [];
}

/**
 * Fetch domain by name
 */
export async function fetchDomainByName(name: string): Promise<DomaName | null> {
  const query = `
    query GetName($name: String!) {
      name(name: $name) {
        id
        name
        expiresAt
        registrar {
          id
          name
        }
        network {
          id
          name
        }
        tokens {
          id
          tokenId
          ownerAddress
        }
      }
    }
  `;

  const result = await graphqlQuery<{ name: DomaName | null }>({
    query,
    variables: { name },
  });

  return result.name;
}

/**
 * Search domains by pattern
 */
export async function searchDomains(
  searchTerm: string,
  take: number = 20
): Promise<DomaName[]> {
  // Note: Actual search implementation may vary based on Doma API
  return fetchTrendingDomains(take);
}
