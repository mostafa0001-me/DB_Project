import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useLocation } from 'wouter';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  // Close sidebar on location change (for mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile sidebar overlay - only render when open */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-30" 
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          ></div>
          <div className="relative z-50">
            <Sidebar 
              onClose={() => setSidebarOpen(false)} 
              className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg overflow-y-auto" 
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar - always visible on md+ screens */}
      <Sidebar className="hidden md:flex md:flex-col md:w-64 bg-white shadow-md z-10" />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} onMenuClick={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}