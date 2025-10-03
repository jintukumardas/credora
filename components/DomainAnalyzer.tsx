'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Send,
  Sparkles,
  TrendingUp,
  Globe,
  BarChart3,
  Shield,
  Zap,
  Info,
  Search,
  Loader2
} from 'lucide-react';
import { geminiService } from '@/lib/gemini-service';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AnalysisResult {
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

export function DomainAnalyzer() {
  const [domainInput, setDomainInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState<'analyze' | 'chat'>('analyze');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAnalyze = async () => {
    if (!domainInput.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await geminiService.analyzeDomain(domainInput);
      setAnalysisResult(result);
      toast.success('Domain analysis complete!');
    } catch (error) {
      toast.error('Failed to analyze domain');
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    if (!domainInput.trim()) {
      toast.error('Please enter a domain name first');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatting(true);

    try {
      const response = await geminiService.chatAboutDomain(
        domainInput,
        chatInput,
        messages.map(m => ({ role: m.role, content: m.content }))
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to get response');
      console.error(error);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Domain AI Analyzer</h1>
              <p className="text-gray-400">Powered by Gemini AI - Get insights about any domain</p>
            </div>
          </div>
        </motion.div>

        {/* Domain Input */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-700">
          <label className="block text-gray-400 mb-2">Enter Domain Name</label>
          <div className="flex gap-4">
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="e.g., example.com, mydomain.io"
              className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Analyze
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'analyze'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:border-purple-500'
            }`}
          >
            <BarChart3 className="inline-block w-4 h-4 mr-2" />
            Analysis Results
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:border-purple-500'
            }`}
          >
            <MessageCircle className="inline-block w-4 h-4 mr-2" />
            Chat with AI
          </button>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'analyze' ? (
            <motion.div
              key="analyze"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {analysisResult ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Main Metrics */}
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="text-purple-500" />
                      Key Metrics
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-400">SEO Score</span>
                          <span className="text-white font-medium">{analysisResult.analysis.seoScore}/100</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
                            style={{ width: `${analysisResult.analysis.seoScore}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-400">Memorability</span>
                          <span className="text-white font-medium">{analysisResult.analysis.memorability}/100</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                            style={{ width: `${analysisResult.analysis.memorability}%` }}
                          />
                        </div>
                      </div>
                      <div className="pt-4 border-t border-gray-700">
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-400">Market Value</span>
                          <span className="text-purple-400 font-medium">{analysisResult.analysis.marketValue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Estimated Value</span>
                          <span className="text-green-400 font-bold">{analysisResult.analysis.estimatedValue}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Brand Potential */}
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Zap className="text-yellow-500" />
                      Brand Potential
                    </h3>
                    <p className="text-gray-300 mb-4">{analysisResult.analysis.brandPotential}</p>
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                      <h4 className="text-purple-400 font-medium mb-2">Industry Relevance</h4>
                      <p className="text-gray-300 text-sm">{analysisResult.analysis.industryRelevance}</p>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Info className="text-blue-500" />
                      Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {analysisResult.analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span className="text-gray-300">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Future Outlook */}
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Globe className="text-green-500" />
                      Future Outlook
                    </h3>
                    <p className="text-gray-300 mb-4">{analysisResult.analysis.futureOutlook}</p>
                    <div className="mt-4">
                      <h4 className="text-gray-400 text-sm font-medium mb-2">Similar Domains</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.analysis.competitors.map((comp, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-12 border border-gray-700 text-center">
                  <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-400 mb-2">No Analysis Yet</h3>
                  <p className="text-gray-500">Enter a domain name above to get AI-powered insights</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700"
            >
              {/* Chat Messages */}
              <div className="h-[500px] overflow-y-auto p-6">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageCircle className="w-16 h-16 text-gray-600 mb-4" />
                    <h3 className="text-xl font-medium text-gray-400 mb-2">Start a Conversation</h3>
                    <p className="text-gray-500 max-w-md">
                      Ask anything about the domain - valuation, SEO potential, business opportunities, and more!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-xl p-4 ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                              : 'bg-gray-700 text-gray-200'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    {isChatting && (
                      <div className="flex justify-start">
                        <div className="bg-gray-700 rounded-xl p-4">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isChatting && handleSendMessage()}
                    placeholder="Ask about domain value, SEO, business potential..."
                    className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    disabled={isChatting}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isChatting || !chatInput.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}