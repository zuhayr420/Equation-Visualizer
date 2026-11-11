import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '../../store/useAppStore';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col font-sans selection:bg-text-main selection:text-background">
      <Sidebar />
      <Header />
      <main
        className={`flex-1 p-4 md:p-6 transition-all duration-200 ${
          sidebarCollapsed ? 'ml-16' : 'ml-60'
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-6">{children}</div>
      </main>
    </div>
  );
};
