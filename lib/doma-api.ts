/**
 * Doma Protocol API Client
 * Comprehensive integration with Doma APIs for orderbook, fractionalization, and more
 */

// Use proxy API route to avoid CORS issues with x-api-key header
const getDomaApiBase = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/doma`;
  }
  return process.env.NEXT_PUBLIC_DOMA_API_URL || 'https://api-testnet.doma.xyz';
};

// API request helper - routes through Next.js API to avoid CORS
async function domaApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getDomaApiBase();
  const url = endpoint === '/graphql' ? baseUrl : `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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

export interface FulfillmentData {
  order: {
    orderId: string;
    maker: string;
    taker: string;
    price: string;
    signature: string;
  };
  fulfillmentData: {
    contractAddress: string;
    calldata: string;
  };
}

/**
 * Get fulfillment data for a listing
 */
export async function getListingFulfillmentData(
  orderId: string,
  buyer: string
): Promise<FulfillmentData> {
  return domaApiRequest(`/v1/orderbook/listing/${orderId}/${buyer}`);
}

/**
 * Get fulfillment data for an offer
 */
export async function getOfferFulfillmentData(
  orderId: string,
  fulfiller: string
): Promise<FulfillmentData> {
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
  variables?: Record<string, unknown>;
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
  name: string;
  expiresAt?: string;
  transferLock?: boolean;
  registrar?: {
    name: string;
    ianaId?: string;
  };
  tokens?: DomaToken[];
  claimStatus?: 'CLAIMED' | 'UNCLAIMED';
  highestOffer?: any;
  activeOffersCount?: number;
}

export interface DomaToken {
  tokenId: string;
  ownerAddress: string;
  networkId?: string;
  chain?: string;
  tokenAddress?: string;
  imageURI?: string;
}

export interface DomaListing {
  id: string;
  externalId?: string;
  price: string;
  currency: string;
  offererAddress: string;
  orderbook?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DomaOfferData {
  id: string;
  externalId?: string;
  price: string;
  currency: string;
  offererAddress: string;
  orderbook?: string;
  expiresAt?: string;
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
      names(take: $take, claimStatus: CLAIMED, sortBy: DOMAIN, sortOrder: DESC) {
        items {
          name
          expiresAt
          transferLock
          registrar {
            name
            ianaId
          }
          tokens {
            tokenId
            ownerAddress
            networkId
            chain {
              name
              networkId
            }
            tokenAddress
            imageURI
          }
          highestOffer {
            price
            currency {
              name
              symbol
              decimals
            }
          }
          activeOffersCount
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
  take: number = 20
): Promise<DomaListing[]> {
  // Note: Listings query structure may need adjustment based on API docs
  // For now, return empty array as schema needs clarification
  return [];
}

/**
 * Fetch offers for domains
 */
export async function fetchOffers(
  tokenId?: string,
  take: number = 20
): Promise<DomaOfferData[]> {
  // Note: Offers query structure may need adjustment based on API docs
  // For now, return empty array as schema needs clarification
  return [];
}

/**
 * Fetch domain by name
 */
export async function fetchDomainByName(name: string): Promise<DomaName | null> {
  const query = `
    query GetName($name: String!) {
      name(name: $name) {
        name
        expiresAt
        transferLock
        registrar {
          name
          ianaId
        }
        tokens {
          tokenId
          ownerAddress
          networkId
          chain {
            name
            networkId
          }
          tokenAddress
          imageURI
        }
        highestOffer {
          price
          currency {
            name
            symbol
            decimals
          }
        }
        activeOffersCount
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
