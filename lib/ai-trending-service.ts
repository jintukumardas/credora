/**
 * AI-Powered Trending Domains Service
 * Uses Google Generative AI to analyze and predict trending domains
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface TrendingDomain {
  name: string;
  tld: string;
  price: number;
  change: number;
  volume24h: number;
  category: string;
  aiScore: number; // AI-predicted trending score
  reason: string; // AI explanation for trending
}

class AITrendingService {
  private genAI: GoogleGenerativeAI | null = null;
  private modelName = 'gemini-2.5-flash';

  constructor() {
    // Initialize Google AI if API key is available
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;
    if (apiKey && apiKey !== 'your_google_ai_api_key_here' && apiKey !== '') {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  /**
   * Fetch trending domains using AI analysis
   */
  async getTrendingDomains(limit: number = 10): Promise<TrendingDomain[]> {
    if (!this.genAI) {
      // Return realistic mock data if AI is not configured
      return this.getMockTrendingDomains(limit);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });

      const prompt = `
        Analyze current market trends and generate ${limit} trending domain names that would be valuable in today's market.
        Consider factors like:
        - Current technology trends (AI, Web3, blockchain, etc.)
        - Business trends
        - Popular keywords
        - Brandability
        - Market demand

        Return a JSON array with the following structure for each domain:
        {
          "name": "domain name without TLD",
          "tld": "appropriate TLD (com, io, xyz, eth, etc.)",
          "estimatedPrice": "number in USD",
          "priceChange24h": "percentage change",
          "volume24h": "trading volume in USD",
          "category": "tech/finance/gaming/etc",
          "trendingScore": "0-100 score",
          "trendingReason": "brief explanation why it's trending"
        }

        Focus on realistic, brandable domains that would actually be valuable.
        Return ONLY the JSON array, no additional text.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse AI response
      try {
        const jsonStart = text.indexOf('[');
        const jsonEnd = text.lastIndexOf(']') + 1;
        const jsonStr = text.slice(jsonStart, jsonEnd);
        const aiDomains = JSON.parse(jsonStr);

        return aiDomains.map((d: {
          name: string;
          tld: string;
          estimatedPrice: number;
          priceChange24h: number;
          volume24h: number;
          category: string;
          trendingScore: number;
          trendingReason: string;
        }) => ({
          name: d.name,
          tld: d.tld,
          price: d.estimatedPrice,
          change: d.priceChange24h,
          volume24h: d.volume24h,
          category: d.category,
          aiScore: d.trendingScore,
          reason: d.trendingReason,
        }));
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        return this.getMockTrendingDomains(limit);
      }
    } catch (error) {
      console.error('AI trending analysis failed:', error);
      return this.getMockTrendingDomains(limit);
    }
  }

  /**
   * Analyze a specific domain using AI
   */
  async analyzeDomain(name: string, tld: string): Promise<{
    valuation: number;
    trendingScore: number;
    marketAnalysis: string;
    recommendations: string[];
  }> {
    if (!this.genAI) {
      return {
        valuation: Math.floor(Math.random() * 50000) + 1000,
        trendingScore: Math.floor(Math.random() * 100),
        marketAnalysis: 'AI analysis not available',
        recommendations: ['Configure Google AI API key for detailed analysis'],
      };
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });

      const prompt = `
        Analyze the domain "${name}.${tld}" and provide:
        1. Estimated market valuation in USD
        2. Trending score (0-100)
        3. Market analysis (2-3 sentences)
        4. Investment recommendations (2-3 bullet points)

        Consider factors like:
        - Brandability and memorability
        - Current market trends
        - Similar domain sales
        - Industry relevance
        - SEO potential

        Return as JSON with structure:
        {
          "valuation": number,
          "trendingScore": number,
          "marketAnalysis": "string",
          "recommendations": ["string1", "string2", "string3"]
        }

        Return ONLY the JSON, no additional text.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        const jsonStr = text.slice(jsonStart, jsonEnd);
        return JSON.parse(jsonStr);
      } catch {
        throw new Error('Failed to parse AI response');
      }
    } catch (error) {
      console.error('Domain analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get AI-powered market insights
   */
  async getMarketInsights(): Promise<{
    hotCategories: string[];
    risingKeywords: string[];
    priceMovers: { domain: string; change: number }[];
    marketSentiment: 'bullish' | 'bearish' | 'neutral';
    insights: string[];
  }> {
    if (!this.genAI) {
      return this.getDefaultMarketInsights();
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });

      const prompt = `
        Analyze the current domain name market and provide insights:

        Return as JSON:
        {
          "hotCategories": ["top 4 trending categories"],
          "risingKeywords": ["top 4 rising keywords"],
          "priceMovers": [{"domain": "example", "change": percentage}],
          "marketSentiment": "bullish/bearish/neutral",
          "insights": ["2-3 market insights"]
        }

        Focus on realistic, current market trends.
        Return ONLY JSON.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      const jsonStr = text.slice(jsonStart, jsonEnd);
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Market insights failed:', error);
      return this.getDefaultMarketInsights();
    }
  }

  /**
   * Get realistic mock trending domains
   */
  private getMockTrendingDomains(limit: number): TrendingDomain[] {
    const domains = [
      { name: 'aiagent', tld: 'xyz', price: 8500, change: 15.3, volume24h: 125000, category: 'AI', aiScore: 92, reason: 'AI agents are the hottest trend in 2024' },
      { name: 'quantumfi', tld: 'io', price: 6200, change: 12.8, volume24h: 89000, category: 'Finance', aiScore: 88, reason: 'Quantum computing meets DeFi' },
      { name: 'zkproof', tld: 'eth', price: 4800, change: -2.1, volume24h: 67000, category: 'Blockchain', aiScore: 85, reason: 'Zero-knowledge proofs gaining adoption' },
      { name: 'neuralnft', tld: 'com', price: 12000, change: 22.5, volume24h: 180000, category: 'NFT', aiScore: 90, reason: 'Neural network generated NFT marketplace' },
      { name: 'metaverse3', tld: 'xyz', price: 3500, change: 8.7, volume24h: 52000, category: 'Gaming', aiScore: 78, reason: 'Next gen metaverse platform' },
      { name: 'defibank', tld: 'finance', price: 18000, change: 5.2, volume24h: 250000, category: 'DeFi', aiScore: 94, reason: 'Traditional banking meets DeFi' },
      { name: 'cryptoai', tld: 'io', price: 9500, change: 18.9, volume24h: 142000, category: 'Crypto', aiScore: 91, reason: 'AI-powered crypto trading' },
      { name: 'webthree', tld: 'dao', price: 2800, change: -5.3, volume24h: 41000, category: 'Web3', aiScore: 72, reason: 'Web3 infrastructure provider' },
      { name: 'smartchain', tld: 'network', price: 7200, change: 10.1, volume24h: 108000, category: 'Blockchain', aiScore: 86, reason: 'Smart contract platform' },
      { name: 'tokenforge', tld: 'xyz', price: 5100, change: 14.6, volume24h: 76000, category: 'DeFi', aiScore: 83, reason: 'Token creation and management' },
    ];

    return domains.slice(0, limit);
  }

  private getDefaultMarketInsights() {
    return {
      hotCategories: ['AI & Machine Learning', 'DeFi', 'Gaming', 'Enterprise Blockchain'],
      risingKeywords: ['agent', 'quantum', 'neural', 'zk'],
      priceMovers: [
        { domain: 'aiagent.xyz', change: 32.5 },
        { domain: 'quantumfi.io', change: 28.3 },
        { domain: 'zkproof.eth', change: -8.2 },
        { domain: 'neuralnft.com', change: 15.7 },
      ],
      marketSentiment: 'bullish' as const,
      insights: [
        'AI-related domains seeing unprecedented demand with 40% price increases',
        'Web3 gaming domains becoming increasingly valuable as adoption grows',
        'Short, brandable domains in .xyz and .io TLDs commanding premium prices',
      ],
    };
  }
}

// Export singleton instance
export const aiTrendingService = new AITrendingService();