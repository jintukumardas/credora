'use client';

import { ExternalLink, Shuffle, BookOpen, Activity } from 'lucide-react';

export function DomaResources() {
  const resources = [
    {
      name: 'Doma Bridge',
      description: 'Bridge ETH to Doma Testnet',
      url: 'https://bridge-testnet.doma.xyz',
      icon: Shuffle,
    },
    {
      name: 'Block Explorer',
      description: 'View transactions and contracts',
      url: 'https://explorer-testnet.doma.xyz',
      icon: Activity,
    },
    {
      name: 'Documentation',
      description: 'Learn about Doma Protocol',
      url: 'https://docs.doma.xyz',
      icon: BookOpen,
    },
  ];

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6">
      <h3 className="text-lg font-bold mb-4">Doma Resources</h3>
      <div className="space-y-3">
        {resources.map((resource) => {
          const Icon = resource.icon;
          return (
            <a
              key={resource.name}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background)] hover:bg-gray-800 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white group-hover:text-[var(--primary)] transition-colors">
                  {resource.name}
                </div>
                <div className="text-xs text-gray-400">{resource.description}</div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-[var(--primary)] transition-colors flex-shrink-0" />
            </a>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <div className="text-xs text-gray-400 text-center">
          Chain ID: 97476 • RPC: rpc-testnet.doma.xyz
        </div>
      </div>
    </div>
  );
}
