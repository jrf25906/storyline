import { 
  ChevronLeft, ChevronRight, FileText, Home, 
  Settings, BookOpen, Mic, MessageSquare, Plus 
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@utils/cn';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/documents', icon: FileText, label: 'Documents' },
    { path: '/editor', icon: BookOpen, label: 'Editor' },
    { path: '/chat', icon: MessageSquare, label: 'AI Chat' },
    { path: '/voice', icon: Mic, label: 'Voice Notes' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 z-20",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Logo and toggle */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-primary-400" />
              <span className="text-xl font-bold">Storyline</span>
            </div>
          )}
          
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* New document button */}
        <div className="p-4">
          <button
            onClick={() => navigate('/editor')}
            className={cn(
              "w-full flex items-center gap-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors",
              collapsed ? "p-3 justify-center" : "px-4 py-3"
            )}
          >
            <Plus className="w-5 h-5" />
            {!collapsed && <span>New Document</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-1",
                isActive 
                  ? "bg-gray-800 text-primary-400" 
                  : "hover:bg-gray-800 text-gray-300 hover:text-white",
                collapsed && "justify-center"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-800">
          <div className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
          )}>
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium">JD</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">John Doe</p>
                <p className="text-xs text-gray-400 truncate">john@example.com</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}