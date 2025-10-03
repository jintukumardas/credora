/**
 * Landing Page Generator with Event-Driven SSR
 */

import { EventEmitter } from 'events';
import { Address } from 'viem';

interface DomainData {
  id: string;
  name: string;
  tld: string;
  owner: string;
  price: string;
  listed: boolean;
}

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  components: PageComponent[];
  styles: PageStyles;
}

interface FeatureItem {
  title: string;
  description: string;
}

export interface PageComponent {
  type: 'header' | 'hero' | 'features' | 'gallery' | 'contact' | 'footer';
  props: Record<string, string | number | boolean | string[] | Record<string, string> | FeatureItem[]>;
  order: number;
}

export interface PageStyles {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  backgroundType: 'gradient' | 'image' | 'video' | 'solid';
  animations: boolean;
}

export interface GeneratedPage {
  id: string;
  domainId: string;
  url: string;
  ipfsHash: string;
  template: string;
  createdAt: Date;
  updatedAt: Date;
  analytics: PageAnalytics;
}

export interface PageAnalytics {
  views: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgDuration: number;
  conversions: number;
}

export class LandingPageGenerator extends EventEmitter {
  private templates: Map<string, PageTemplate> = new Map();
  private pages: Map<string, GeneratedPage> = new Map();
  private renderQueue: Array<{ domainId: string; template: string }> = [];
  private isProcessing = false;

  constructor() {
    super();
    this.initializeTemplates();
    this.setupEventListeners();
  }

  /**
   * Initialize default templates
   */
  private initializeTemplates() {
    // Minimal Template
    this.templates.set('minimal', {
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean and simple landing page',
      preview: '/templates/minimal.png',
      components: [
        {
          type: 'header',
          props: { logo: true, navigation: false },
          order: 1,
        },
        {
          type: 'hero',
          props: {
            title: '{{domain.name}}',
            subtitle: 'Premium Domain For Sale',
            cta: true
          },
          order: 2,
        },
        {
          type: 'footer',
          props: { minimal: true },
          order: 3,
        },
      ],
      styles: {
        primaryColor: '#8B5CF6',
        secondaryColor: '#1F2937',
        fontFamily: 'Inter',
        backgroundType: 'gradient',
        animations: true,
      },
    });

    // Business Template
    this.templates.set('business', {
      id: 'business',
      name: 'Business',
      description: 'Professional business landing page',
      preview: '/templates/business.png',
      components: [
        {
          type: 'header',
          props: { logo: true, navigation: true, sticky: true },
          order: 1,
        },
        {
          type: 'hero',
          props: {
            title: '{{domain.name}}',
            subtitle: 'Transform Your Business',
            cta: true,
            image: true,
          },
          order: 2,
        },
        {
          type: 'features',
          props: {
            columns: 3,
            icons: true,
            features: [
              { title: 'Premium Domain', description: 'Stand out with a memorable domain' },
              { title: 'SEO Ready', description: 'Optimized for search engines' },
              { title: 'Brand Authority', description: 'Build trust and credibility' },
            ],
          },
          order: 3,
        },
        {
          type: 'contact',
          props: { form: true, info: true },
          order: 4,
        },
        {
          type: 'footer',
          props: { extended: true },
          order: 5,
        },
      ],
      styles: {
        primaryColor: '#3B82F6',
        secondaryColor: '#111827',
        fontFamily: 'Poppins',
        backgroundType: 'solid',
        animations: false,
      },
    });

    // Portfolio Template
    this.templates.set('portfolio', {
      id: 'portfolio',
      name: 'Portfolio',
      description: 'Creative portfolio showcase',
      preview: '/templates/portfolio.png',
      components: [
        {
          type: 'header',
          props: { logo: false, navigation: true, minimal: true },
          order: 1,
        },
        {
          type: 'hero',
          props: {
            title: '{{domain.name}}',
            subtitle: 'Creative Portfolio',
            fullscreen: true,
            parallax: true,
          },
          order: 2,
        },
        {
          type: 'gallery',
          props: {
            grid: true,
            columns: 3,
            lightbox: true,
            filter: true,
          },
          order: 3,
        },
        {
          type: 'contact',
          props: { minimal: true, social: true },
          order: 4,
        },
        {
          type: 'footer',
          props: { copyright: true },
          order: 5,
        },
      ],
      styles: {
        primaryColor: '#EC4899',
        secondaryColor: '#18181B',
        fontFamily: 'Montserrat',
        backgroundType: 'image',
        animations: true,
      },
    });
  }

  /**
   * Setup event listeners for domain events
   */
  private setupEventListeners() {
    // Listen for domain registration events
    this.on('domain:registered', async (event) => {
      await this.autoGeneratePage(event.domainId, 'minimal');
    });

    // Listen for domain transfer events
    this.on('domain:transferred', async (event) => {
      await this.updatePageOwnership(event.domainId, event.newOwner);
    });

    // Listen for domain listing events
    this.on('domain:listed', async (event) => {
      await this.updatePageListing(event.domainId, event.price);
    });
  }

  /**
   * Generate a landing page for a domain
   */
  async generatePage(
    domainId: string,
    templateId: string,
    customization?: Partial<PageTemplate>
  ): Promise<GeneratedPage> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Merge customization with template
    const finalTemplate = customization
      ? this.mergeTemplates(template, customization)
      : template;

    // Add to render queue
    this.renderQueue.push({ domainId, template: templateId });

    // Process queue if not already processing
    if (!this.isProcessing) {
      await this.processRenderQueue();
    }

    // Generate page HTML
    const html = await this.renderTemplate(domainId, finalTemplate);

    // Upload to IPFS
    const ipfsHash = await this.uploadToIPFS(html);

    // Create page record
    const page: GeneratedPage = {
      id: `page-${domainId}-${Date.now()}`,
      domainId,
      url: `https://ipfs.io/ipfs/${ipfsHash}`,
      ipfsHash,
      template: templateId,
      createdAt: new Date(),
      updatedAt: new Date(),
      analytics: {
        views: 0,
        uniqueVisitors: 0,
        bounceRate: 0,
        avgDuration: 0,
        conversions: 0,
      },
    };

    this.pages.set(page.id, page);

    // Emit event
    this.emit('page:generated', { domainId, pageId: page.id, url: page.url });

    return page;
  }

  /**
   * Render template to HTML
   */
  private async renderTemplate(
    domainId: string,
    template: PageTemplate
  ): Promise<string> {
    // Fetch domain data
    const domainData = await this.fetchDomainData(domainId) as DomainData;

    try {
      // First, try to use Gemini AI to generate the HTML
      const html = await this.generateWithGeminiAI(domainData, template);
      if (html) {
        return html;
      }
    } catch (error) {
      console.warn('Gemini AI generation failed, falling back to template rendering:', error);
    }

    // Fallback to template-based rendering if Gemini fails
    return this.renderTemplateWithFallback(domainData, template);
  }

  /**
   * Generate HTML using Gemini AI
   */
  private async generateWithGeminiAI(
    domainData: DomainData,
    template: PageTemplate
  ): Promise<string | null> {
    try {
      // Dynamically import Gemini service to avoid circular dependencies
      const { geminiService } = await import('./gemini-service');

      // Prepare business info for Gemini
      const businessInfo = {
        type: domainData.name,
        description: `Premium domain ${domainData.name}.${domainData.tld} ${domainData.listed ? `available for ${domainData.price} ETH` : ''}`,
        targetAudience: 'Domain investors and businesses',
        style: this.detectStyleFromTemplate(template)
      };

      // Generate landing page content with Gemini
      const landingPageContent = await geminiService.generateLandingPage(
        `${domainData.name}.${domainData.tld}`,
        businessInfo
      );

      // Return the generated HTML content
      if (landingPageContent.htmlContent) {
        // Inject analytics script
        const analyticsScript = `
        <script>
            // Analytics tracking
            (function() {
                const domainId = '${domainData.id}';
                const pageId = '${Date.now()}';

                // Track page view
                fetch('/api/analytics/pageview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ domainId, pageId })
                });

                // Track time on page
                let startTime = Date.now();
                window.addEventListener('beforeunload', () => {
                    const duration = Date.now() - startTime;
                    navigator.sendBeacon('/api/analytics/duration',
                        JSON.stringify({ domainId, pageId, duration }));
                });
            })();
        </script>`;

        // Insert analytics before closing body tag
        return landingPageContent.htmlContent.replace('</body>', `${analyticsScript}</body>`);
      }

      return null;
    } catch (error) {
      console.error('Failed to generate with Gemini AI:', error);
      return null;
    }
  }

  /**
   * Detect style from template for Gemini
   */
  private detectStyleFromTemplate(template: PageTemplate): 'modern' | 'classic' | 'minimal' | 'bold' {
    const primaryColor = template.styles.primaryColor.toLowerCase();
    const animations = template.styles.animations;

    if (template.id === 'minimal' || template.components.length <= 3) {
      return 'minimal';
    }
    if (template.id === 'business' || primaryColor.includes('#3b82f6')) {
      return 'classic';
    }
    if (animations && (primaryColor.includes('#ec4899') || primaryColor.includes('#8b5cf6'))) {
      return 'bold';
    }
    return 'modern';
  }

  /**
   * Fallback template-based rendering
   */
  private async renderTemplateWithFallback(
    domainData: DomainData,
    template: PageTemplate
  ): Promise<string> {
    // Build HTML
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${domainData.name}.${domainData.tld}</title>
    <meta name="description" content="Premium domain ${domainData.name}.${domainData.tld} is available">
    <style>
        :root {
            --primary-color: ${template.styles.primaryColor};
            --secondary-color: ${template.styles.secondaryColor};
            --font-family: ${template.styles.fontFamily}, sans-serif;
        }
        body {
            font-family: var(--font-family);
            margin: 0;
            padding: 0;
            background: ${this.getBackgroundStyle(template.styles)};
        }
        ${this.getComponentStyles(template)}
    </style>
</head>
<body>`;

    // Render components
    for (const component of template.components.sort((a, b) => a.order - b.order)) {
      html += await this.renderComponent(component, domainData);
    }

    html += `
    <script>
        // Analytics tracking
        (function() {
            const domainId = '${domainData.id}';
            const pageId = '${Date.now()}';

            // Track page view
            fetch('/api/analytics/pageview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domainId, pageId })
            });

            // Track time on page
            let startTime = Date.now();
            window.addEventListener('beforeunload', () => {
                const duration = Date.now() - startTime;
                navigator.sendBeacon('/api/analytics/duration',
                    JSON.stringify({ domainId, pageId, duration }));
            });
        })();
    </script>
</body>
</html>`;

    return html;
  }

  /**
   * Render individual component
   */
  private async renderComponent(
    component: PageComponent,
    domainData: DomainData
  ): Promise<string> {
    switch (component.type) {
      case 'header':
        return this.renderHeader(component.props, domainData);
      case 'hero':
        return this.renderHero(component.props, domainData);
      case 'features':
        return this.renderFeatures(component.props, domainData);
      case 'gallery':
        return this.renderGallery(component.props, domainData);
      case 'contact':
        return this.renderContact(component.props, domainData);
      case 'footer':
        return this.renderFooter(component.props, domainData);
      default:
        return '';
    }
  }

  private renderHeader(props: PageComponent['props'], domainData: DomainData): string {
    return `
    <header class="header ${props.sticky ? 'sticky' : ''}">
        <div class="container">
            ${props.logo ? `<div class="logo">${domainData.name}</div>` : ''}
            ${props.navigation ? `
            <nav class="nav">
                <a href="#features">Features</a>
                <a href="#contact">Contact</a>
                <a href="#buy" class="cta-button">Buy Now</a>
            </nav>
            ` : ''}
        </div>
    </header>`;
  }

  private renderHero(props: PageComponent['props'], domainData: DomainData): string {
    const title = typeof props.title === 'string' ? props.title.replace('{{domain.name}}', domainData.name) : '';
    return `
    <section class="hero ${props.fullscreen ? 'fullscreen' : ''}">
        <div class="container">
            <h1 class="hero-title">${title}.${domainData.tld}</h1>
            <p class="hero-subtitle">${props.subtitle || ''}</p>
            ${props.cta ? `
            <div class="hero-cta">
                <button class="btn-primary">Make an Offer</button>
                <button class="btn-secondary">View Details</button>
            </div>
            ` : ''}
        </div>
    </section>`;
  }

  private renderFeatures(props: PageComponent['props'], _domainData: DomainData): string {
    let features = '';
    const featuresList = props.features as FeatureItem[] || [];
    for (const feature of featuresList) {
      features += `
        <div class="feature">
            <h3>${feature.title}</h3>
            <p>${feature.description}</p>
        </div>`;
    }
    return `
    <section class="features">
        <div class="container">
            <div class="features-grid cols-${props.columns}">
                ${features}
            </div>
        </div>
    </section>`;
  }

  private renderGallery(props: PageComponent['props'], _domainData: DomainData): string {
    return `
    <section class="gallery">
        <div class="container">
            <div class="gallery-grid cols-${props.columns || 3}">
                <!-- Gallery items would be dynamically loaded -->
            </div>
        </div>
    </section>`;
  }

  private renderContact(props: PageComponent['props'], domainData: DomainData): string {
    return `
    <section class="contact">
        <div class="container">
            <h2>Get in Touch</h2>
            ${props.form ? `
            <form class="contact-form" action="/api/contact" method="POST">
                <input type="hidden" name="domainId" value="${domainData.id}">
                <input type="email" name="email" placeholder="Your Email" required>
                <textarea name="message" placeholder="Your Message" required></textarea>
                <button type="submit">Send Message</button>
            </form>
            ` : ''}
        </div>
    </section>`;
  }

  private renderFooter(_props: PageComponent['props'], domainData: DomainData): string {
    return `
    <footer class="footer">
        <div class="container">
            <p>&copy; 2025 ${domainData.name}.${domainData.tld}. Powered by Credora.</p>
        </div>
    </footer>`;
  }

  private getBackgroundStyle(styles: PageStyles): string {
    switch (styles.backgroundType) {
      case 'gradient':
        return `linear-gradient(135deg, ${styles.primaryColor}22, ${styles.secondaryColor})`;
      case 'solid':
        return styles.secondaryColor;
      default:
        return '#000';
    }
  }

  private getComponentStyles(template: PageTemplate): string {
    return `
      .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
      .header { padding: 20px 0; background: rgba(0,0,0,0.1); }
      .header.sticky { position: fixed; top: 0; width: 100%; z-index: 1000; backdrop-filter: blur(10px); }
      .hero { padding: 100px 0; text-align: center; }
      .hero.fullscreen { min-height: 100vh; display: flex; align-items: center; }
      .hero-title { font-size: 4rem; margin-bottom: 20px; color: var(--primary-color); }
      .hero-subtitle { font-size: 1.5rem; color: #666; }
      .btn-primary { background: var(--primary-color); color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 1.1rem; cursor: pointer; margin: 10px; }
      .btn-secondary { background: transparent; color: var(--primary-color); padding: 15px 30px; border: 2px solid var(--primary-color); border-radius: 5px; font-size: 1.1rem; cursor: pointer; margin: 10px; }
      .features { padding: 80px 0; background: #f9fafb; }
      .features-grid { display: grid; gap: 30px; margin-top: 40px; }
      .features-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
      .feature { text-align: center; padding: 30px; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
      .contact { padding: 80px 0; }
      .contact-form { max-width: 600px; margin: 40px auto; }
      .contact-form input, .contact-form textarea { width: 100%; padding: 15px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; }
      .footer { padding: 40px 0; background: var(--secondary-color); color: white; text-align: center; }
      ${template.styles.animations ? `
      @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      .hero-title, .hero-subtitle, .btn-primary, .btn-secondary { animation: fadeIn 0.6s ease-out; }
      ` : ''}
    `;
  }

  /**
   * Process render queue
   */
  private async processRenderQueue() {
    this.isProcessing = true;

    while (this.renderQueue.length > 0) {
      const task = this.renderQueue.shift();
      if (task) {
        try {
          await this.generatePage(task.domainId, task.template);
        } catch (error) {
          console.error(`Failed to render page for domain ${task.domainId}:`, error);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Auto-generate page on domain registration
   */
  private async autoGeneratePage(domainId: string, templateId: string) {
    try {
      const page = await this.generatePage(domainId, templateId);
      console.log(`Auto-generated page for domain ${domainId}: ${page.url}`);
    } catch (error) {
      console.error(`Failed to auto-generate page for domain ${domainId}:`, error);
    }
  }

  /**
   * Update page ownership
   */
  private async updatePageOwnership(domainId: string, _newOwner: Address) {
    // Update page metadata to reflect new ownership
    const pages = Array.from(this.pages.values()).filter(p => p.domainId === domainId);
    for (const page of pages) {
      page.updatedAt = new Date();
      // Trigger re-render if needed
    }
  }

  /**
   * Update page listing information
   */
  private async updatePageListing(domainId: string, price: bigint) {
    // Update pages with new listing price
    const pages = Array.from(this.pages.values()).filter(p => p.domainId === domainId);
    for (const page of pages) {
      // Trigger dynamic content update
      this.emit('page:listing-updated', { pageId: page.id, price });
    }
  }

  /**
   * Fetch domain data
   */
  private async fetchDomainData(domainId: string) {
    // Mock implementation - would fetch from blockchain/API
    return {
      id: domainId,
      name: 'example',
      tld: 'com',
      owner: '0x...',
      price: '10',
      listed: true,
    };
  }

  /**
   * Upload to IPFS
   */
  private async uploadToIPFS(content: string): Promise<string> {
    try {
      // Import Pinata service
      const { pinataService } = await import('./pinata-service');

      // Upload HTML to IPFS via Pinata
      const ipfsHash = await pinataService.uploadHTML(content, {
        type: 'landing-page',
        timestamp: new Date().toISOString(),
      });

      return ipfsHash;
    } catch (error) {
      console.error('Failed to upload to IPFS, using mock hash:', error);
      // Fallback to mock implementation if Pinata fails
      return `Qm${Array(44).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    }
  }

  /**
   * Merge templates
   */
  private mergeTemplates(
    base: PageTemplate,
    customization: Partial<PageTemplate>
  ): PageTemplate {
    return {
      ...base,
      ...customization,
      components: customization.components || base.components,
      styles: { ...base.styles, ...(customization.styles || {}) },
    };
  }

  /**
   * Get page analytics
   */
  async getPageAnalytics(pageId: string): Promise<PageAnalytics> {
    const page = this.pages.get(pageId);
    if (!page) {
      throw new Error(`Page ${pageId} not found`);
    }
    return page.analytics;
  }

  /**
   * Update analytics
   */
  updateAnalytics(pageId: string, metrics: Partial<PageAnalytics>) {
    const page = this.pages.get(pageId);
    if (page) {
      page.analytics = { ...page.analytics, ...metrics };
      page.updatedAt = new Date();
    }
  }

  /**
   * Get all templates
   */
  getTemplates(): PageTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get pages for domain
   */
  getPagesForDomain(domainId: string): GeneratedPage[] {
    return Array.from(this.pages.values()).filter(p => p.domainId === domainId);
  }
}

// Export singleton instance
export const landingPageGenerator = new LandingPageGenerator();