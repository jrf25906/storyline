import { create } from 'zustand';

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

interface EditorState {
  content: string;
  wordCount: number;
  characterCount: number;
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  isFullscreen: boolean;
  selectedText: string;
  
  setContent: (content: string) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setFullscreen: (isFullscreen: boolean) => void;
  setSelectedText: (text: string) => void;
  updateCounts: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  content: '',
  wordCount: 0,
  characterCount: 0,
  saveStatus: 'saved',
  lastSaved: null,
  isFullscreen: false,
  selectedText: '',
  
  setContent: (content) => {
    set({ content });
    get().updateCounts();
  },
  
  setSaveStatus: (status) => {
    set({ 
      saveStatus: status,
      lastSaved: status === 'saved' ? new Date() : get().lastSaved
    });
  },
  
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  
  setSelectedText: (selectedText) => set({ selectedText }),
  
  updateCounts: () => {
    const { content } = get();
    const text = content.replace(/<[^>]*>/g, ''); // Strip HTML tags
    const words = text.trim().split(/\s+/).filter(Boolean);
    
    set({
      wordCount: words.length,
      characterCount: text.length,
    });
  },
}));