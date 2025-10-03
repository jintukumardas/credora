'use client';

import { Header } from '@/components/Header';
import { MessagingHub } from '@/components/MessagingHub';

export default function MessagingPage() {
  return (
    <>
      <Header />
      <div className="h-[calc(100vh-64px)]">
        <MessagingHub />
      </div>
    </>
  );
}