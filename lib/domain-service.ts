/**
 * Domain Service - Core business logic for domain operations
 */

import { GraphQLClient } from 'graphql-request';
import { parseEther, Address } from 'viem';

// Domain types
export interface Domain {
  tokenId: string;
  name: string;
  tld: string;
  owner: Address;
  valuation: bigint;
  confidence: number;
  isPremium: boolean;
  expiryTime: bigint;
  metadata?: DomainMetadata;
  fractionalized?: boolean;
}

export interface DomainMetadata {
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  landingPage?: string;
  analytics?: DomainAnalytics;
}

export interface DomainAnalytics {
  views: number;
  uniqueVisitors: number;
  averageTime: number;
  conversionRate: number;
  revenue: bigint;
}

export interface DomainValuation {
  baseValue: bigint;
  marketMultiplier: number;
  factors: {
    length: number;
    brandability: number;
    marketDemand: number;
    historicalSales: number;
  };
}

// GraphQL client setup
const graphqlClient = new GraphQLClient(
  process.env.NEXT_PUBLIC_DOMA_GRAPHQL_URL || 'https://api-testnet.doma.xyz/graphql'
);

// Domain operations
export class DomainService {
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private cache = new Map<string, { data: Domain[]; timestamp: number }>();

  /**
   * Search domains with advanced filters
   */
  async searchDomains(params: {
    query?: string;
    minValue?: bigint;
    maxValue?: bigint;
    tld?: string;
    isPremium?: boolean;
    isAvailable?: boolean;
    sortBy?: 'value' | 'name' | 'expiry';
    limit?: number;
    offset?: number;
  }): Promise<Domain[]> {
    const cacheKey = JSON.stringify(params);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const query = `
      query SearchDomains($filters: DomainFilters!, $pagination: Pagination) {
        domains(filters: $filters, pagination: $pagination) {
          items {
            tokenId
            name
            tld
            owner
            valuation
            confidence
            isPremium
            expiryTime
            metadata
          }
          totalCount
        }
      }
    `;

    const result = await graphqlClient.request(query, {
      filters: {
        query: params.query,
        minValue: params.minValue?.toString(),
        maxValue: params.maxValue?.toString(),
        tld: params.tld,
        isPremium: params.isPremium,
        isAvailable: params.isAvailable,
      },
      pagination: {
        limit: params.limit || 20,
        offset: params.offset || 0,
        sortBy: params.sortBy,
      },
    });

    const domains = this.transformDomains(result.domains.items);
    this.setCache(cacheKey, domains);
    return domains;
  }

  /**
   * Get domain valuation with AI-powered analysis
   */
  async valuateDomain(
    name: string,
    tld: string = 'com'
  ): Promise<DomainValuation> {
    const factors = this.calculateValuationFactors(name, tld);
    const baseValue = this.calculateBaseValue(name, tld, factors);

    // Fetch market data for multiplier
    const marketData = await this.fetchMarketData(tld);
    const marketMultiplier = this.calculateMarketMultiplier(factors, marketData);

    return {
      baseValue,
      marketMultiplier,
      factors,
    };
  }

  /**
   * Register a new domain
   */
  async registerDomain(
    _name: string,
    _tld: string,
    _owner: Address
  ): Promise<{ tokenId: string; txHash: string }> {
    // This would interact with the smart contract
    // For now, returning mock data
    return {
      tokenId: Math.floor(Math.random() * 10000).toString(),
      txHash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    };
  }

  /**
   * Generate landing page for domain
   */
  async generateLandingPage(
    tokenId: string,
    template: 'minimal' | 'business' | 'portfolio' | 'marketplace'
  ): Promise<{ url: string; ipfsHash: string }> {
    const domain = await this.getDomainById(tokenId);

    // Generate page content based on template
    const pageContent = this.generatePageContent(domain, template);

    // Upload to IPFS (mock for now)
    const ipfsHash = await this.uploadToIPFS(pageContent);

    return {
      url: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      ipfsHash,
    };
  }

  /**
   * Get domain analytics
   */
  async getDomainAnalytics(_tokenId: string): Promise<DomainAnalytics> {
    // This would fetch from analytics service
    return {
      views: Math.floor(Math.random() * 10000),
      uniqueVisitors: Math.floor(Math.random() * 5000),
      averageTime: Math.floor(Math.random() * 300),
      conversionRate: Math.random() * 10,
      revenue: BigInt(Math.floor(Math.random() * 1000000)),
    };
  }

  /**
   * Monitor domain events
   */
  subscribeToEvents(
    callback: (event: DomainEvent) => void
  ): () => void {
    // WebSocket subscription for real-time events
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'wss://api-testnet.doma.xyz/ws');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };

    return () => ws.close();
  }

  // Private helper methods
  private calculateValuationFactors(name: string, tld: string) {
    const length = name.length;
    const lengthScore = length <= 3 ? 100 : length <= 5 ? 80 : length <= 8 ? 60 : 40;

    const brandability = this.calculateBrandability(name);
    const marketDemand = this.calculateMarketDemand(name, tld);
    const historicalSales = 50; // Would fetch from historical data

    return {
      length: lengthScore,
      brandability,
      marketDemand,
      historicalSales,
    };
  }

  private calculateBrandability(name: string): number {
    // Simple brandability score based on pronounceability and memorability
    const vowels = name.match(/[aeiou]/gi)?.length || 0;
    const consonants = name.match(/[bcdfghjklmnpqrstvwxyz]/gi)?.length || 0;
    const ratio = vowels / (vowels + consonants);

    if (ratio >= 0.35 && ratio <= 0.65) return 80;
    if (ratio >= 0.25 && ratio <= 0.75) return 60;
    return 40;
  }

  private calculateMarketDemand(name: string, tld: string): number {
    // Mock market demand calculation
    const tldMultiplier = tld === 'com' ? 1.5 : tld === 'io' ? 1.3 : 1;
    return Math.floor(50 * tldMultiplier);
  }

  private calculateBaseValue(
    name: string,
    tld: string,
    factors: DomainValuation['factors']
  ): bigint {
    const averageFactor =
      (factors.length + factors.brandability + factors.marketDemand + factors.historicalSales) / 4;

    const basePrice = parseEther('0.1'); // Base price in ETH
    const multiplier = BigInt(Math.floor(averageFactor));

    return (basePrice * multiplier) / 100n;
  }

  private calculateMarketMultiplier(
    factors: DomainValuation['factors'],
    marketData: any
  ): number {
    // Calculate based on market conditions
    return 100 + Math.floor((factors.marketDemand / 100) * 50);
  }

  private async fetchMarketData(_tld: string): Promise<{ averagePrice: number; volume: number }> {
    // Fetch market data from API
    return { averagePrice: 1000, volume: 50000 };
  }

  private generatePageContent(
    domain: Domain,
    _template: string
  ): string {
    // Generate HTML/React content based on template
    return `<html><!-- Generated content for ${domain.name} --></html>`;
  }

  private async uploadToIPFS(_content: string): Promise<string> {
    // Upload to IPFS (using Pinata or similar)
    return `Qm${Array(44).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  }

  private transformDomains(rawDomains: Array<{
    tokenId?: string;
    name?: string;
    tld?: string;
    owner?: string;
    valuation?: string | number;
    confidence?: number;
    isPremium?: boolean;
    expiryTime?: string | number;
    metadata?: DomainMetadata;
    fractionalized?: boolean;
  }>): Domain[] {
    return rawDomains.map(d => ({
      tokenId: d.tokenId || '0',
      name: d.name || 'unknown',
      tld: d.tld || 'com',
      owner: (d.owner as Address) || '0x0',
      valuation: BigInt(d.valuation || 0),
      confidence: d.confidence || 0,
      isPremium: d.isPremium || false,
      expiryTime: BigInt(d.expiryTime || 0),
      metadata: d.metadata,
      fractionalized: d.fractionalized,
    }));
  }

  private getFromCache(key: string): Domain[] | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: Domain[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getDomainById(tokenId: string): Promise<Domain> {
    // Fetch domain by ID
    const query = `
      query GetDomain($tokenId: String!) {
        domain(tokenId: $tokenId) {
          tokenId
          name
          tld
          owner
          valuation
          confidence
          isPremium
          expiryTime
          metadata
        }
      }
    `;

    const result = await graphqlClient.request(query, { tokenId });
    return this.transformDomains([result.domain])[0];
  }
}

// Event types
export interface DomainEvent {
  type: 'registered' | 'transferred' | 'listed' | 'sold' | 'fractionalized';
  tokenId: string;
  data: any;
  timestamp: number;
}

// Export singleton instance
export const domainService = new DomainService();