'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, ChevronDown, Brain, Lightbulb, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function Header() {
  const [isAIDropdownOpen, setIsAIDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAIDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 backdrop-blur-xl bg-black/50 border-b border-[var(--border)]"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 transition-transform group-hover:scale-110">
              <Image
                src="/icon.png"
                alt="Credora"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold gradient-text">Credora</h1>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/marketplace"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="/lending"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Lending
            </Link>
            <Link
              href="/leasing"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Leasing & Fractionalization
            </Link>

            {/* AI Tools Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsAIDropdownOpen(!isAIDropdownOpen)}
                className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                AI Tools
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isAIDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {isAIDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 w-64 bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-xl shadow-xl overflow-hidden"
                  >
                    <Link
                      href="/ai-analyzer"
                      onClick={() => setIsAIDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-purple-600/20 transition-colors group"
                    >
                      <Brain className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
                      <div>
                        <div className="text-white font-medium">Domain Analyzer</div>
                        <div className="text-xs text-gray-400">AI-powered insights</div>
                      </div>
                    </Link>

                    <Link
                      href="/ai-suggester"
                      onClick={() => setIsAIDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-purple-600/20 transition-colors group"
                    >
                      <Lightbulb className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300" />
                      <div>
                        <div className="text-white font-medium">Name Suggester</div>
                        <div className="text-xs text-gray-400">Generate domain ideas</div>
                      </div>
                    </Link>

                    <Link
                      href="/ai-landing"
                      onClick={() => setIsAIDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-purple-600/20 transition-colors group"
                    >
                      <FileText className="w-5 h-5 text-green-400 group-hover:text-green-300" />
                      <div>
                        <div className="text-white font-medium">Landing Page Generator</div>
                        <div className="text-xs text-gray-400">Create instant websites</div>
                      </div>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              href="/messaging"
              className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Messages
            </Link>
          </nav>

          <ConnectButton />
        </div>
      </div>
    </motion.header>
  );
}
