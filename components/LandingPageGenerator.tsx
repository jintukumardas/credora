'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Eye,
  Code,
  Palette,
  Layout,
  Type,
  Loader2,
  Copy,
  ExternalLink,
  Settings,
  Sparkles,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { geminiService, LandingPageContent } from '@/lib/gemini-service';
import toast from 'react-hot-toast';

type DevicePreview = 'desktop' | 'tablet' | 'mobile';
type ViewMode = 'preview' | 'code';

export function LandingPageGenerator() {
  const [domainName, setDomainName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [style, setStyle] = useState<'modern' | 'classic' | 'minimal' | 'bold'>('modern');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<LandingPageContent | null>(null);
  const [devicePreview, setDevicePreview] = useState<DevicePreview>('desktop');
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const styles = [
    { id: 'modern', name: 'Modern', description: 'Clean and contemporary design' },
    { id: 'classic', name: 'Classic', description: 'Timeless and professional' },
    { id: 'minimal', name: 'Minimal', description: 'Simple and focused' },
    { id: 'bold', name: 'Bold', description: 'Eye-catching and vibrant' }
  ];

  const handleGenerate = async () => {
    if (!domainName.trim() || !businessType.trim()) {
      toast.error('Please fill in domain name and business type');
      return;
    }

    setIsGenerating(true);
    try {
      const content = await geminiService.generateLandingPage(domainName, {
        type: businessType,
        description: businessDescription,
        targetAudience: targetAudience || 'general audience',
        style
      });

      setGeneratedContent(content);
      toast.success('Landing page generated successfully!');
    } catch (error) {
      toast.error('Failed to generate landing page');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadHTML = () => {
    if (!generatedContent?.htmlContent) return;

    const blob = new Blob([generatedContent.htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${domainName.replace(/\./g, '-')}-landing-page.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Landing page downloaded!');
  };

  const copyCode = () => {
    if (!generatedContent?.htmlContent) return;

    navigator.clipboard.writeText(generatedContent.htmlContent);
    toast.success('HTML code copied to clipboard!');
  };

  const getDeviceClasses = () => {
    switch (devicePreview) {
      case 'mobile':
        return 'max-w-[375px] mx-auto';
      case 'tablet':
        return 'max-w-[768px] mx-auto';
      default:
        return 'w-full';
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
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">AI Landing Page Generator</h1>
              <p className="text-gray-400">Create beautiful landing pages for your domains with AI</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Configuration Panel */}
          <div className="xl:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 sticky top-4"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuration
              </h2>

              {/* Domain Name */}
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">Domain Name *</label>
                <input
                  type="text"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  placeholder="e.g., example.com"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Business Type */}
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">Business Type *</label>
                <input
                  type="text"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  placeholder="e.g., SaaS, E-commerce"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Business Description */}
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">Business Description</label>
                <textarea
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder="Brief description of your business..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* Target Audience */}
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">Target Audience</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., Small businesses"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Style Selection */}
              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2">
                  <Palette className="inline w-4 h-4 mr-1" />
                  Design Style
                </label>
                <div className="space-y-2">
                  {styles.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id as any)}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        style === s.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs opacity-80">{s.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
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
                    Generate Landing Page
                  </>
                )}
              </button>
            </motion.div>
          </div>

          {/* Preview Area */}
          <div className="xl:col-span-3">
            <AnimatePresence mode="wait">
              {generatedContent ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {/* Controls Bar */}
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-t-xl p-4 border border-gray-700 border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewMode('preview')}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            viewMode === 'preview'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          <Eye className="inline w-4 h-4 mr-2" />
                          Preview
                        </button>
                        <button
                          onClick={() => setViewMode('code')}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            viewMode === 'code'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          <Code className="inline w-4 h-4 mr-2" />
                          Code
                        </button>
                      </div>

                      {viewMode === 'preview' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDevicePreview('desktop')}
                            className={`p-2 rounded-lg transition-all ${
                              devicePreview === 'desktop'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            <Monitor className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDevicePreview('tablet')}
                            className={`p-2 rounded-lg transition-all ${
                              devicePreview === 'tablet'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            <Tablet className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDevicePreview('mobile')}
                            className={`p-2 rounded-lg transition-all ${
                              devicePreview === 'mobile'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            <Smartphone className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={copyCode}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Copy Code
                        </button>
                        <button
                          onClick={downloadHTML}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-b-xl border border-gray-700 border-t-0">
                    {viewMode === 'preview' ? (
                      <div className={`bg-white rounded-b-xl ${getDeviceClasses()} transition-all duration-300`}>
                        {generatedContent?.htmlContent ? (
                          <iframe
                            ref={iframeRef}
                            srcDoc={generatedContent.htmlContent}
                            className="w-full h-[600px] rounded-b-xl"
                            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                            title="Landing Page Preview"
                          />
                        ) : (
                          <div className="w-full h-[600px] rounded-b-xl flex items-center justify-center bg-gray-50">
                            <p className="text-gray-400">Generate a landing page to see the preview</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 max-h-[600px] overflow-auto">
                        <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap">
                          <code>{generatedContent.htmlContent}</code>
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Page Details */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                      <h3 className="text-lg font-bold text-white mb-2">Page Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Title:</span>
                          <span className="text-white">{generatedContent.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Tagline:</span>
                          <span className="text-white truncate ml-2">{generatedContent.tagline}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Features:</span>
                          <span className="text-white">{generatedContent.features.length} sections</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                      <h3 className="text-lg font-bold text-white mb-2">Color Scheme</h3>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <div
                            className="h-10 rounded-lg mb-1"
                            style={{ backgroundColor: generatedContent.colorScheme.primary }}
                          />
                          <p className="text-xs text-gray-400 text-center">Primary</p>
                        </div>
                        <div className="flex-1">
                          <div
                            className="h-10 rounded-lg mb-1"
                            style={{ backgroundColor: generatedContent.colorScheme.secondary }}
                          />
                          <p className="text-xs text-gray-400 text-center">Secondary</p>
                        </div>
                        <div className="flex-1">
                          <div
                            className="h-10 rounded-lg mb-1"
                            style={{ backgroundColor: generatedContent.colorScheme.accent }}
                          />
                          <p className="text-xs text-gray-400 text-center">Accent</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-12 border border-gray-700 text-center h-[600px] flex flex-col items-center justify-center">
                  <Layout className="w-16 h-16 text-gray-600 mb-4" />
                  <h3 className="text-xl font-medium text-gray-400 mb-2">No Landing Page Yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Configure your domain details and click "Generate Landing Page" to create a beautiful landing page with AI
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