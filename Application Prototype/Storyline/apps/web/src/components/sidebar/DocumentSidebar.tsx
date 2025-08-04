import { X, Hash, Clock, FileText, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@utils/cn';

interface DocumentSidebarProps {
  documentId?: string;
  onClose: () => void;
}

interface OutlineItem {
  id: string;
  title: string;
  level: number;
  position: number;
}

export function DocumentSidebar({ documentId, onClose }: DocumentSidebarProps) {
  const [activeTab, setActiveTab] = useState<'outline' | 'info'>('outline');
  
  // Mock outline data - would be generated from document content
  const outline: OutlineItem[] = [
    { id: '1', title: 'Introduction', level: 1, position: 0 },
    { id: '2', title: 'Background', level: 2, position: 100 },
    { id: '3', title: 'Main Argument', level: 1, position: 500 },
    { id: '4', title: 'Supporting Evidence', level: 2, position: 600 },
    { id: '5', title: 'Counter Arguments', level: 2, position: 800 },
    { id: '6', title: 'Conclusion', level: 1, position: 1200 },
  ];

  const scrollToSection = (position: number) => {
    // Implement scroll logic to position in editor
    console.log('Scrolling to position:', position);
  };

  return (
    <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Document Overview
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('outline')}
            className={cn(
              "flex-1 py-1.5 px-3 rounded text-sm font-medium transition-colors",
              activeTab === 'outline' 
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
                : "text-gray-600 dark:text-gray-400"
            )}
          >
            Outline
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={cn(
              "flex-1 py-1.5 px-3 rounded text-sm font-medium transition-colors",
              activeTab === 'info' 
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
                : "text-gray-600 dark:text-gray-400"
            )}
          >
            Info
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'outline' ? (
          <div className="space-y-1">
            {outline.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.position)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors flex items-center gap-2",
                  item.level === 1 ? "font-medium" : "text-sm text-gray-600 dark:text-gray-400"
                )}
                style={{ paddingLeft: `${item.level * 12}px` }}
              >
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{item.title}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-sm">Word Count</span>
              </div>
              <div className="text-2xl font-semibold">2,458</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Reading Time</span>
              </div>
              <div className="text-2xl font-semibold">12 min</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-3">
                <Hash className="w-4 h-4" />
                <span className="text-sm">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                  fiction
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                  chapter
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                  draft
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}