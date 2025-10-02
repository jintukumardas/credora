'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export function Header() {
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
              href="/lending"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Lending
            </Link>
            <Link
              href="/leasing"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Leasing
            </Link>
            <Link
              href="/revenue"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Revenue
            </Link>
          </nav>

          <ConnectButton />
        </div>
      </div>
    </motion.header>
  );
}
