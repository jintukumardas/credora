/**
 * Messaging Service - Domain-linked encrypted communications with XMTP
 */

// XMTP types - would be imported from @xmtp/xmtp-js when installed
interface Conversation {
  topic: string;
  send: (message: string) => Promise<void>;
  streamMessages: () => Promise<AsyncIterableIterator<Message>>;
  messages: () => Promise<Message[]>;
  peerAddress: string;
  createdAt: Date;
}

interface Client {
  address: string;
  conversations: {
    newConversation: (address: string) => Promise<Conversation>;
    list: () => Promise<Conversation[]>;
  };
  canMessage: (address: string) => Promise<boolean>;
}

interface Message {
  id: string;
  content: string;
  senderAddress: string;
  conversation: { topic: string };
  sent: Date;
}

import { Address } from 'viem';

// Wallet type - would be from ethers when installed
interface Wallet {
  address: string;
}

export interface DomainMessage {
  id: string;
  conversationId: string;
  sender: Address;
  senderDomain?: string;
  recipient: Address;
  recipientDomain?: string;
  content: string;
  timestamp: Date;
  verified: boolean;
  encrypted: boolean;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  type: 'image' | 'document' | 'contract';
  url: string;
  hash: string;
  size: number;
}

export interface DomainConversation {
  id: string;
  participants: Address[];
  domainContext?: string;
  topic: 'negotiation' | 'support' | 'general' | 'dispute';
  messages: DomainMessage[];
  createdAt: Date;
  lastActivity: Date;
  status: 'active' | 'archived' | 'resolved';
}

export interface VerificationProof {
  domainId: string;
  owner: Address;
  signature: string;
  timestamp: number;
  nonce: string;
}

export class MessagingService {
  private xmtpClient: Client | null = null;
  private conversations: Map<string, DomainConversation> = new Map();
  private verificationCache: Map<Address, VerificationProof> = new Map();
  private domainRegistry: Address;

  constructor(domainRegistry: Address) {
    this.domainRegistry = domainRegistry;
  }

  /**
   * Initialize XMTP client with wallet
   */
  async initialize(wallet: Wallet): Promise<void> {
    try {
      // Would use Client.create from @xmtp/xmtp-js
      // For now, creating mock client
      this.xmtpClient = {
        address: wallet.address,
        conversations: {
          newConversation: async (_address: string): Promise<Conversation> => ({
            topic: `conv-${Date.now()}`,
            send: async (_message: string) => {},
            streamMessages: async () => {
              return (async function* () {})() as AsyncIterableIterator<Message>;
            },
            messages: async () => [],
            peerAddress: _address,
            createdAt: new Date()
          }),
          list: async () => []
        },
        canMessage: async (_address: string) => true
      };
      console.log('XMTP client initialized for address:', wallet.address);
    } catch (error) {
      console.error('Failed to initialize XMTP client:', error);
      throw error;
    }
  }

  /**
   * Send domain-verified message
   */
  async sendMessage(
    recipient: Address,
    content: string,
    domainId?: string,
    attachments?: MessageAttachment[]
  ): Promise<DomainMessage> {
    if (!this.xmtpClient) {
      throw new Error('XMTP client not initialized');
    }

    // Verify domain ownership if domainId provided
    let verified = false;
    let senderDomain = undefined;

    if (domainId) {
      verified = await this.verifyDomainOwnership(
        this.xmtpClient.address as Address,
        domainId
      );
      if (verified) {
        senderDomain = await this.getDomainName(domainId);
      }
    }

    // Check if recipient has XMTP
    const canMessage = await this.xmtpClient.canMessage(recipient);
    if (!canMessage) {
      throw new Error('Recipient cannot receive XMTP messages');
    }

    // Create or get conversation
    const conversation = await this.xmtpClient.conversations.newConversation(recipient);

    // Prepare message payload
    const messagePayload = {
      content,
      metadata: {
        domainId,
        verified,
        attachments,
        timestamp: Date.now(),
      },
    };

    // Send message
    await conversation.send(JSON.stringify(messagePayload));

    // Create message record
    const message: DomainMessage = {
      id: this.generateMessageId(),
      conversationId: conversation.topic,
      sender: this.xmtpClient.address as Address,
      senderDomain,
      recipient,
      recipientDomain: await this.getRecipientDomain(recipient),
      content,
      timestamp: new Date(),
      verified,
      encrypted: true,
      attachments,
    };

    // Update conversation
    this.updateConversation(conversation.topic, message);

    return message;
  }

  /**
   * Create negotiation channel for domain transaction
   */
  async createNegotiationChannel(
    domainId: string,
    buyer: Address,
    seller: Address,
    initialOffer: bigint
  ): Promise<DomainConversation> {
    if (!this.xmtpClient) {
      throw new Error('XMTP client not initialized');
    }

    // Verify both parties own relevant domains
    const sellerVerified = await this.verifyDomainOwnership(seller, domainId);
    if (!sellerVerified) {
      throw new Error('Seller does not own the domain');
    }

    // Create conversation
    const conversation = await this.xmtpClient.conversations.newConversation(
      seller === this.xmtpClient.address ? buyer : seller
    );

    // Send initial negotiation message
    const initialMessage = {
      type: 'negotiation_start',
      domainId,
      offer: initialOffer.toString(),
      buyer: buyer,
      seller: seller,
      timestamp: Date.now(),
    };

    await conversation.send(JSON.stringify(initialMessage));

    // Create domain conversation record
    const domainConversation: DomainConversation = {
      id: conversation.topic,
      participants: [buyer, seller],
      domainContext: domainId,
      topic: 'negotiation',
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date(),
      status: 'active',
    };

    this.conversations.set(domainConversation.id, domainConversation);

    return domainConversation;
  }

  /**
   * Stream messages for a conversation
   */
  async streamMessages(
    conversationId: string,
    callback: (message: DomainMessage) => void
  ): Promise<() => void> {
    if (!this.xmtpClient) {
      throw new Error('XMTP client not initialized');
    }

    // Get conversation
    const conversations = await this.xmtpClient.conversations.list();
    const conversation = conversations.find(c => c.topic === conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Stream messages
    const stream = await conversation.streamMessages();

    // Process stream
    const processStream = async () => {
      for await (const message of stream) {
        const domainMessage = await this.processIncomingMessage(message);
        callback(domainMessage);
        this.updateConversation(conversationId, domainMessage);
      }
    };

    processStream();

    // Return cleanup function
    return () => {
      stream.return?.();
    };
  }

  /**
   * Verify domain ownership
   */
  async verifyDomainOwnership(
    address: Address,
    domainId: string
  ): Promise<boolean> {
    // Check cache first
    const cached = this.verificationCache.get(address);
    if (cached && cached.domainId === domainId) {
      const isValid = Date.now() - cached.timestamp < 3600000; // 1 hour
      if (isValid) return true;
    }

    // Verify on-chain ownership
    try {
      // This would call the smart contract to verify ownership
      // For now, returning mock verification
      const verified = true; // await domainRegistry.ownerOf(domainId) === address;

      if (verified) {
        // Cache verification
        const proof: VerificationProof = {
          domainId,
          owner: address,
          signature: '0x...', // Would be actual signature
          timestamp: Date.now(),
          nonce: this.generateNonce(),
        };
        this.verificationCache.set(address, proof);
      }

      return verified;
    } catch (error) {
      console.error('Domain verification failed:', error);
      return false;
    }
  }

  /**
   * Process incoming message
   */
  private async processIncomingMessage(message: Message): Promise<DomainMessage> {
    let payload;
    try {
      payload = JSON.parse(message.content);
    } catch {
      payload = { content: message.content };
    }

    const sender = message.senderAddress as Address;
    const verified = payload.metadata?.verified || false;

    return {
      id: message.id,
      conversationId: message.conversation.topic,
      sender,
      senderDomain: await this.getRecipientDomain(sender),
      recipient: this.xmtpClient?.address as Address,
      recipientDomain: await this.getRecipientDomain(this.xmtpClient?.address as Address),
      content: payload.content || message.content,
      timestamp: new Date(message.sent),
      verified,
      encrypted: true,
      attachments: payload.metadata?.attachments,
    };
  }

  /**
   * Get all conversations for current user
   */
  async getConversations(): Promise<DomainConversation[]> {
    if (!this.xmtpClient) {
      throw new Error('XMTP client not initialized');
    }

    const xmtpConversations = await this.xmtpClient.conversations.list();

    const conversations: DomainConversation[] = [];

    for (const conv of xmtpConversations) {
      // Check if we have a record
      let domainConv = this.conversations.get(conv.topic);

      if (!domainConv) {
        // Create new record
        const messages = await conv.messages();
        const domainMessages = await Promise.all(
          messages.map(msg => this.processIncomingMessage(msg))
        );

        domainConv = {
          id: conv.topic,
          participants: [
            this.xmtpClient.address as Address,
            conv.peerAddress as Address,
          ],
          topic: 'general',
          messages: domainMessages,
          createdAt: conv.createdAt,
          lastActivity: messages[messages.length - 1]?.sent || conv.createdAt,
          status: 'active',
        };

        this.conversations.set(conv.topic, domainConv);
      }

      conversations.push(domainConv);
    }

    return conversations;
  }

  /**
   * Send dispute resolution request
   */
  async sendDisputeRequest(
    domainId: string,
    counterparty: Address,
    reason: string,
    evidence: MessageAttachment[]
  ): Promise<DomainConversation> {
    const conversation = await this.createNegotiationChannel(
      domainId,
      this.xmtpClient?.address as Address,
      counterparty,
      BigInt(0)
    );

    // Update conversation type
    conversation.topic = 'dispute';

    // Send dispute message
    const disputeMessage = {
      type: 'dispute_request',
      domainId,
      reason,
      evidence,
      timestamp: Date.now(),
    };

    await this.sendMessage(
      counterparty,
      JSON.stringify(disputeMessage),
      domainId,
      evidence
    );

    return conversation;
  }

  /**
   * Create support ticket
   */
  async createSupportTicket(
    subject: string,
    description: string,
    domainId?: string
  ): Promise<DomainConversation> {
    const supportAddress = process.env.NEXT_PUBLIC_SUPPORT_ADDRESS as Address;

    const message = await this.sendMessage(
      supportAddress,
      `Subject: ${subject}\n\n${description}`,
      domainId
    );

    const conversation = this.conversations.get(message.conversationId);
    if (conversation) {
      conversation.topic = 'support';
    }

    return conversation!;
  }

  /**
   * Get domain name from ID
   */
  private async getDomainName(domainId: string): Promise<string> {
    // Would fetch from blockchain/API
    return `domain-${domainId}`;
  }

  /**
   * Get recipient's primary domain
   */
  private async getRecipientDomain(_address: Address): Promise<string | undefined> {
    // Would fetch from blockchain/API
    return undefined;
  }

  /**
   * Update conversation with new message
   */
  private updateConversation(conversationId: string, message: DomainMessage): void {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.messages.push(message);
      conversation.lastActivity = new Date();
    }
  }

  /**
   * Generate message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate nonce for verification
   */
  private generateNonce(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Archive conversation
   */
  async archiveConversation(conversationId: string): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.status = 'archived';
    }
  }

  /**
   * Mark conversation as resolved
   */
  async resolveConversation(conversationId: string): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.status = 'resolved';
    }
  }

  /**
   * Search messages
   */
  searchMessages(query: string): DomainMessage[] {
    const results: DomainMessage[] = [];

    for (const conversation of this.conversations.values()) {
      for (const message of conversation.messages) {
        if (message.content.toLowerCase().includes(query.toLowerCase())) {
          results.push(message);
        }
      }
    }

    return results;
  }

  /**
   * Get conversation statistics
   */
  getStatistics(): {
    totalConversations: number;
    activeConversations: number;
    totalMessages: number;
    verifiedMessages: number;
  } {
    let totalMessages = 0;
    let verifiedMessages = 0;
    let activeConversations = 0;

    for (const conversation of this.conversations.values()) {
      if (conversation.status === 'active') {
        activeConversations++;
      }
      totalMessages += conversation.messages.length;
      verifiedMessages += conversation.messages.filter(m => m.verified).length;
    }

    return {
      totalConversations: this.conversations.size,
      activeConversations,
      totalMessages,
      verifiedMessages,
    };
  }
}

// Export singleton instance (initialized in app)
export let messagingService: MessagingService;