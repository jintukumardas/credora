'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  Search,
  Tag,
  Star,
  CheckCircle,
  XCircle,
  Briefcase,
  Users,
  Globe,
  Hash,
  Loader2,
  Copy,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { geminiService, DomainSuggestion } from '@/lib/gemini-service';
import toast from 'react-hot-toast';

export function DomainSuggester() {
  const [businessType, setBusinessType] = useState('');
  const [keywords, setKeywords] = useState('');
  const [industry, setIndustry] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [preferredTlds, setPreferredTlds] = useState<string[]>(['com', 'io']);
  const [suggestions, setSuggestions] = useState<DomainSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<DomainSuggestion | null>(null);

  const availableTlds = ['com', 'io', 'xyz', 'app', 'dev', 'ai', 'net', 'org', 'co', 'tech'];

  const handleGenerateSuggestions = async () => {
    if (!businessType.trim() || !keywords.trim()) {
      toast.error('Please fill in business type and keywords');
      return;
    }

    setIsGenerating(true);
    try {
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);

      const results = await geminiService.suggestDomains({
        businessType,
        keywords: keywordArray,
        industry: industry || businessType,
        targetAudience: targetAudience || 'general audience',
        preferredTlds
      }, 15);

      setSuggestions(results);
      toast.success(`Generated ${results.length} domain suggestions!`);
    } catch (error) {
      toast.error('Failed to generate suggestions');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTld = (tld: string) => {
    setPreferredTlds(prev =>
      prev.includes(tld)
        ? prev.filter(t => t !== tld)
        : [...prev, tld]
    );
  };

  const copyDomain = (domain: string, tld: string) => {
    navigator.clipboard.writeText(`${domain}.${tld}`);
    toast.success('Domain copied to clipboard!');
  };

  const checkAvailability = (suggestion: DomainSuggestion) => {
    // In production, this would check real availability
    toast('Checking availability...', { icon: '🔍' });
    setSelectedSuggestion(suggestion);
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
              <Lightbulb className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">AI Domain Name Suggester</h1>
              <p className="text-gray-400">Get perfect domain names for your business with AI</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 sticky top-4"
            >
              <h2 className="text-xl font-bold text-white mb-4">Business Details</h2>

              {/* Business Type */}
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">
                  <Briefcase className="inline w-4 h-4 mr-1" />
                  Business Type *
                </label>
                <input
                  type="text"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  placeholder="e.g., E-commerce, SaaS, Blog"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Keywords */}
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">
                  <Hash className="inline w-4 h-4 mr-1" />
                  Keywords * (comma-separated)
                </label>
                <textarea
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g., tech, innovation, smart, cloud"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* Industry */}
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">
                  <Globe className="inline w-4 h-4 mr-1" />
                  Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select Industry</option>
                  <option value="technology">Technology</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="retail">Retail</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="realestate">Real Estate</option>
                  <option value="travel">Travel</option>
                  <option value="food">Food & Beverage</option>
                  <option value="fashion">Fashion</option>
                </select>
              </div>

              {/* Target Audience */}
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">
                  <Users className="inline w-4 h-4 mr-1" />
                  Target Audience
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., Young professionals, Businesses"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Preferred TLDs */}
              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2">
                  <Tag className="inline w-4 h-4 mr-1" />
                  Preferred Extensions
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTlds.map(tld => (
                    <button
                      key={tld}
                      onClick={() => toggleTld(tld)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        preferredTlds.includes(tld)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      .{tld}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateSuggestions}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Suggestions
                  </>
                )}
              </button>
            </motion.div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            <AnimatePresence>
              {suggestions.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">
                      Suggested Domains ({suggestions.length})
                    </h2>
                    <button
                      onClick={() => setSuggestions([])}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Clear Results
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {suggestions.map((suggestion, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-white">
                              {suggestion.domain}.{suggestion.tld}
                            </h3>
                            {suggestion.availability !== undefined && (
                              suggestion.availability ? (
                                <span className="flex items-center gap-1 text-green-400 text-sm">
                                  <CheckCircle className="w-4 h-4" />
                                  Available
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-red-400 text-sm">
                                  <XCircle className="w-4 h-4" />
                                  Taken
                                </span>
                              )
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Score Badge */}
                            <div className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 rounded-full">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="text-yellow-500 font-medium">{suggestion.score}</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-300 mb-4">{suggestion.reason}</p>

                        <div className="flex gap-2">
                          <button
                            onClick={() => copyDomain(suggestion.domain, suggestion.tld)}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Copy
                          </button>
                          <button
                            onClick={() => checkAvailability(suggestion)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors flex items-center gap-2"
                          >
                            <Search className="w-4 h-4" />
                            Check Availability
                          </button>
                          <button
                            onClick={() => window.open(`https://testnet.interstellar.xyz/search?query=${suggestion.domain}.${suggestion.tld}&partner=com&type=web2`, '_blank')}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Register
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Tips Section */}
                  <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-3">💡 Pro Tips</h3>
                    <ul className="space-y-2 text-gray-300 text-sm">
                      <li>• Short domains (under 10 characters) are generally more valuable</li>
                      <li>• Avoid hyphens and numbers unless necessary for your brand</li>
                      <li>• Consider buying multiple TLDs to protect your brand</li>
                      <li>• Check for trademark conflicts before registering</li>
                      <li>• Domains with dictionary words tend to have higher resale value</li>
                    </ul>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-12 border border-gray-700 text-center">
                  <Lightbulb className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-400 mb-2">No Suggestions Yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Fill in your business details and click "Generate Suggestions" to get AI-powered domain name ideas
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}