import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} fixed inset-0 z-50 md:hidden`}>
        <div className="absolute inset-0 bg-black opacity-30" onClick={toggleSidebar}></div>
        <Sidebar onClose={toggleSidebar} className="fixed inset-y-0 left-0 z-50 w-64" />
      </div>

      {/* Desktop sidebar */}
      <Sidebar className="hidden md:flex md:flex-col w-64 bg-white shadow-md z-10" />

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
