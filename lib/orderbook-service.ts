/**
 * Doma Orderbook Service
 * Wrapper around @doma-protocol/orderbook-sdk for marketplace operations
 */

'use client';

import { createDomaOrderbookClient, DomaOrderbookSDK } from '@doma-protocol/orderbook-sdk';
import type { CreateListingParams, BuyListingParams } from '@doma-protocol/orderbook-sdk';
import type { CreateOfferParams, AcceptOfferParams } from '@doma-protocol/orderbook-sdk';
import type { Caip2ChainId, OrderbookType } from '@doma-protocol/orderbook-sdk';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import type { WalletClient } from 'wagmi';

// Doma Testnet Chain ID in CAIP-2 format (eip155:91144)
export const DOMA_TESTNET_CAIP2: Caip2ChainId = 'eip155:91144';

/**
 * Initialize the Doma Orderbook SDK client
 */
export function initializeOrderbookClient(): DomaOrderbookSDK {
  const config = {
    apiClientOptions: {
      baseUrl: process.env.NEXT_PUBLIC_DOMA_API_URL || 'https://api-testnet.doma.xyz',
      apiKey: process.env.NEXT_PUBLIC_DOMA_API_KEY || '',
    },
  };

  return createDomaOrderbookClient(config);
}

/**
 * Convert wagmi WalletClient to ethers JsonRpcSigner
 * The SDK requires ethers signer, but we use wagmi/viem
 */
export async function getEthersSigner(walletClient: WalletClient): Promise<JsonRpcSigner> {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain!.id,
    name: chain!.name,
    ensAddress: chain!.contracts?.ensRegistry?.address,
  };

  const provider = new BrowserProvider(transport, network);
  const signer = await provider.getSigner(account!.address);
  return signer;
}

/**
 * Create a domain listing on the orderbook
 */
export async function createDomainListing(params: {
  walletClient: WalletClient;
  tokenId: string;
  contract: string;
  price: string;
  currencyAddress?: string;
  duration?: number;
  source?: string;
}) {
  const client = initializeOrderbookClient();
  const signer = await getEthersSigner(params.walletClient);

  const listingParams: CreateListingParams = {
    items: [{
      contract: params.contract,
      tokenId: params.tokenId,
      price: params.price,
      currencyContractAddress: params.currencyAddress,
      duration: params.duration || 86400 * 30, // 30 days default
    }],
    source: params.source || 'credora',
    orderbook: 'DOMA' as OrderbookType,
    cancelExisting: true,
  };

  let progress = '';
  const result = await client.createListing({
    params: listingParams,
    signer,
    chainId: DOMA_TESTNET_CAIP2,
    onProgress: (message) => {
      progress = message;
      console.log('Creating listing:', message);
    },
  });

  return { ...result, progress };
}

/**
 * Buy a domain listing from the orderbook
 */
export async function buyDomainListing(params: {
  walletClient: WalletClient;
  orderId: string;
}) {
  const client = initializeOrderbookClient();
  const signer = await getEthersSigner(params.walletClient);
  const address = params.walletClient.account?.address;

  if (!address) {
    throw new Error('Wallet address not found');
  }

  const buyParams: BuyListingParams = {
    orderId: params.orderId,
    fulFillerAddress: address,
  };

  let progress = '';
  const result = await client.buyListing({
    params: buyParams,
    signer,
    chainId: DOMA_TESTNET_CAIP2,
    onProgress: (message) => {
      progress = message;
      console.log('Buying listing:', message);
    },
  });

  return { ...result, progress };
}

/**
 * Create an offer for a domain
 */
export async function createDomainOffer(params: {
  walletClient: WalletClient;
  tokenId: string;
  contract: string;
  price: string;
  currencyAddress?: string;
  duration?: number;
}) {
  const client = initializeOrderbookClient();
  const signer = await getEthersSigner(params.walletClient);

  const offerParams: CreateOfferParams = {
    items: [{
      contract: params.contract,
      tokenId: params.tokenId,
      price: params.price,
      currencyContractAddress: params.currencyAddress,
      duration: params.duration || 86400 * 7, // 7 days default
    }],
    source: 'credora',
    orderbook: 'DOMA' as OrderbookType,
  };

  let progress = '';
  const result = await client.createOffer({
    params: offerParams,
    signer,
    chainId: DOMA_TESTNET_CAIP2,
    onProgress: (message) => {
      progress = message;
      console.log('Creating offer:', message);
    },
  });

  return { ...result, progress };
}

/**
 * Accept an offer for your domain
 */
export async function acceptDomainOffer(params: {
  walletClient: WalletClient;
  orderId: string;
}) {
  const client = initializeOrderbookClient();
  const signer = await getEthersSigner(params.walletClient);

  const acceptParams: AcceptOfferParams = {
    orderId: params.orderId,
  };

  let progress = '';
  const result = await client.acceptOffer({
    params: acceptParams,
    signer,
    chainId: DOMA_TESTNET_CAIP2,
    onProgress: (message) => {
      progress = message;
      console.log('Accepting offer:', message);
    },
  });

  return { ...result, progress };
}

/**
 * Cancel a listing
 */
export async function cancelDomainListing(params: {
  walletClient: WalletClient;
  orderId: string;
}) {
  const client = initializeOrderbookClient();
  const signer = await getEthersSigner(params.walletClient);

  let progress = '';
  const result = await client.cancelListing({
    params: { orderId: params.orderId },
    signer,
    chainId: DOMA_TESTNET_CAIP2,
    onProgress: (message) => {
      progress = message;
      console.log('Canceling listing:', message);
    },
  });

  return { ...result, progress };
}

/**
 * Cancel an offer
 */
export async function cancelDomainOffer(params: {
  walletClient: WalletClient;
  orderId: string;
}) {
  const client = initializeOrderbookClient();
  const signer = await getEthersSigner(params.walletClient);

  let progress = '';
  const result = await client.cancelOffer({
    params: { orderId: params.orderId },
    signer,
    chainId: DOMA_TESTNET_CAIP2,
    onProgress: (message) => {
      progress = message;
      console.log('Canceling offer:', message);
    },
  });

  return { ...result, progress };
}

/**
 * Get supported currencies for the orderbook
 */
export async function getSupportedCurrencies(chainId: Caip2ChainId = DOMA_TESTNET_CAIP2) {
  const client = initializeOrderbookClient();
  return await client.getSupportedCurrencies({ chainId });
}

/**
 * Get orderbook fees
 */
export async function getOrderbookFees(chainId: Caip2ChainId = DOMA_TESTNET_CAIP2) {
  const client = initializeOrderbookClient();
  return await client.getOrderbookFee({ chainId });
}
