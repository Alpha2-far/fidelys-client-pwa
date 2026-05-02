import React from 'react';

type Tab = 'card' | 'qr' | 'points' | 'offers';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
  {
    id: 'card',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2" />
        <path d="M2 10h20" strokeWidth="2" />
      </svg>
    ),
    label: 'Carte'
  },
  {
    id: 'qr',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h6v6h-6zM7 7h2v2H7zM19 7h2v2h-2zM7 19h2v2H7zM19 19h2v2h-2z" strokeWidth="2" />
      </svg>
    ),
    label: 'QR'
  },
  {
    id: 'points',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: 'Points'
  },
  {
    id: 'offers',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: 'Offres'
  }
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-100/95 backdrop-blur-lg border-t border-white/10 safe-area-bottom safe-bottom">
      <div className="flex items-center justify-around py-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-full py-2 px-3 transition-colors ${
                isActive
                  ? 'text-violet-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                {tab.icon}
              </div>
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-1 h-1 bg-violet-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
