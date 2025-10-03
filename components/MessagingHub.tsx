'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Send,
  Search,
  Shield,
  Clock,
  Paperclip,
  X,
  ChevronDown,
  Inbox,
  Archive,
  AlertCircle
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { Address } from 'viem';
import {
  MessagingService,
  DomainMessage,
  DomainConversation,
  MessageAttachment
} from '@/lib/messaging-service';
import toast from 'react-hot-toast';

export function MessagingHub() {
  const { address, isConnected } = useAccount();
  const [messagingService, setMessagingService] = useState<MessagingService | null>(null);
  const [conversations, setConversations] = useState<DomainConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<DomainConversation | null>(null);
  const [messages, setMessages] = useState<DomainMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize messaging service
  useEffect(() => {
    if (address && !messagingService) {
      initializeMessaging();
    }
  }, [address]);

  const initializeMessaging = async () => {
    if (!address) return;

    setIsInitializing(true);
    try {
      const service = new MessagingService('0x424bDf2E8a6F52Bd2c1C81D9437b0DC0309DF90f' as Address);

      // Mock wallet for XMTP initialization
      const mockWallet = { address: address as string };
      await service.initialize(mockWallet as { address: string });

      setMessagingService(service);

      // Load conversations
      const convs = await service.getConversations();
      setConversations(convs);

      toast.success('Messaging initialized');
    } catch (error) {
      console.error('Failed to initialize messaging:', error);
      toast.error('Failed to initialize messaging');
    } finally {
      setIsInitializing(false);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !messagingService || !selectedConversation) return;

    try {
      const recipient = selectedConversation.participants.find(p => p !== address) as Address;

      const message = await messagingService.sendMessage(
        recipient,
        newMessage,
        selectedConversation.domainContext
      );

      setMessages([...messages, message]);
      setNewMessage('');

      // Scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      toast.error('Failed to send message');
      console.error(error);
    }
  };

  // Start new conversation
  const handleStartConversation = async () => {
    if (!recipientAddress || !messagingService) return;

    try {
      const message = await messagingService.sendMessage(
        recipientAddress as Address,
        'Hello! I\'d like to discuss a domain transaction.',
        undefined
      );

      toast.success('Conversation started');
      setShowNewConversation(false);
      setRecipientAddress('');

      // Refresh conversations
      const convs = await messagingService.getConversations();
      setConversations(convs);

      // Select the new conversation
      const newConv = convs.find(c => c.messages.some(m => m.id === message.id));
      if (newConv) {
        setSelectedConversation(newConv);
        setMessages(newConv.messages);
      }
    } catch (error) {
      toast.error('Failed to start conversation');
      console.error(error);
    }
  };

  // Start negotiation for a domain
  const handleStartNegotiation = async (domainId: string, seller: Address, offer: string) => {
    if (!messagingService || !address) return;

    try {
      const conversation = await messagingService.createNegotiationChannel(
        domainId,
        address as Address,
        seller,
        BigInt(Math.floor(parseFloat(offer) * 1e18))
      );

      setConversations([...conversations, conversation]);
      setSelectedConversation(conversation);
      toast.success('Negotiation started');
    } catch (error) {
      toast.error('Failed to start negotiation');
      console.error(error);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv =>
    conv.messages.some(msg =>
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Format timestamp
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h2 className="text-2xl font-bold mb-2">Connect Wallet</h2>
          <p className="text-gray-400">Connect your wallet to access messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Conversations List */}
      <div className="w-80 bg-[var(--card-bg)] border-r border-[var(--border)]">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Messages</h2>
            <button
              onClick={() => setShowNewConversation(true)}
              className="p-2 bg-[var(--primary)] rounded-lg hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-white placeholder-gray-400"
            />
          </div>
        </div>

        <div className="overflow-y-auto">
          {isInitializing ? (
            <div className="p-4 text-center text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-2"></div>
              Initializing messaging...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <Inbox className="w-12 h-12 mx-auto mb-3 text-gray-500" />
              <p className="text-gray-400 text-sm">No conversations yet</p>
              <button
                onClick={() => setShowNewConversation(true)}
                className="mt-4 text-[var(--primary)] hover:underline text-sm"
              >
                Start a conversation
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const otherParticipant = conv.participants.find(p => p !== address);
              const lastMessage = conv.messages[conv.messages.length - 1];
              const isActive = selectedConversation?.id === conv.id;

              return (
                <motion.div
                  key={conv.id}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  onClick={() => {
                    setSelectedConversation(conv);
                    setMessages(conv.messages);
                  }}
                  className={`p-4 cursor-pointer border-b border-[var(--border)] ${
                    isActive ? 'bg-[var(--primary)]/10 border-l-2 border-[var(--primary)]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-semibold">
                        {otherParticipant?.slice(2, 4).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {otherParticipant?.slice(0, 6)}...{otherParticipant?.slice(-4)}
                        </p>
                        {conv.domainContext && (
                          <p className="text-xs text-[var(--primary)]">
                            Domain #{conv.domainContext}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {lastMessage && formatTime(lastMessage.timestamp)}
                    </span>
                  </div>

                  {lastMessage && (
                    <p className="text-sm text-gray-400 truncate">
                      {lastMessage.content}
                    </p>
                  )}

                  {conv.topic !== 'general' && (
                    <div className="mt-2 flex gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        conv.topic === 'negotiation' ? 'bg-blue-500/20 text-blue-400' :
                        conv.topic === 'support' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {conv.topic}
                      </span>
                      {lastMessage?.verified && (
                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-[var(--card-bg)] border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-semibold">
                  {selectedConversation.participants.find(p => p !== address)?.slice(2, 4).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {selectedConversation.participants.find(p => p !== address)?.slice(0, 6)}...
                    {selectedConversation.participants.find(p => p !== address)?.slice(-4)}
                  </p>
                  {selectedConversation.domainContext && (
                    <p className="text-xs text-gray-400">Discussing Domain #{selectedConversation.domainContext}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedConversation.status === 'active' && (
                  <button
                    onClick={() => {
                      if (messagingService) {
                        messagingService.archiveConversation(selectedConversation.id);
                        toast.success('Conversation archived');
                      }
                    }}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Archive className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messages.map((message, index) => {
                  const isOwn = message.sender === address;

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-lg ${isOwn ? 'order-2' : ''}`}>
                        <div className={`rounded-lg px-4 py-3 ${
                          isOwn
                            ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white'
                            : 'bg-gray-700 text-white'
                        }`}>
                          {message.senderDomain && (
                            <p className="text-xs opacity-75 mb-1">{message.senderDomain}</p>
                          )}
                          <p className="break-words">{message.content}</p>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((att, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs opacity-75">
                                  <Paperclip className="w-3 h-3" />
                                  <span>{att.type}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 px-1">
                          <span className="text-xs text-gray-400">
                            {formatTime(message.timestamp)}
                          </span>
                          {message.verified && (
                            <Shield className="w-3 h-3 text-green-400" title="Domain Verified" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-[var(--card-bg)] border-t border-[var(--border)]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[var(--primary)]"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-3 bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
              <p className="text-gray-400">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--card-bg)] rounded-xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">New Conversation</h2>
              <button
                onClick={() => setShowNewConversation(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Recipient Address</label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p>Messages are encrypted end-to-end using XMTP protocol.</p>
                    <p className="mt-1">Domain ownership can be verified for trusted communication.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleStartConversation}
                  disabled={!recipientAddress}
                  className="flex-1 py-3 bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                >
                  Start Conversation
                </button>
                <button
                  onClick={() => setShowNewConversation(false)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}