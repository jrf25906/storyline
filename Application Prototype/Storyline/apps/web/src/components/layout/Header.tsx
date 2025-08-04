import { Bell, Search, User, Settings, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between">
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-6">
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium">{user?.name || 'User'}</span>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content 
              className="min-w-[200px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2"
              sideOffset={5}
            >
              <DropdownMenu.Item 
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                onClick={() => navigate('/settings')}
              >
                <Settings className="w-4 h-4" />
                Settings
              </DropdownMenu.Item>
              
              <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
              
              <DropdownMenu.Item 
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}