import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Grid, List, Calendar, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@utils/cn';

interface Document {
  id: string;
  title: string;
  excerpt: string;
  wordCount: number;
  lastModified: Date;
  createdAt: Date;
  tags: string[];
}

export function DocumentsPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Mock data - replace with actual API call
  const documents: Document[] = [
    {
      id: '1',
      title: 'Chapter 1: The Beginning',
      excerpt: 'It was a dark and stormy night when everything changed...',
      wordCount: 2500,
      lastModified: new Date('2024-01-20'),
      createdAt: new Date('2024-01-15'),
      tags: ['fiction', 'chapter', 'draft'],
    },
    {
      id: '2',
      title: 'My Journey Through Europe',
      excerpt: 'The cobblestone streets of Prague hold memories that...',
      wordCount: 1800,
      lastModified: new Date('2024-01-22'),
      createdAt: new Date('2024-01-18'),
      tags: ['memoir', 'travel', 'personal'],
    },
    // Add more mock documents as needed
  ];

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => doc.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const allTags = Array.from(new Set(documents.flatMap(doc => doc.tags)));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          My Documents
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {documents.length} documents • {documents.reduce((acc, doc) => acc + doc.wordCount, 0).toLocaleString()} total words
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded",
                viewMode === 'grid' 
                  ? "bg-white dark:bg-gray-700 shadow-sm" 
                  : "hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded",
                viewMode === 'list' 
                  ? "bg-white dark:bg-gray-700 shadow-sm" 
                  : "hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New Document */}
        <button
          onClick={() => navigate('/editor')}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Document
        </button>
      </div>

      {/* Tags Filter */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-gray-600 dark:text-gray-400">Filter by tags:</span>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => {
              setSelectedTags(prev =>
                prev.includes(tag)
                  ? prev.filter(t => t !== tag)
                  : [...prev, tag]
              );
            }}
            className={cn(
              "px-3 py-1 rounded-full text-sm transition-colors",
              selectedTags.includes(tag)
                ? "bg-primary-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Documents Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              onClick={() => navigate(`/editor/${doc.id}`)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-6"
            >
              <FileText className="w-8 h-8 text-gray-400 mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                {doc.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                {doc.excerpt}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{doc.wordCount.toLocaleString()} words</span>
                <span>{format(doc.lastModified, 'MMM d')}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              onClick={() => navigate(`/editor/${doc.id}`)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4 flex items-center gap-4"
            >
              <FileText className="w-6 h-6 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {doc.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {doc.excerpt}
                </p>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span>{doc.wordCount.toLocaleString()} words</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{format(doc.lastModified, 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}