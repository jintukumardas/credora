/**
 * Pinata IPFS Service for Message Storage
 * Handles secure message storage and retrieval using IPFS
 */

import axios from 'axios';
import { Address } from 'viem';

export interface IPFSMessage {
  id: string;
  sender: Address;
  recipient: Address;
  content: string;
  timestamp: Date;
  domainContext?: string;
  encrypted: boolean;
  signature?: string;
  metadata?: Record<string, any>;
}

export interface IPFSNotification {
  id: string;
  type: 'message' | 'domain_transfer' | 'domain_listing' | 'offer' | 'system';
  sender: Address;
  recipient: Address;
  title: string;
  content: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  ipfsHash?: string;
}

export interface PinataConfig {
  apiKey: string;
  secretApiKey: string;
  gateway?: string;
}

class PinataService {
  private apiKey: string;
  private secretApiKey: string;
  private gateway: string;
  private baseUrl: string = 'https://api.pinata.cloud';

  constructor() {
    // Initialize with environment variables or fallback values
    this.apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY || '';
    this.secretApiKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || '';

    // Ensure gateway URL has protocol
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';
    this.gateway = gateway.startsWith('http') ? gateway : `https://${gateway}`;

    // Validate configuration
    if (!this.apiKey || !this.secretApiKey) {
      console.warn('Pinata API keys not configured. Using mock IPFS storage.');
    }
  }

  /**
   * Initialize Pinata service with custom config
   */
  async initialize(config?: Partial<PinataConfig>) {
    if (config?.apiKey) this.apiKey = config.apiKey;
    if (config?.secretApiKey) this.secretApiKey = config.secretApiKey;
    if (config?.gateway) {
      // Ensure gateway URL has protocol
      this.gateway = config.gateway.startsWith('http')
        ? config.gateway
        : `https://${config.gateway}`;
    }

    // If no API keys configured, use mock mode
    if (!this.apiKey || !this.secretApiKey) {
      console.warn('Pinata API keys not configured. Using mock IPFS storage for development.');
      return true; // Return success for mock mode
    }

    // Test connection only if API keys are available
    try {
      await this.testAuthentication();
      console.log('Pinata IPFS service initialized successfully');
      return true;
    } catch (error) {
      console.warn('Failed to authenticate with Pinata, falling back to mock storage:', error);
      // Don't throw error, just use mock storage
      return false;
    }
  }

  /**
   * Test Pinata authentication
   */
  private async testAuthentication() {
    if (!this.apiKey || !this.secretApiKey) {
      throw new Error('Pinata API keys not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/data/testAuthentication`, {
        headers: {
          pinata_api_key: this.apiKey,
          pinata_secret_api_key: this.secretApiKey,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Pinata authentication failed');
    }
  }

  /**
   * Save a message to IPFS
   */
  async saveMessage(message: IPFSMessage): Promise<string> {
    try {
      // If Pinata is not configured, use mock storage
      if (!this.apiKey || !this.secretApiKey) {
        return this.mockSaveToIPFS(message);
      }

      // Prepare message data
      const messageData = {
        ...message,
        timestamp: message.timestamp.toISOString(),
        version: '1.0',
      };

      // Pin JSON to IPFS
      const response = await axios.post(
        `${this.baseUrl}/pinning/pinJSONToIPFS`,
        {
          pinataContent: messageData,
          pinataMetadata: {
            name: `message-${message.id}`,
            keyvalues: {
              sender: message.sender,
              recipient: message.recipient,
              type: 'message',
              timestamp: message.timestamp.toISOString(),
              domainContext: message.domainContext || '',
            },
          },
        },
        {
          headers: {
            pinata_api_key: this.apiKey,
            pinata_secret_api_key: this.secretApiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.IpfsHash;
    } catch (error) {
      console.error('Failed to save message to IPFS:', error);
      // Fallback to mock storage
      return this.mockSaveToIPFS(message);
    }
  }

  /**
   * Retrieve a message from IPFS
   */
  async getMessage(ipfsHash: string): Promise<IPFSMessage | null> {
    try {
      // If Pinata is not configured, use mock retrieval
      if (!this.apiKey || !this.secretApiKey) {
        return this.mockRetrieveFromIPFS(ipfsHash);
      }

      // Ensure gateway URL has protocol
      const gatewayUrl = this.gateway.startsWith('http')
        ? this.gateway
        : `https://${this.gateway}`;

      // Build the full URL
      const url = `${gatewayUrl.replace(/\/$/, '')}/ipfs/${ipfsHash}`;

      const response = await axios.get(url);

      // Parse and validate message data
      const messageData = response.data;
      return {
        ...messageData,
        timestamp: new Date(messageData.timestamp),
      };
    } catch (error) {
      console.error('Failed to retrieve message from IPFS:', error);
      return this.mockRetrieveFromIPFS(ipfsHash);
    }
  }

  /**
   * Save a notification to IPFS
   */
  async saveNotification(notification: IPFSNotification): Promise<string> {
    try {
      // If Pinata is not configured, use mock storage
      if (!this.apiKey || !this.secretApiKey) {
        return this.mockSaveToIPFS(notification);
      }

      // Prepare notification data
      const notificationData = {
        ...notification,
        timestamp: notification.timestamp.toISOString(),
        version: '1.0',
      };

      // Pin JSON to IPFS
      const response = await axios.post(
        `${this.baseUrl}/pinning/pinJSONToIPFS`,
        {
          pinataContent: notificationData,
          pinataMetadata: {
            name: `notification-${notification.id}`,
            keyvalues: {
              sender: notification.sender,
              recipient: notification.recipient,
              type: notification.type,
              priority: notification.priority,
              timestamp: notification.timestamp.toISOString(),
            },
          },
        },
        {
          headers: {
            pinata_api_key: this.apiKey,
            pinata_secret_api_key: this.secretApiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.IpfsHash;
    } catch (error) {
      console.error('Failed to save notification to IPFS:', error);
      return this.mockSaveToIPFS(notification);
    }
  }

  /**
   * Retrieve a notification from IPFS
   */
  async getNotification(ipfsHash: string): Promise<IPFSNotification | null> {
    try {
      // If Pinata is not configured, use mock retrieval
      if (!this.apiKey || !this.secretApiKey) {
        return this.mockRetrieveFromIPFS(ipfsHash) as Promise<IPFSNotification | null>;
      }

      // Ensure gateway URL has protocol
      const gatewayUrl = this.gateway.startsWith('http')
        ? this.gateway
        : `https://${this.gateway}`;

      // Build the full URL
      const url = `${gatewayUrl.replace(/\/$/, '')}/ipfs/${ipfsHash}`;

      const response = await axios.get(url);

      // Parse and validate notification data
      const notificationData = response.data;
      return {
        ...notificationData,
        timestamp: new Date(notificationData.timestamp),
      };
    } catch (error) {
      console.error('Failed to retrieve notification from IPFS:', error);
      return null;
    }
  }

  /**
   * Get messages for a specific user
   */
  async getMessagesForUser(userAddress: Address): Promise<IPFSMessage[]> {
    try {
      // If Pinata is not configured, return mock messages
      if (!this.apiKey || !this.secretApiKey) {
        return this.getMockMessagesForUser(userAddress);
      }

      // Query pinned items with metadata filters
      const response = await axios.get(
        `${this.baseUrl}/data/pinList`,
        {
          params: {
            status: 'pinned',
            metadata: JSON.stringify({
              keyvalues: {
                recipient: {
                  value: userAddress,
                  op: 'eq',
                },
                type: {
                  value: 'message',
                  op: 'eq',
                },
              },
            }),
          },
          headers: {
            pinata_api_key: this.apiKey,
            pinata_secret_api_key: this.secretApiKey,
          },
        }
      );

      // Fetch and parse messages
      const messages: IPFSMessage[] = [];
      for (const pin of response.data.rows) {
        const message = await this.getMessage(pin.ipfs_pin_hash);
        if (message) {
          messages.push(message);
        }
      }

      // Sort by timestamp (newest first)
      return messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Failed to get messages for user:', error);
      return this.getMockMessagesForUser(userAddress);
    }
  }

  /**
   * Get notifications for a specific user
   */
  async getNotificationsForUser(userAddress: Address): Promise<IPFSNotification[]> {
    try {
      // If Pinata is not configured, return mock notifications
      if (!this.apiKey || !this.secretApiKey) {
        return this.getMockNotificationsForUser(userAddress);
      }

      // Query pinned items with metadata filters
      const response = await axios.get(
        `${this.baseUrl}/data/pinList`,
        {
          params: {
            status: 'pinned',
            metadata: JSON.stringify({
              keyvalues: {
                recipient: {
                  value: userAddress,
                  op: 'eq',
                },
              },
            }),
          },
          headers: {
            pinata_api_key: this.apiKey,
            pinata_secret_api_key: this.secretApiKey,
          },
        }
      );

      // Fetch and parse notifications
      const notifications: IPFSNotification[] = [];
      for (const pin of response.data.rows) {
        // Check if it's a notification based on metadata
        if (pin.metadata?.keyvalues?.type && pin.metadata.keyvalues.type !== 'message') {
          const notification = await this.getNotification(pin.ipfs_pin_hash);
          if (notification) {
            notification.ipfsHash = pin.ipfs_pin_hash;
            notifications.push(notification);
          }
        }
      }

      // Sort by timestamp (newest first) and priority
      return notifications.sort((a, b) => {
        // Sort by priority first
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then by timestamp
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
    } catch (error) {
      console.error('Failed to get notifications for user:', error);
      return this.getMockNotificationsForUser(userAddress);
    }
  }

  /**
   * Delete a message or notification from IPFS (unpin)
   */
  async deleteFromIPFS(ipfsHash: string): Promise<boolean> {
    try {
      if (!this.apiKey || !this.secretApiKey) {
        return true; // Mock success
      }

      await axios.delete(
        `${this.baseUrl}/pinning/unpin/${ipfsHash}`,
        {
          headers: {
            pinata_api_key: this.apiKey,
            pinata_secret_api_key: this.secretApiKey,
          },
        }
      );

      return true;
    } catch (error) {
      console.error('Failed to delete from IPFS:', error);
      return false;
    }
  }

  // Mock storage functions for development/testing
  private mockStorage = new Map<string, any>();

  private mockSaveToIPFS(data: any): string {
    const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    this.mockStorage.set(mockHash, data);
    return mockHash;
  }

  private mockRetrieveFromIPFS(hash: string): any {
    return this.mockStorage.get(hash) || null;
  }

  private getMockMessagesForUser(userAddress: Address): IPFSMessage[] {
    // Return mock messages for development
    return [
      {
        id: 'msg-mock-1',
        sender: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB6' as Address,
        recipient: userAddress,
        content: 'Welcome to the decentralized messaging system!',
        timestamp: new Date(Date.now() - 3600000),
        encrypted: true,
        domainContext: 'example.xyz',
      },
      {
        id: 'msg-mock-2',
        sender: '0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed' as Address,
        recipient: userAddress,
        content: 'Your domain transfer has been completed.',
        timestamp: new Date(Date.now() - 7200000),
        encrypted: true,
      },
    ];
  }

  private getMockNotificationsForUser(userAddress: Address): IPFSNotification[] {
    // Return mock notifications for development
    return [
      {
        id: 'notif-mock-1',
        type: 'domain_transfer',
        sender: '0x0000000000000000000000000000000000000000' as Address,
        recipient: userAddress,
        title: 'Domain Transfer Completed',
        content: 'Your domain crypto.xyz has been successfully transferred.',
        timestamp: new Date(Date.now() - 1800000),
        read: false,
        priority: 'high',
        actionUrl: '/marketplace',
      },
      {
        id: 'notif-mock-2',
        type: 'offer',
        sender: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB6' as Address,
        recipient: userAddress,
        title: 'New Offer Received',
        content: 'You have received a new offer of 5 ETH for your domain.',
        timestamp: new Date(Date.now() - 3600000),
        read: false,
        priority: 'medium',
        actionUrl: '/offers',
      },
      {
        id: 'notif-mock-3',
        type: 'system',
        sender: '0x0000000000000000000000000000000000000000' as Address,
        recipient: userAddress,
        title: 'System Update',
        content: 'New features have been added to the platform.',
        timestamp: new Date(Date.now() - 86400000),
        read: true,
        priority: 'low',
      },
    ];
  }

  /**
   * Upload HTML content to IPFS
   */
  async uploadHTML(html: string, metadata?: Record<string, any>): Promise<string> {
    try {
      if (!this.apiKey || !this.secretApiKey) {
        return this.mockSaveToIPFS({ html, metadata });
      }

      const response = await axios.post(
        `${this.baseUrl}/pinning/pinJSONToIPFS`,
        {
          pinataContent: {
            html,
            metadata,
            timestamp: new Date().toISOString(),
          },
          pinataMetadata: {
            name: `landing-page-${Date.now()}`,
            keyvalues: metadata || {},
          },
        },
        {
          headers: {
            pinata_api_key: this.apiKey,
            pinata_secret_api_key: this.secretApiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.IpfsHash;
    } catch (error) {
      console.error('Failed to upload HTML to IPFS:', error);
      return this.mockSaveToIPFS({ html, metadata });
    }
  }
}

// Export singleton instance
export const pinataService = new PinataService();