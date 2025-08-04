import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from '../sidebar/Sidebar';
import { useState } from 'react';
import { cn } from '@utils/cn';

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-64"
      )}>
        <Header />
        
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}