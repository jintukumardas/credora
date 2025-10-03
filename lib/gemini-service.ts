/**
 * Gemini AI Service for Domain-related AI Features
 * Provides domain analysis, name suggestions, and landing page generation
 */

'use client';

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export interface DomainAnalysis {
  domainName: string;
  analysis: {
    marketValue: string;
    industryRelevance: string;
    brandPotential: string;
    seoScore: number;
    memorability: number;
    futureOutlook: string;
    recommendations: string[];
    competitors: string[];
    estimatedValue: string;
  };
}

export interface DomainSuggestion {
  domain: string;
  tld: string;
  reason: string;
  score: number;
  availability?: boolean;
}

export interface LandingPageContent {
  title: string;
  tagline: string;
  heroSection: {
    headline: string;
    subheadline: string;
    ctaText: string;
  };
  features: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  about: string;
  testimonials: Array<{
    text: string;
    author: string;
    role: string;
  }>;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  htmlContent?: string;
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  constructor() {
    // Initialize Gemini AI with API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '';

    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    } else {
      console.warn('Gemini API key not found. AI features will use fallback responses.');
    }
  }

  /**
   * Analyze a domain using Gemini AI
   */
  async analyzeDomain(domainName: string, additionalContext?: string): Promise<DomainAnalysis> {
    try {
      if (!this.model) {
        // Fallback if API key is not configured
        return this.getFallbackAnalysis(domainName);
      }

      const prompt = `
        Analyze the following domain name for business and investment potential: ${domainName}
        ${additionalContext ? `Additional context: ${additionalContext}` : ''}

        Please provide a comprehensive analysis in the following JSON format:
        {
          "marketValue": "Low/Medium/High",
          "industryRelevance": "detailed explanation of industry relevance",
          "brandPotential": "assessment of brand potential and memorability",
          "seoScore": number between 0-100,
          "memorability": number between 0-100,
          "futureOutlook": "future potential and growth outlook",
          "recommendations": ["list", "of", "recommendations"],
          "competitors": ["similar-domain.com", "examples"],
          "estimatedValue": "$X,XXX - $XX,XXX range"
        }

        Be specific and provide actionable insights.
      `;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse JSON from the response
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysisData = JSON.parse(jsonMatch[0]);
          return {
            domainName,
            analysis: {
              marketValue: analysisData.marketValue || 'Medium',
              industryRelevance: analysisData.industryRelevance || 'General purpose domain',
              brandPotential: analysisData.brandPotential || 'Good brand potential',
              seoScore: analysisData.seoScore || 70,
              memorability: analysisData.memorability || 75,
              futureOutlook: analysisData.futureOutlook || 'Stable growth potential',
              recommendations: analysisData.recommendations || ['Build a strong brand', 'Focus on SEO'],
              competitors: analysisData.competitors || [],
              estimatedValue: analysisData.estimatedValue || '$1,000 - $10,000'
            }
          };
        }
      } catch (parseError) {
        console.warn('Failed to parse JSON response, using text response');
      }

      // If JSON parsing fails, extract key information from text
      return {
        domainName,
        analysis: {
          marketValue: text.includes('high') ? 'High' : text.includes('low') ? 'Low' : 'Medium',
          industryRelevance: text.substring(0, 200),
          brandPotential: 'Based on AI analysis',
          seoScore: 75,
          memorability: 80,
          futureOutlook: text.substring(0, 200),
          recommendations: ['AI-generated recommendation based on domain analysis'],
          competitors: [],
          estimatedValue: '$5,000 - $25,000'
        }
      };
    } catch (error) {
      console.error('Error analyzing domain:', error);
      return this.getFallbackAnalysis(domainName);
    }
  }

  private getFallbackAnalysis(domainName: string): DomainAnalysis {
    return {
      domainName,
      analysis: {
        marketValue: 'Medium',
        industryRelevance: 'This domain has potential in various industries',
        brandPotential: 'Good brand potential with proper development',
        seoScore: 70,
        memorability: 75,
        futureOutlook: 'Steady growth potential with the right strategy',
        recommendations: [
          'Develop a clear brand identity',
          'Focus on SEO optimization',
          'Consider multiple monetization strategies'
        ],
        competitors: [],
        estimatedValue: '$1,000 - $10,000'
      }
    };
  }

  /**
   * Get domain name suggestions based on user requirements
   */
  async suggestDomains(
    requirements: {
      businessType: string;
      keywords: string[];
      industry: string;
      targetAudience: string;
      preferredTlds?: string[];
    },
    count: number = 10
  ): Promise<DomainSuggestion[]> {
    try {
      if (!this.model) {
        return this.getFallbackSuggestions(requirements, count);
      }

      const tlds = requirements.preferredTlds || ['com', 'io', 'xyz', 'app', 'dev'];

      const prompt = `
        Generate ${count} creative and brandable domain name suggestions for:
        - Business Type: ${requirements.businessType}
        - Keywords: ${requirements.keywords.join(', ')}
        - Industry: ${requirements.industry}
        - Target Audience: ${requirements.targetAudience}
        - Preferred TLDs: ${tlds.join(', ')}

        Requirements:
        1. Names should be memorable, short (preferably under 15 characters), and brandable
        2. Avoid hyphens and numbers unless they add significant value
        3. Consider wordplay, portmanteaus, and creative combinations
        4. Each name should be unique and not too similar to others

        Return the suggestions in JSON format:
        [
          {
            "domain": "domainname",
            "tld": "com",
            "reason": "why this is a good fit",
            "score": 85
          }
        ]

        Be creative and provide diverse options.
      `;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const suggestionsData = JSON.parse(jsonMatch[0]);
          return suggestionsData.map((s: any) => ({
            domain: s.domain.toLowerCase().replace(/\s+/g, ''),
            tld: s.tld || tlds[0],
            reason: s.reason || 'AI-generated domain suggestion',
            score: s.score || 80,
            availability: true // Would need actual domain availability API
          })).slice(0, count);
        }
      } catch (parseError) {
        console.warn('Failed to parse JSON response');
      }

      // Fallback parsing from text
      const suggestions: DomainSuggestion[] = [];
      const lines = text.split('\n').filter(line => line.trim());

      for (let i = 0; i < Math.min(count, lines.length); i++) {
        const line = lines[i];
        const domainMatch = line.match(/([a-z0-9]+)\.([a-z]+)/i);

        if (domainMatch) {
          suggestions.push({
            domain: domainMatch[1].toLowerCase(),
            tld: domainMatch[2].toLowerCase(),
            reason: 'AI-suggested domain for ' + requirements.businessType,
            score: 85 - i * 2,
            availability: true
          });
        }
      }

      return suggestions.length > 0 ? suggestions : this.getFallbackSuggestions(requirements, count);
    } catch (error) {
      console.error('Error suggesting domains:', error);
      return this.getFallbackSuggestions(requirements, count);
    }
  }

  private getFallbackSuggestions(
    requirements: {
      businessType: string;
      keywords: string[];
      industry: string;
      targetAudience: string;
      preferredTlds?: string[];
    },
    count: number
  ): DomainSuggestion[] {
    const suggestions: DomainSuggestion[] = [];
    const tlds = requirements.preferredTlds || ['com', 'io', 'xyz'];
    const keyword = requirements.keywords[0] || requirements.businessType.toLowerCase().replace(/\s+/g, '');

    const prefixes = ['get', 'my', 'the', 'go', 'try'];
    const suffixes = ['hub', 'pro', 'ly', 'ify', 'zone', 'lab', 'box', 'ai', 'app'];

    for (let i = 0; i < Math.min(count, 9); i++) {
      if (i < 3) {
        suggestions.push({
          domain: keyword,
          tld: tlds[i % tlds.length],
          reason: `Direct match for ${requirements.businessType}`,
          score: 95 - i * 5,
          availability: true
        });
      } else if (i < 6) {
        suggestions.push({
          domain: prefixes[i % prefixes.length] + keyword,
          tld: tlds[i % tlds.length],
          reason: `Action-oriented domain for ${requirements.targetAudience}`,
          score: 85 - (i - 3) * 5,
          availability: true
        });
      } else {
        suggestions.push({
          domain: keyword + suffixes[i % suffixes.length],
          tld: tlds[i % tlds.length],
          reason: `Modern and brandable for ${requirements.industry}`,
          score: 75 - (i - 6) * 5,
          availability: true
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate landing page content for a domain
   */
  async generateLandingPage(
    domain: string,
    businessInfo: {
      type: string;
      description: string;
      targetAudience: string;
      style: 'modern' | 'classic' | 'minimal' | 'bold';
    }
  ): Promise<LandingPageContent> {
    try {
      if (!this.model) {
        return this.getFallbackLandingPage(domain, businessInfo);
      }

      // Detect business category for more targeted content
      const businessCategory = this.detectBusinessCategory(businessInfo.type, businessInfo.description);

      const prompt = `
        Create unique and compelling landing page content for a ${businessCategory} business:
        - Domain: ${domain}
        - Business Type: ${businessInfo.type}
        - Description: ${businessInfo.description || 'Not provided'}
        - Target Audience: ${businessInfo.targetAudience}
        - Design Style: ${businessInfo.style}

        Business Category: ${businessCategory}

        IMPORTANT: Create content that is:
        1. Specifically tailored to ${businessCategory} businesses
        2. Uses industry-specific terminology and benefits
        3. Addresses pain points specific to ${businessInfo.targetAudience}
        4. Has a unique voice and tone appropriate for ${businessInfo.style} style
        5. Features should be specific to ${businessInfo.type}, not generic

        Generate content in JSON format:
        {
          "tagline": "short, memorable tagline specific to ${businessInfo.type}",
          "heroSection": {
            "headline": "powerful headline that speaks to ${businessInfo.targetAudience}",
            "subheadline": "supporting text that addresses specific needs",
            "ctaText": "action-oriented button text appropriate for ${businessCategory}"
          },
          "features": [
            {"title": "Specific Feature for ${businessInfo.type}", "description": "Detailed benefit", "icon": "relevant emoji"},
            {"title": "Another specific feature", "description": "How it helps ${businessInfo.targetAudience}", "icon": "emoji"},
            {"title": "Industry-specific capability", "description": "Technical or business benefit", "icon": "emoji"},
            {"title": "Unique value proposition", "description": "What sets this apart", "icon": "emoji"}
          ],
          "about": "compelling about text that explains the ${businessInfo.type} business mission and values",
          "testimonials": [
            {"text": "specific testimonial relevant to ${businessCategory}", "author": "Realistic Name", "role": "Relevant Title, Industry Company"},
            {"text": "another testimonial addressing ${businessInfo.targetAudience} needs", "author": "Name", "role": "Position, Company"},
            {"text": "testimonial highlighting unique benefits", "author": "Name", "role": "Title, Organization"}
          ]
        }

        Make each feature unique and specific to ${businessInfo.type}.
        Testimonials should sound authentic and industry-appropriate.
        Avoid generic business language - be specific to ${businessCategory}.
      `;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      let generatedContent: any = {};

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          generatedContent = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.warn('Failed to parse JSON response, using fallback');
      }

      const content: LandingPageContent = {
        title: domain,
        tagline: generatedContent.tagline || `Welcome to ${domain} - Your ${businessInfo.type} Solution`,
        heroSection: generatedContent.heroSection || {
          headline: `Transform Your ${businessInfo.type} Experience`,
          subheadline: `Discover innovative solutions tailored for ${businessInfo.targetAudience}`,
          ctaText: 'Get Started Today'
        },
        features: generatedContent.features || this.getDefaultFeatures(businessInfo.type),
        about: generatedContent.about || businessInfo.description ||
               `We provide exceptional ${businessInfo.type} services to ${businessInfo.targetAudience}.`,
        testimonials: generatedContent.testimonials || this.getDefaultTestimonials(),
        contact: {
          email: `hello@${domain}`,
          phone: '+1 (555) 123-4567',
          address: '123 Business Ave, Suite 100, City, ST 12345'
        },
        colorScheme: this.getColorScheme(businessInfo.style)
      };

      // Generate HTML content
      content.htmlContent = this.generateHTML(content);

      return content;
    } catch (error) {
      console.error('Error generating landing page:', error);
      return this.getFallbackLandingPage(domain, businessInfo);
    }
  }

  private getFallbackLandingPage(
    domain: string,
    businessInfo: {
      type: string;
      description: string;
      targetAudience: string;
      style: 'modern' | 'classic' | 'minimal' | 'bold';
    }
  ): LandingPageContent {
    const content: LandingPageContent = {
      title: domain,
      tagline: `Welcome to ${domain}`,
      heroSection: {
        headline: `Your ${businessInfo.type} Solution`,
        subheadline: `Designed for ${businessInfo.targetAudience}`,
        ctaText: 'Get Started'
      },
      features: this.getDefaultFeatures(businessInfo.type),
      about: businessInfo.description || `Providing ${businessInfo.type} services.`,
      testimonials: this.getDefaultTestimonials(),
      contact: {
        email: `contact@${domain}`,
        phone: '+1 (555) 000-0000',
        address: '123 Main St, City, ST 12345'
      },
      colorScheme: this.getColorScheme(businessInfo.style)
    };

    content.htmlContent = this.generateHTML(content, businessInfo.style);
    return content;
  }

  private getDefaultFeatures(businessType: string) {
    return [
      {
        title: 'Innovative Solutions',
        description: `Advanced ${businessType} services for modern needs`,
        icon: '🚀'
      },
      {
        title: 'Expert Team',
        description: 'Dedicated professionals at your service',
        icon: '👥'
      },
      {
        title: 'Scalable Growth',
        description: 'Solutions that grow with your business',
        icon: '📈'
      },
      {
        title: 'Secure Platform',
        description: 'Enterprise-grade security and reliability',
        icon: '🔒'
      }
    ];
  }

  private getDefaultTestimonials() {
    return [
      {
        text: 'Excellent service and outstanding results!',
        author: 'John Smith',
        role: 'CEO, TechCorp'
      },
      {
        text: 'Professional, reliable, and innovative solutions.',
        author: 'Jane Doe',
        role: 'CTO, StartupXYZ'
      },
      {
        text: 'Transformed our business operations completely.',
        author: 'Mike Johnson',
        role: 'Founder, InnovateCo'
      }
    ];
  }

  /**
   * Chat with AI about a domain
   */
  async chatAboutDomain(
    domainName: string,
    message: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    try {
      if (!this.model) {
        return this.getFallbackChatResponse(domainName, message);
      }

      // Build conversation context
      let context = `You are an expert in domain names, domain valuation, SEO, and digital business strategy.
        The user is asking about the domain: ${domainName}

        Previous conversation:
        ${conversationHistory.slice(-5).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

        User's current question: ${message}

        Provide a helpful, detailed response focused on the domain ${domainName}.
        Be specific with actionable advice and insights.`;

      const result = await this.model.generateContent(context);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Error in domain chat:', error);
      return this.getFallbackChatResponse(domainName, message);
    }
  }

  private getFallbackChatResponse(domainName: string, message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('value') || lowerMessage.includes('worth') || lowerMessage.includes('price')) {
      return `The value of ${domainName} depends on several factors including domain length, keyword relevance, TLD, and market demand. Short, memorable domains with commercial keywords typically range from $1,000 to $50,000. For a more accurate valuation, consider factors like search volume, comparable sales, and potential use cases.`;
    }

    if (lowerMessage.includes('seo')) {
      return `${domainName} has SEO potential that depends on its keywords and relevance. Key SEO factors include: domain age (newer domains need time to build authority), keyword match (exact match domains can help), backlink potential, and content quality. Focus on creating valuable content and earning quality backlinks.`;
    }

    if (lowerMessage.includes('business') || lowerMessage.includes('use') || lowerMessage.includes('idea')) {
      return `${domainName} could be used for various business purposes: e-commerce store, SaaS platform, information portal, community forum, or professional services. Consider your target audience and monetization strategy when choosing the business model.`;
    }

    if (lowerMessage.includes('future') || lowerMessage.includes('trend')) {
      return `The future potential of ${domainName} looks promising. Domain values generally appreciate over time, especially for quality names. Consider emerging trends like AI, Web3, and sustainability. Premium domains are becoming scarcer, making good domains more valuable as digital real estate.`;
    }

    if (lowerMessage.includes('buy') || lowerMessage.includes('invest')) {
      return `When evaluating ${domainName} as an investment, consider: market demand, comparable sales, development potential, holding costs, and exit strategy. Domain investing requires patience and market knowledge. Research similar domain sales and industry trends.`;
    }

    return `${domainName} is an interesting domain with various possibilities. Key considerations include its brandability, memorability, and commercial potential. Would you like to know about specific aspects like valuation, SEO potential, business opportunities, or investment outlook?`;
  }

  private getColorScheme(style: 'modern' | 'classic' | 'minimal' | 'bold') {
    // Dynamic color palette generator with more variety
    const colorPalettes = {
      modern: [
        { primary: '#6366f1', secondary: '#8b5cf6', accent: '#ec4899' }, // Purple/Pink
        { primary: '#3b82f6', secondary: '#06b6d4', accent: '#14b8a6' }, // Blue/Teal
        { primary: '#8b5cf6', secondary: '#a855f7', accent: '#d946ef' }, // Violet/Fuchsia
        { primary: '#0ea5e9', secondary: '#6366f1', accent: '#f59e0b' }, // Sky/Indigo/Amber
        { primary: '#10b981', secondary: '#14b8a6', accent: '#f59e0b' }, // Emerald/Teal/Amber
      ],
      classic: [
        { primary: '#1e40af', secondary: '#7c3aed', accent: '#dc2626' }, // Blue/Violet/Red
        { primary: '#0f172a', secondary: '#334155', accent: '#f97316' }, // Slate/Gray/Orange
        { primary: '#164e63', secondary: '#155e75', accent: '#b91c1c' }, // Cyan/Blue/Red
        { primary: '#1e3a8a', secondary: '#312e81', accent: '#991b1b' }, // Navy/Indigo/Red
        { primary: '#14532d', secondary: '#166534', accent: '#c2410c' }, // Forest/Green/Orange
      ],
      minimal: [
        { primary: '#111827', secondary: '#6b7280', accent: '#3b82f6' }, // Gray/Blue
        { primary: '#18181b', secondary: '#71717a', accent: '#10b981' }, // Zinc/Emerald
        { primary: '#1c1917', secondary: '#78716c', accent: '#f97316' }, // Stone/Orange
        { primary: '#171717', secondary: '#737373', accent: '#8b5cf6' }, // Neutral/Purple
        { primary: '#0a0a0a', secondary: '#525252', accent: '#ef4444' }, // Black/Red
      ],
      bold: [
        { primary: '#dc2626', secondary: '#ea580c', accent: '#facc15' }, // Red/Orange/Yellow
        { primary: '#c026d3', secondary: '#d946ef', accent: '#fbbf24' }, // Fuchsia/Pink/Amber
        { primary: '#059669', secondary: '#10b981', accent: '#f59e0b' }, // Emerald/Green/Amber
        { primary: '#e11d48', secondary: '#f43f5e', accent: '#fbbf24' }, // Rose/Pink/Amber
        { primary: '#7c3aed', secondary: '#9333ea', accent: '#22d3ee' }, // Violet/Purple/Cyan
      ]
    };

    // Select a random palette variation for more diversity
    const palettes = colorPalettes[style];
    const randomIndex = Math.floor(Math.random() * palettes.length);
    return palettes[randomIndex];
  }

  private generateHTML(content: LandingPageContent): string {
    const colors = content.colorScheme;

    // Determine business type from the content
    const businessType = this.detectBusinessType(content);
    const layoutStyle = this.getLayoutStyle(businessType, content);

    return layoutStyle;
  }

  private detectBusinessCategory(type: string, description?: string): string {
    const text = `${type} ${description || ''}`.toLowerCase();

    // More granular business detection
    if (text.includes('shop') || text.includes('store') || text.includes('retail') || text.includes('ecommerce')) {
      return 'ecommerce';
    } else if (text.includes('software') || text.includes('saas') || text.includes('app') || text.includes('platform') || text.includes('tool')) {
      return 'saas';
    } else if (text.includes('portfolio') || text.includes('creative') || text.includes('design') || text.includes('art') || text.includes('photography')) {
      return 'portfolio';
    } else if (text.includes('blog') || text.includes('news') || text.includes('magazine') || text.includes('publication')) {
      return 'blog';
    } else if (text.includes('agency') || text.includes('marketing') || text.includes('consulting') || text.includes('services')) {
      return 'agency';
    } else if (text.includes('restaurant') || text.includes('food') || text.includes('cafe') || text.includes('dining')) {
      return 'restaurant';
    } else if (text.includes('fitness') || text.includes('gym') || text.includes('health') || text.includes('wellness')) {
      return 'fitness';
    } else if (text.includes('education') || text.includes('course') || text.includes('learning') || text.includes('academy')) {
      return 'education';
    } else if (text.includes('real estate') || text.includes('property') || text.includes('realty')) {
      return 'realestate';
    } else if (text.includes('crypto') || text.includes('blockchain') || text.includes('nft') || text.includes('web3')) {
      return 'crypto';
    } else if (text.includes('travel') || text.includes('tourism') || text.includes('vacation')) {
      return 'travel';
    } else if (text.includes('finance') || text.includes('bank') || text.includes('investment')) {
      return 'finance';
    }
    return 'corporate';
  }

  private detectBusinessType(content: LandingPageContent): string {
    const text = `${content.tagline} ${content.about} ${content.heroSection.headline}`.toLowerCase();

    if (text.includes('shop') || text.includes('product') || text.includes('buy') || text.includes('store')) {
      return 'ecommerce';
    } else if (text.includes('software') || text.includes('saas') || text.includes('app') || text.includes('platform')) {
      return 'saas';
    } else if (text.includes('portfolio') || text.includes('creative') || text.includes('design') || text.includes('art')) {
      return 'portfolio';
    } else if (text.includes('blog') || text.includes('news') || text.includes('article')) {
      return 'blog';
    } else if (text.includes('agency') || text.includes('service') || text.includes('consult')) {
      return 'agency';
    } else if (text.includes('restaurant') || text.includes('food') || text.includes('menu')) {
      return 'restaurant';
    }
    return 'corporate';
  }

  private getLayoutStyle(businessType: string, content: LandingPageContent): string {
    const colors = content.colorScheme;

    switch(businessType) {
      case 'ecommerce':
        return this.generateEcommerceLayout(content, colors);
      case 'saas':
        return this.generateSaaSLayout(content, colors);
      case 'portfolio':
        return this.generatePortfolioLayout(content, colors);
      case 'blog':
        return this.generateBlogLayout(content, colors);
      case 'agency':
        return this.generateAgencyLayout(content, colors);
      case 'restaurant':
        return this.generateRestaurantLayout(content, colors);
      default:
        return this.generateCorporateLayout(content, colors);
    }
  }

  private generateEcommerceLayout(content: LandingPageContent, colors: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title} - ${content.tagline}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
        }
        .container { max-width: 1400px; margin: 0 auto; padding: 0 20px; }

        /* E-commerce specific header */
        header {
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 0;
        }
        .logo { font-size: 1.8em; font-weight: 900; color: ${colors.primary}; }
        .nav-links {
            display: flex;
            gap: 30px;
            list-style: none;
        }
        .nav-links a {
            color: #333;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s;
        }
        .nav-links a:hover { color: ${colors.primary}; }

        /* Shop Hero */
        .shop-hero {
            background: linear-gradient(135deg, ${colors.primary}15, ${colors.secondary}15);
            padding: 80px 0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            align-items: center;
            gap: 60px;
        }
        .hero-content h1 {
            font-size: 3.5em;
            line-height: 1.2;
            margin-bottom: 20px;
            color: #1a1a1a;
        }
        .hero-content p {
            font-size: 1.3em;
            margin-bottom: 30px;
            color: #666;
        }
        .cta-buttons {
            display: flex;
            gap: 20px;
        }
        .btn-primary {
            padding: 16px 40px;
            background: ${colors.primary};
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            transition: all 0.3s;
        }
        .btn-primary:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .btn-secondary {
            padding: 16px 40px;
            background: transparent;
            border: 2px solid ${colors.primary};
            color: ${colors.primary};
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            transition: all 0.3s;
        }
        .hero-image {
            background: ${colors.secondary}20;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
        }

        /* Product Grid */
        .products {
            padding: 100px 0;
        }
        .section-header {
            text-align: center;
            margin-bottom: 60px;
        }
        .section-header h2 {
            font-size: 3em;
            margin-bottom: 20px;
            color: #1a1a1a;
        }
        .product-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 40px;
        }
        .product-card {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }
        .product-card:hover {
            transform: translateY(-10px);
        }
        .product-image {
            height: 250px;
            background: linear-gradient(135deg, ${colors.primary}30, ${colors.secondary}30);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 4em;
        }
        .product-info {
            padding: 25px;
        }
        .product-info h3 {
            margin-bottom: 10px;
            color: #1a1a1a;
        }
        .product-price {
            font-size: 1.5em;
            color: ${colors.primary};
            font-weight: bold;
        }

        /* Features */
        .features {
            background: #f8f9fa;
            padding: 80px 0;
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 40px;
            margin-top: 50px;
        }
        .feature-card {
            text-align: center;
            padding: 40px;
        }
        .feature-icon {
            font-size: 3.5em;
            margin-bottom: 20px;
        }

        footer {
            background: #1a1a1a;
            color: white;
            padding: 60px 0;
        }
    </style>
</head>
<body>
    <header>
        <nav class="container">
            <div class="logo">${content.title}</div>
            <ul class="nav-links">
                <li><a href="#shop">Shop</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <section class="shop-hero">
        <div class="container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;">
            <div class="hero-content">
                <h1>${content.heroSection.headline}</h1>
                <p>${content.heroSection.subheadline}</p>
                <div class="cta-buttons">
                    <a href="#shop" class="btn-primary">${content.heroSection.ctaText}</a>
                    <a href="#about" class="btn-secondary">Learn More</a>
                </div>
            </div>
            <div class="hero-image">
                <div style="font-size: 8em;">🛍️</div>
            </div>
        </div>
    </section>

    <section class="products">
        <div class="container">
            <div class="section-header">
                <h2>Featured Products</h2>
                <p style="color: #666; font-size: 1.2em;">Discover our curated selection</p>
            </div>
            <div class="product-grid">
                ${content.features.map(f => `
                <div class="product-card">
                    <div class="product-image">${f.icon}</div>
                    <div class="product-info">
                        <h3>${f.title}</h3>
                        <p style="color: #666; margin: 15px 0;">${f.description}</p>
                        <div class="product-price">$99.99</div>
                    </div>
                </div>`).join('')}
            </div>
        </div>
    </section>

    <section class="features">
        <div class="container">
            <div class="section-header">
                <h2>Why Shop With Us</h2>
            </div>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">🚚</div>
                    <h3>Free Shipping</h3>
                    <p>On orders over $50</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🔒</div>
                    <h3>Secure Payments</h3>
                    <p>100% secure transactions</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">↩️</div>
                    <h3>Easy Returns</h3>
                    <p>30-day return policy</p>
                </div>
            </div>
        </div>
    </section>

    <footer>
        <div class="container" style="text-align: center;">
            <p>© 2024 ${content.title}. All rights reserved.</p>
            <p style="margin-top: 20px;">${content.contact.email} | ${content.contact.phone}</p>
        </div>
    </footer>
</body>
</html>`;
  }

  private generateSaaSLayout(content: LandingPageContent, colors: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title} - ${content.tagline}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'SF Pro Display', -apple-system, sans-serif;
            color: #0a0a0a;
            background: white;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

        /* SaaS Modern Header */
        header {
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(10px);
            position: fixed;
            width: 100%;
            top: 0;
            z-index: 1000;
            border-bottom: 1px solid rgba(0,0,0,0.1);
        }
        nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 18px 0;
        }
        .logo {
            font-size: 1.5em;
            font-weight: bold;
            background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        /* Hero with Gradient */
        .hero {
            padding: 150px 0 100px;
            background: linear-gradient(135deg, ${colors.primary}08, ${colors.secondary}08);
            position: relative;
            overflow: hidden;
        }
        .hero::before {
            content: '';
            position: absolute;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, ${colors.primary}20 1px, transparent 1px);
            background-size: 50px 50px;
            animation: drift 20s infinite linear;
        }
        @keyframes drift {
            to { transform: translate(50px, 50px); }
        }
        .hero-content {
            position: relative;
            text-align: center;
            max-width: 900px;
            margin: 0 auto;
        }
        .hero h1 {
            font-size: 4em;
            line-height: 1.1;
            margin-bottom: 30px;
            background: linear-gradient(135deg, #0a0a0a 30%, ${colors.primary});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .hero p {
            font-size: 1.4em;
            color: #666;
            margin-bottom: 40px;
        }
        .cta-container {
            display: flex;
            gap: 20px;
            justify-content: center;
        }
        .btn-gradient {
            padding: 18px 45px;
            background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            transition: all 0.3s;
            box-shadow: 0 4px 15px ${colors.primary}40;
        }
        .btn-gradient:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px ${colors.primary}50;
        }

        /* Features with Cards */
        .features {
            padding: 100px 0;
            background: #fafafa;
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            margin-top: 60px;
        }
        .feature-card {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.08);
            transition: all 0.3s;
        }
        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 50px rgba(0,0,0,0.12);
        }
        .feature-icon {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}20);
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8em;
            margin-bottom: 20px;
        }

        /* Testimonials */
        .testimonials {
            padding: 100px 0;
        }
        .testimonial-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            margin-top: 50px;
        }
        .testimonial {
            background: linear-gradient(135deg, ${colors.primary}05, ${colors.secondary}05);
            padding: 35px;
            border-radius: 20px;
            border: 1px solid ${colors.primary}20;
        }
        .stars {
            color: gold;
            margin-bottom: 20px;
        }

        footer {
            background: linear-gradient(135deg, #0a0a0a, #1a1a1a);
            color: white;
            padding: 80px 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <header>
        <nav class="container">
            <div class="logo">${content.title}</div>
            <div style="display: flex; gap: 30px;">
                <a href="#features" style="color: #666; text-decoration: none; font-weight: 500;">Features</a>
                <a href="#pricing" style="color: #666; text-decoration: none; font-weight: 500;">Pricing</a>
                <a href="#" class="btn-gradient" style="padding: 10px 25px; font-size: 0.9em;">Start Free Trial</a>
            </div>
        </nav>
    </header>

    <section class="hero">
        <div class="container">
            <div class="hero-content">
                <h1>${content.heroSection.headline}</h1>
                <p>${content.heroSection.subheadline}</p>
                <div class="cta-container">
                    <a href="#" class="btn-gradient">${content.heroSection.ctaText}</a>
                </div>
            </div>
        </div>
    </section>

    <section class="features">
        <div class="container">
            <div style="text-align: center; margin-bottom: 60px;">
                <h2 style="font-size: 3em; margin-bottom: 20px;">Powerful Features</h2>
                <p style="font-size: 1.2em; color: #666;">Everything you need to succeed</p>
            </div>
            <div class="features-grid">
                ${content.features.map(f => `
                <div class="feature-card">
                    <div class="feature-icon">${f.icon}</div>
                    <h3 style="margin-bottom: 15px; font-size: 1.5em;">${f.title}</h3>
                    <p style="color: #666; line-height: 1.8;">${f.description}</p>
                </div>`).join('')}
            </div>
        </div>
    </section>

    <section class="testimonials">
        <div class="container">
            <h2 style="text-align: center; font-size: 3em; margin-bottom: 50px;">Loved by Teams Worldwide</h2>
            <div class="testimonial-grid">
                ${content.testimonials.map(t => `
                <div class="testimonial">
                    <div class="stars">★★★★★</div>
                    <p style="margin-bottom: 20px; line-height: 1.8;">"${t.text}"</p>
                    <div style="font-weight: bold;">${t.author}</div>
                    <div style="color: #666; font-size: 0.9em;">${t.role}</div>
                </div>`).join('')}
            </div>
        </div>
    </section>

    <footer>
        <div class="container">
            <div class="logo" style="font-size: 2em; margin-bottom: 20px;">${content.title}</div>
            <p>© 2024 ${content.title}. All rights reserved.</p>
            <p style="margin-top: 20px; opacity: 0.8;">${content.contact.email}</p>
        </div>
    </footer>
</body>
</html>`;
  }

  private generatePortfolioLayout(content: LandingPageContent, colors: any): string {
    return this.generateCreativeLayout(content, colors, 'portfolio');
  }

  private generateBlogLayout(content: LandingPageContent, colors: any): string {
    return this.generateCreativeLayout(content, colors, 'blog');
  }

  private generateAgencyLayout(content: LandingPageContent, colors: any): string {
    return this.generateCreativeLayout(content, colors, 'agency');
  }

  private generateRestaurantLayout(content: LandingPageContent, colors: any): string {
    return this.generateCreativeLayout(content, colors, 'restaurant');
  }

  private generateCorporateLayout(content: LandingPageContent, colors: any): string {
    return this.generateCreativeLayout(content, colors, 'corporate');
  }

  private generateCreativeLayout(content: LandingPageContent, colors: any, type: string): string {
    // Dynamic layout based on type with unique styling
    const layoutStyles = {
      portfolio: {
        font: 'Helvetica Neue',
        heroLayout: 'split',
        cardStyle: 'minimal',
        bgPattern: 'dots'
      },
      blog: {
        font: 'Georgia',
        heroLayout: 'centered',
        cardStyle: 'article',
        bgPattern: 'none'
      },
      agency: {
        font: 'Montserrat',
        heroLayout: 'bold',
        cardStyle: 'modern',
        bgPattern: 'gradient'
      },
      restaurant: {
        font: 'Playfair Display',
        heroLayout: 'elegant',
        cardStyle: 'menu',
        bgPattern: 'texture'
      },
      corporate: {
        font: 'Inter',
        heroLayout: 'professional',
        cardStyle: 'classic',
        bgPattern: 'subtle'
      }
    };

    const style = layoutStyles[type as keyof typeof layoutStyles] || layoutStyles.corporate;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title} - ${content.tagline}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: '${style.font}', -apple-system, sans-serif;
            line-height: 1.7;
            color: #2c2c2c;
        }

        ${type === 'portfolio' ? `
        /* Portfolio Style */
        .hero {
            min-height: 100vh;
            display: grid;
            grid-template-columns: 1fr 1fr;
            background: linear-gradient(45deg, ${colors.primary}10, transparent);
        }
        .hero-content {
            padding: 100px 60px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .hero-visual {
            background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
            clip-path: polygon(20% 0%, 100% 0, 100% 100%, 0% 100%);
        }
        .portfolio-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 0;
        }
        .portfolio-item {
            aspect-ratio: 1;
            background: linear-gradient(135deg, ${colors.primary}50, ${colors.secondary}50);
            position: relative;
            overflow: hidden;
        }
        .portfolio-item:hover .overlay {
            opacity: 1;
        }
        .overlay {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: 0.3s;
            color: white;
        }
        ` : type === 'blog' ? `
        /* Blog Style */
        .hero {
            padding: 120px 0 80px;
            background: linear-gradient(to bottom, #fafafa, white);
            text-align: center;
        }
        .article-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 60px;
            max-width: 1200px;
            margin: 80px auto;
            padding: 0 20px;
        }
        .article-card {
            background: white;
            border-bottom: 1px solid #eee;
            padding: 40px 0;
        }
        .article-card h3 {
            font-size: 2em;
            margin-bottom: 15px;
            font-weight: normal;
        }
        .meta {
            color: #999;
            margin-bottom: 20px;
        }
        .sidebar {
            position: sticky;
            top: 100px;
        }
        .sidebar-widget {
            background: #fafafa;
            padding: 30px;
            margin-bottom: 30px;
            border-radius: 10px;
        }
        ` : type === 'restaurant' ? `
        /* Restaurant Style */
        body {
            background: #0a0a0a;
            color: #f5f5f5;
        }
        .hero {
            min-height: 100vh;
            background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)),
                        linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .hero h1 {
            font-size: 5em;
            font-weight: 300;
            letter-spacing: 0.1em;
            margin-bottom: 20px;
        }
        .menu-section {
            padding: 100px 0;
            background: #111;
        }
        .menu-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 60px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .menu-item {
            border-left: 2px solid ${colors.accent};
            padding-left: 30px;
        }
        .price {
            color: ${colors.accent};
            font-size: 1.5em;
            margin-top: 10px;
        }
        ` : `
        /* Default Creative Style */
        .hero {
            padding: 120px 0 80px;
            background: linear-gradient(135deg, ${colors.primary}15, ${colors.secondary}10);
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 40px;
            margin-top: 60px;
        }
        `}

        .container { max-width: 1400px; margin: 0 auto; padding: 0 20px; }

        h1 {
            font-size: ${type === 'restaurant' ? '5em' : '3.5em'};
            line-height: 1.2;
            margin-bottom: 20px;
        }

        .btn {
            display: inline-block;
            padding: ${type === 'restaurant' ? '20px 50px' : '16px 40px'};
            background: ${type === 'restaurant' ? 'transparent' : `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`};
            color: ${type === 'restaurant' ? colors.accent : 'white'};
            text-decoration: none;
            border: ${type === 'restaurant' ? `2px solid ${colors.accent}` : 'none'};
            border-radius: ${type === 'blog' ? '5px' : type === 'restaurant' ? '0' : '50px'};
            font-weight: ${type === 'restaurant' ? '300' : '600'};
            letter-spacing: ${type === 'restaurant' ? '0.1em' : '0'};
            transition: all 0.3s;
        }

        .btn:hover {
            transform: ${type === 'restaurant' ? 'none' : 'translateY(-3px)'};
            background: ${type === 'restaurant' ? colors.accent : `linear-gradient(135deg, ${colors.secondary}, ${colors.primary})`};
            color: ${type === 'restaurant' ? '#0a0a0a' : 'white'};
        }
    </style>
</head>
<body>
    ${type === 'portfolio' ? `
    <section class="hero">
        <div class="hero-content">
            <h1>${content.heroSection.headline}</h1>
            <p style="font-size: 1.3em; margin-bottom: 40px; opacity: 0.9;">${content.heroSection.subheadline}</p>
            <div><a href="#work" class="btn">${content.heroSection.ctaText}</a></div>
        </div>
        <div class="hero-visual"></div>
    </section>
    <section class="portfolio-grid" id="work">
        ${content.features.map(f => `
        <div class="portfolio-item">
            <div class="overlay">
                <h3 style="font-size: 2em; margin-bottom: 10px;">${f.title}</h3>
                <p>${f.description}</p>
            </div>
        </div>`).join('')}
    </section>
    ` : type === 'blog' ? `
    <section class="hero">
        <div class="container">
            <h1 style="font-weight: normal;">${content.heroSection.headline}</h1>
            <p style="font-size: 1.3em; color: #666; max-width: 600px; margin: 0 auto 40px;">${content.heroSection.subheadline}</p>
            <a href="#articles" class="btn">${content.heroSection.ctaText}</a>
        </div>
    </section>
    <div class="article-grid" id="articles">
        <main>
            ${content.features.map((f, i) => `
            <article class="article-card">
                <h3>${f.title}</h3>
                <div class="meta">Published ${i + 1} days ago • 5 min read</div>
                <p style="font-size: 1.1em; line-height: 1.8; color: #444;">${f.description}</p>
                <a href="#" style="color: ${colors.primary}; text-decoration: none;">Read more →</a>
            </article>`).join('')}
        </main>
        <aside class="sidebar">
            <div class="sidebar-widget">
                <h4 style="margin-bottom: 20px;">About</h4>
                <p style="color: #666;">${content.about}</p>
            </div>
            <div class="sidebar-widget">
                <h4 style="margin-bottom: 20px;">Categories</h4>
                <ul style="list-style: none;">
                    <li style="padding: 8px 0;"><a href="#" style="color: #666; text-decoration: none;">Technology</a></li>
                    <li style="padding: 8px 0;"><a href="#" style="color: #666; text-decoration: none;">Design</a></li>
                    <li style="padding: 8px 0;"><a href="#" style="color: #666; text-decoration: none;">Business</a></li>
                </ul>
            </div>
        </aside>
    </div>
    ` : type === 'restaurant' ? `
    <section class="hero">
        <div class="container">
            <h1>${content.heroSection.headline}</h1>
            <p style="font-size: 1.5em; margin-bottom: 40px; font-weight: 300;">${content.heroSection.subheadline}</p>
            <a href="#menu" class="btn">${content.heroSection.ctaText}</a>
        </div>
    </section>
    <section class="menu-section" id="menu">
        <div class="container">
            <h2 style="text-align: center; font-size: 3em; margin-bottom: 60px; font-weight: 300;">Our Specialties</h2>
            <div class="menu-grid">
                ${content.features.map(f => `
                <div class="menu-item">
                    <h3 style="font-size: 1.8em; margin-bottom: 10px; color: ${colors.accent};">${f.title}</h3>
                    <p style="opacity: 0.8; line-height: 1.6;">${f.description}</p>
                    <div class="price">$${Math.floor(Math.random() * 50) + 20}</div>
                </div>`).join('')}
            </div>
        </div>
    </section>
    ` : `
    <section class="hero">
        <div class="container" style="text-align: center;">
            <h1>${content.heroSection.headline}</h1>
            <p style="font-size: 1.3em; margin-bottom: 40px; color: #666; max-width: 700px; margin-left: auto; margin-right: auto;">${content.heroSection.subheadline}</p>
            <a href="#" class="btn">${content.heroSection.ctaText}</a>
        </div>
    </section>
    <section style="padding: 100px 0;">
        <div class="container">
            <h2 style="text-align: center; font-size: 3em; margin-bottom: 20px;">What We Offer</h2>
            <div class="feature-grid">
                ${content.features.map(f => `
                <div style="text-align: center;">
                    <div style="font-size: 3em; margin-bottom: 20px;">${f.icon}</div>
                    <h3 style="margin-bottom: 15px;">${f.title}</h3>
                    <p style="color: #666;">${f.description}</p>
                </div>`).join('')}
            </div>
        </div>
    </section>
    `}

    <section style="padding: 80px 0; background: ${type === 'restaurant' ? '#0a0a0a' : '#fafafa'};">
        <div class="container">
            <h2 style="text-align: center; font-size: 2.5em; margin-bottom: 50px;">What People Say</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px;">
                ${content.testimonials.map(t => `
                <div style="padding: 30px; background: ${type === 'restaurant' ? '#111' : 'white'}; border-radius: 10px;">
                    <p style="font-style: italic; margin-bottom: 20px;">"${t.text}"</p>
                    <div>
                        <strong>${t.author}</strong><br>
                        <span style="opacity: 0.7; font-size: 0.9em;">${t.role}</span>
                    </div>
                </div>`).join('')}
            </div>
        </div>
    </section>

    <footer style="padding: 60px 0; background: ${type === 'restaurant' ? '#000' : '#1a1a1a'}; color: white; text-align: center;">
        <div class="container">
            <h3 style="margin-bottom: 20px;">${content.title}</h3>
            <p style="margin-bottom: 10px;">${content.contact.email}</p>
            <p>${content.contact.phone}</p>
            <p style="margin-top: 30px; opacity: 0.6;">© 2024 ${content.title}. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`;
  }
}

export const geminiService = new GeminiService();