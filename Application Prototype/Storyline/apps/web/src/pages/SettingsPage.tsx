import { useState } from 'react';
import { Save, User, Bell, Shield, Palette, Globe, HelpCircle } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import toast from 'react-hot-toast';

export function SettingsPage() {
  const [settings, setSettings] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    notifications: {
      email: true,
      push: true,
      reminders: true,
    },
    privacy: {
      publicProfile: false,
      shareAnalytics: true,
    },
    appearance: {
      theme: 'system',
      fontSize: 'medium',
    },
  });

  const handleSave = () => {
    // Save settings logic
    toast.success('Settings saved successfully');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Settings
      </h1>

      <Tabs.Root defaultValue="profile" className="space-y-6">
        <Tabs.List className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <Tabs.Trigger 
            value="profile"
            className="flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all"
          >
            <User className="w-4 h-4" />
            Profile
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="notifications"
            className="flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all"
          >
            <Bell className="w-4 h-4" />
            Notifications
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="privacy"
            className="flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all"
          >
            <Shield className="w-4 h-4" />
            Privacy
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="appearance"
            className="flex items-center gap-2 px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all"
          >
            <Palette className="w-4 h-4" />
            Appearance
          </Tabs.Trigger>
        </Tabs.List>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <Tabs.Content value="profile" className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </Tabs.Content>

          <Tabs.Content value="notifications" className="space-y-6">
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-gray-500">Receive updates via email</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, email: e.target.checked }
                  })}
                  className="w-5 h-5"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Push Notifications</div>
                  <div className="text-sm text-gray-500">Get browser notifications</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.push}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, push: e.target.checked }
                  })}
                  className="w-5 h-5"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Writing Reminders</div>
                  <div className="text-sm text-gray-500">Daily reminders to write</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.reminders}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, reminders: e.target.checked }
                  })}
                  className="w-5 h-5"
                />
              </label>
            </div>
          </Tabs.Content>

          <Tabs.Content value="privacy" className="space-y-6">
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Public Profile</div>
                  <div className="text-sm text-gray-500">Allow others to see your profile</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.publicProfile}
                  onChange={(e) => setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, publicProfile: e.target.checked }
                  })}
                  className="w-5 h-5"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Share Analytics</div>
                  <div className="text-sm text-gray-500">Help improve Storyline with anonymous data</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.shareAnalytics}
                  onChange={(e) => setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, shareAnalytics: e.target.checked }
                  })}
                  className="w-5 h-5"
                />
              </label>
            </div>
          </Tabs.Content>

          <Tabs.Content value="appearance" className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <select
                value={settings.appearance.theme}
                onChange={(e) => setSettings({
                  ...settings,
                  appearance: { ...settings.appearance, theme: e.target.value }
                })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Editor Font Size
              </label>
              <select
                value={settings.appearance.fontSize}
                onChange={(e) => setSettings({
                  ...settings,
                  appearance: { ...settings.appearance, fontSize: e.target.value }
                })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </Tabs.Content>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>
      </Tabs.Root>
    </div>
  );
}