/**
 * Global State Management using Zustand
 * Production-ready state management for Credora
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Address } from 'viem';
import { DomainToken } from './doma-client';
import { Domain } from './domain-service';
import { DomainMessage, DomainConversation } from './messaging-service';

// Application State Types
interface UserState {
  address: Address | null;
  domains: DomainToken[];
  activeLoans: Array<{
    id: bigint;
    borrower: Address;
    loanAmount: bigint;
    interestRate: bigint;
    duration: bigint;
    startTime: bigint;
    active: boolean;
  }>;
  activeLeases: Array<{
    id: string;
    lessor: Address;
    lessee: Address;
    duration: number;
    price: bigint;
  }>;
  fractionalizedDomains: Array<{
    tokenId: string;
    fractionalToken: string;
    totalSupply: string;
    minimumBuyoutPrice: string;
    currentBuyoutPrice: string;
    owner: string;
  }>;
  portfolioValue: number;
  notifications: Notification[];
}

interface MarketplaceState {
  listedDomains: Domain[];
  trendingDomains: Domain[];
  userListings: Array<{
    id: string;
    domainId: string;
    price: bigint;
    createdAt: Date;
    status: 'active' | 'sold' | 'cancelled';
  }>;
  userOffers: Array<{
    id: string;
    domainId: string;
    offeredPrice: bigint;
    createdAt: Date;
    status: 'pending' | 'accepted' | 'rejected';
  }>;
  orderBook: {
    bids: Array<{ price: bigint; amount: number; trader: string }>;
    asks: Array<{ price: bigint; amount: number; trader: string }>;
  };
  filters: {
    minPrice: string;
    maxPrice: string;
    tld: string;
    sortBy: 'value' | 'name' | 'expiry';
  };
}

interface MessagingState {
  conversations: DomainConversation[];
  activeConversation: DomainConversation | null;
  messages: DomainMessage[];
  unreadCount: number;
  isInitialized: boolean;
}

interface TransactionState {
  pendingTransactions: string[];
  completedTransactions: string[];
  failedTransactions: string[];
}

interface UIState {
  isLoading: boolean;
  error: string | null;
  selectedDomain: DomainToken | null;
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Combined Store State
interface AppState {
  // User State
  user: UserState;
  setUserAddress: (address: Address | null) => void;
  setUserDomains: (domains: DomainToken[]) => void;
  addUserDomain: (domain: DomainToken) => void;
  setActiveLoans: (loans: UserState['activeLoans']) => void;
  setActiveLeases: (leases: UserState['activeLeases']) => void;
  setFractionalizedDomains: (domains: UserState['fractionalizedDomains']) => void;
  updatePortfolioValue: (value: number) => void;

  // Marketplace State
  marketplace: MarketplaceState;
  setListedDomains: (domains: Domain[]) => void;
  setTrendingDomains: (domains: Domain[]) => void;
  addUserListing: (listing: MarketplaceState['userListings'][0]) => void;
  removeUserListing: (listingId: string) => void;
  addUserOffer: (offer: MarketplaceState['userOffers'][0]) => void;
  updateOrderBook: (orderBook: MarketplaceState['orderBook']) => void;
  setMarketplaceFilters: (filters: Partial<MarketplaceState['filters']>) => void;

  // Messaging State
  messaging: MessagingState;
  setConversations: (conversations: DomainConversation[]) => void;
  addConversation: (conversation: DomainConversation) => void;
  setActiveConversation: (conversation: DomainConversation | null) => void;
  addMessage: (message: DomainMessage) => void;
  setMessages: (messages: DomainMessage[]) => void;
  updateUnreadCount: (count: number) => void;
  setMessagingInitialized: (initialized: boolean) => void;

  // Transaction State
  transactions: TransactionState;
  addPendingTransaction: (txHash: string) => void;
  markTransactionComplete: (txHash: string) => void;
  markTransactionFailed: (txHash: string) => void;

  // UI State
  ui: UIState;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedDomain: (domain: DomainToken | null) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;

  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Actions
  refreshUserData: () => Promise<void>;
  refreshMarketplaceData: () => Promise<void>;
  clearAllState: () => void;
}

// Create the store with persistence
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        user: {
          address: null,
          domains: [],
          activeLoans: [],
          activeLeases: [],
          fractionalizedDomains: [],
          portfolioValue: 0,
          notifications: [],
        },
        marketplace: {
          listedDomains: [],
          trendingDomains: [],
          userListings: [],
          userOffers: [],
          orderBook: { bids: [], asks: [] },
          filters: {
            minPrice: '',
            maxPrice: '',
            tld: 'all',
            sortBy: 'value',
          },
        },
        messaging: {
          conversations: [],
          activeConversation: null,
          messages: [],
          unreadCount: 0,
          isInitialized: false,
        },
        transactions: {
          pendingTransactions: [],
          completedTransactions: [],
          failedTransactions: [],
        },
        ui: {
          isLoading: false,
          error: null,
          selectedDomain: null,
          theme: 'dark',
          sidebarCollapsed: false,
        },

        // User Actions
        setUserAddress: (address) =>
          set((state) => ({ user: { ...state.user, address } })),

        setUserDomains: (domains) =>
          set((state) => ({ user: { ...state.user, domains } })),

        addUserDomain: (domain) =>
          set((state) => ({
            user: { ...state.user, domains: [...state.user.domains, domain] },
          })),

        setActiveLoans: (activeLoans) =>
          set((state) => ({ user: { ...state.user, activeLoans } })),

        setActiveLeases: (activeLeases) =>
          set((state) => ({ user: { ...state.user, activeLeases } })),

        setFractionalizedDomains: (fractionalizedDomains) =>
          set((state) => ({ user: { ...state.user, fractionalizedDomains } })),

        updatePortfolioValue: (portfolioValue) =>
          set((state) => ({ user: { ...state.user, portfolioValue } })),

        // Marketplace Actions
        setListedDomains: (listedDomains) =>
          set((state) => ({
            marketplace: { ...state.marketplace, listedDomains },
          })),

        setTrendingDomains: (trendingDomains) =>
          set((state) => ({
            marketplace: { ...state.marketplace, trendingDomains },
          })),

        addUserListing: (listing) =>
          set((state) => ({
            marketplace: {
              ...state.marketplace,
              userListings: [...state.marketplace.userListings, listing],
            },
          })),

        removeUserListing: (listingId) =>
          set((state) => ({
            marketplace: {
              ...state.marketplace,
              userListings: state.marketplace.userListings.filter(
                (l) => l.id !== listingId
              ),
            },
          })),

        addUserOffer: (offer) =>
          set((state) => ({
            marketplace: {
              ...state.marketplace,
              userOffers: [...state.marketplace.userOffers, offer],
            },
          })),

        updateOrderBook: (orderBook) =>
          set((state) => ({ marketplace: { ...state.marketplace, orderBook } })),

        setMarketplaceFilters: (filters) =>
          set((state) => ({
            marketplace: {
              ...state.marketplace,
              filters: { ...state.marketplace.filters, ...filters },
            },
          })),

        // Messaging Actions
        setConversations: (conversations) =>
          set((state) => ({ messaging: { ...state.messaging, conversations } })),

        addConversation: (conversation) =>
          set((state) => ({
            messaging: {
              ...state.messaging,
              conversations: [...state.messaging.conversations, conversation],
            },
          })),

        setActiveConversation: (activeConversation) =>
          set((state) => ({ messaging: { ...state.messaging, activeConversation } })),

        addMessage: (message) =>
          set((state) => ({
            messaging: {
              ...state.messaging,
              messages: [...state.messaging.messages, message],
            },
          })),

        setMessages: (messages) =>
          set((state) => ({ messaging: { ...state.messaging, messages } })),

        updateUnreadCount: (unreadCount) =>
          set((state) => ({ messaging: { ...state.messaging, unreadCount } })),

        setMessagingInitialized: (isInitialized) =>
          set((state) => ({ messaging: { ...state.messaging, isInitialized } })),

        // Transaction Actions
        addPendingTransaction: (txHash) =>
          set((state) => ({
            transactions: {
              ...state.transactions,
              pendingTransactions: [...state.transactions.pendingTransactions, txHash],
            },
          })),

        markTransactionComplete: (txHash) =>
          set((state) => ({
            transactions: {
              ...state.transactions,
              pendingTransactions: state.transactions.pendingTransactions.filter(
                (tx) => tx !== txHash
              ),
              completedTransactions: [...state.transactions.completedTransactions, txHash],
            },
          })),

        markTransactionFailed: (txHash) =>
          set((state) => ({
            transactions: {
              ...state.transactions,
              pendingTransactions: state.transactions.pendingTransactions.filter(
                (tx) => tx !== txHash
              ),
              failedTransactions: [...state.transactions.failedTransactions, txHash],
            },
          })),

        // UI Actions
        setLoading: (isLoading) =>
          set((state) => ({ ui: { ...state.ui, isLoading } })),

        setError: (error) => set((state) => ({ ui: { ...state.ui, error } })),

        setSelectedDomain: (selectedDomain) =>
          set((state) => ({ ui: { ...state.ui, selectedDomain } })),

        toggleTheme: () =>
          set((state) => ({
            ui: { ...state.ui, theme: state.ui.theme === 'dark' ? 'light' : 'dark' },
          })),

        toggleSidebar: () =>
          set((state) => ({
            ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed },
          })),

        // Notifications
        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: `notif-${Date.now()}`,
            timestamp: new Date(),
            read: false,
          };
          set((state) => ({
            user: {
              ...state.user,
              notifications: [newNotification, ...state.user.notifications],
            },
          }));
        },

        markNotificationRead: (id) =>
          set((state) => ({
            user: {
              ...state.user,
              notifications: state.user.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
              ),
            },
          })),

        clearNotifications: () =>
          set((state) => ({ user: { ...state.user, notifications: [] } })),

        // Complex Actions
        refreshUserData: async () => {
          const { user, setLoading } = get();
          if (!user.address) return;

          setLoading(true);
          try {
            // Fetch user domains, loans, etc.
            // This would call the actual API/contract methods
            // For now, it's a placeholder
          } catch (error) {
            console.error('Failed to refresh user data:', error);
            get().setError('Failed to refresh user data');
          } finally {
            setLoading(false);
          }
        },

        refreshMarketplaceData: async () => {
          const { setLoading } = get();
          setLoading(true);
          try {
            // Fetch marketplace data
            // This would call the actual API/contract methods
          } catch (error) {
            console.error('Failed to refresh marketplace data:', error);
            get().setError('Failed to refresh marketplace data');
          } finally {
            setLoading(false);
          }
        },

        clearAllState: () => {
          set({
            user: {
              address: null,
              domains: [],
              activeLoans: [],
              activeLeases: [],
              fractionalizedDomains: [],
              portfolioValue: 0,
              notifications: [],
            },
            marketplace: {
              listedDomains: [],
              trendingDomains: [],
              userListings: [],
              userOffers: [],
              orderBook: { bids: [], asks: [] },
              filters: {
                minPrice: '',
                maxPrice: '',
                tld: 'all',
                sortBy: 'value',
              },
            },
            messaging: {
              conversations: [],
              activeConversation: null,
              messages: [],
              unreadCount: 0,
              isInitialized: false,
            },
            transactions: {
              pendingTransactions: [],
              completedTransactions: [],
              failedTransactions: [],
            },
            ui: {
              isLoading: false,
              error: null,
              selectedDomain: null,
              theme: 'dark',
              sidebarCollapsed: false,
            },
          });
        },
      }),
      {
        name: 'credora-storage',
        partialize: (state) => ({
          user: { address: state.user.address },
          ui: { theme: state.ui.theme, sidebarCollapsed: state.ui.sidebarCollapsed },
          marketplace: { filters: state.marketplace.filters },
        }),
      }
    )
  )
);

// Selectors for better performance
export const useUserAddress = () => useAppStore((state) => state.user.address);
export const useUserDomains = () => useAppStore((state) => state.user.domains);
export const useActiveLoans = () => useAppStore((state) => state.user.activeLoans);
export const useMarketplaceDomains = () => useAppStore((state) => state.marketplace.listedDomains);
export const useConversations = () => useAppStore((state) => state.messaging.conversations);
export const useIsLoading = () => useAppStore((state) => state.ui.isLoading);
export const useTheme = () => useAppStore((state) => state.ui.theme);
export const useNotifications = () => useAppStore((state) => state.user.notifications);