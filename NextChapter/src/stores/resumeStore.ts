import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Resume, 
  ResumeAnalysis, 
  ResumeRewriteRequest,
  ResumeRewriteResponse,
  ResumeUploadProgress,
  ResumeKeywordMatch
} from '../types/resume';
import { ResumeParser } from '../services/resume/resumeParser';
import { ResumeAIService } from '../services/resume/resumeAI';
import { openAIService } from '../services/api/openai';

interface ResumeStore {
  // State
  resumes: Resume[];
  currentResume: Resume | null;
  analyses: Record<string, ResumeAnalysis>;
  currentAnalysis: ResumeAnalysis | null;
  rewriteSuggestions: ResumeRewriteResponse | null;
  uploadProgress: ResumeUploadProgress | null;
  isLoading: boolean;
  error: string | null;
  hasAIConsent: boolean;

  // Actions
  uploadResume: () => Promise<void>;
  analyzeResume: (jobDescription?: string) => Promise<void>;
  generateRewriteSuggestions: (request: ResumeRewriteRequest) => Promise<void>;
  deleteResume: (resumeId: string) => Promise<void>;
  setCurrentResume: (resume: Resume | null) => void;
  setAIConsent: (consent: boolean) => void;
  compareWithJobApplication: (jobKeywords: string[]) => Promise<{
    matchedKeywords: ResumeKeywordMatch[];
    missingKeywords: string[];
    matchPercentage: number;
  }>;
  reset: () => void;
}

// Lazy initialization to support testing
let resumeParser: ResumeParser | null = null;
let resumeAI: ResumeAIService | null = null;

const getResumeParser = () => {
  if (!resumeParser) {
    resumeParser = new ResumeParser();
  }
  return resumeParser;
};

const getResumeAI = () => {
  if (!resumeAI) {
    resumeAI = new ResumeAIService(openAIService);
  }
  return resumeAI;
};

// For testing purposes only
export const __resetServices = () => {
  resumeParser = null;
  resumeAI = null;
};

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      resumes: [],
      currentResume: null,
      analyses: {},
      currentAnalysis: null,
      rewriteSuggestions: null,
      uploadProgress: null,
      isLoading: false,
      error: null,
      hasAIConsent: false,

      // Upload resume
      uploadResume: async () => {
        set({ isLoading: true, error: null, uploadProgress: null });

        try {
          // Stage 1: Pick document
          set({ uploadProgress: { stage: 'uploading', progress: 10, message: 'Selecting document...' } });
          const pickerResult = await getResumeParser().pickDocument();

          if (pickerResult.canceled) {
            set({ isLoading: false, uploadProgress: null });
            return;
          }

          // Stage 2: Validate
          set({ uploadProgress: { stage: 'uploading', progress: 25, message: 'Validating file...' } });
          const asset = pickerResult.assets[0];
          const validation = getResumeParser().validateFile(asset.name, asset.size || 0);
          
          if (!validation.isValid) {
            throw new Error(validation.error);
          }

          // Stage 3: Parse document
          set({ uploadProgress: { stage: 'parsing', progress: 50, message: 'Parsing document...' } });
          const parsed = await getResumeParser().parseDocument(asset.uri, asset.name);

          // Stage 4: Extract keywords
          set({ uploadProgress: { stage: 'analyzing', progress: 75, message: 'Extracting keywords...' } });
          const keywords = getResumeParser().extractKeywords(parsed.parsedText);

          // Stage 5: Save to storage
          set({ uploadProgress: { stage: 'analyzing', progress: 90, message: 'Saving resume...' } });
          const resume: Resume = {
            id: '',
            userId: '',
            fileName: asset.name,
            fileType: parsed.fileType as any,
            content: parsed.content,
            parsedText: parsed.parsedText,
            extractedKeywords: keywords,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastModified: new Date()
          };

          const savedResume = await getResumeParser().saveToLocalStorage(resume);

          // Stage 6: Complete
          set({ 
            uploadProgress: { stage: 'complete', progress: 100, message: 'Resume uploaded successfully' },
            currentResume: savedResume,
            resumes: [...get().resumes, savedResume],
            isLoading: false,
            error: null
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          set({ 
            isLoading: false, 
            error: errorMessage,
            uploadProgress: { stage: 'error', progress: 0, message: errorMessage }
          });
        }
      },

      // Analyze resume
      analyzeResume: async (jobDescription?: string) => {
        const { currentResume } = get();
        
        if (!currentResume) {
          set({ error: 'No resume selected for analysis' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          getResumeAI().setUserConsent(get().hasAIConsent);
          const analysis = await getResumeAI().analyzeResume(currentResume, jobDescription);
          
          set({
            currentAnalysis: analysis,
            analyses: { ...get().analyses, [currentResume.id]: analysis },
            isLoading: false,
            error: null
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          set({ isLoading: false, error: errorMessage });
        }
      },

      // Generate rewrite suggestions
      generateRewriteSuggestions: async (request: ResumeRewriteRequest) => {
        const { currentResume, hasAIConsent } = get();
        
        if (!currentResume) {
          set({ error: 'No resume selected' });
          return;
        }

        if (!hasAIConsent) {
          set({ error: 'AI consent required for resume rewriting' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          getResumeAI().setUserConsent(hasAIConsent);
          const suggestions = await getResumeAI().generateRewriteSuggestions(request, currentResume);
          
          set({
            rewriteSuggestions: suggestions,
            isLoading: false,
            error: null
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          set({ isLoading: false, error: errorMessage });
        }
      },

      // Delete resume
      deleteResume: async (resumeId: string) => {
        set({ isLoading: true, error: null });

        try {
          // Remove from state
          const updatedResumes = get().resumes.filter(r => r.id !== resumeId);
          const { currentResume, analyses } = get();
          
          // Clear current if it's the deleted resume
          const newCurrentResume = currentResume?.id === resumeId ? null : currentResume;
          
          // Remove analysis
          const newAnalyses = { ...analyses };
          delete newAnalyses[resumeId];

          set({
            resumes: updatedResumes,
            currentResume: newCurrentResume,
            currentAnalysis: newCurrentResume ? analyses[newCurrentResume.id] || null : null,
            analyses: newAnalyses,
            isLoading: false,
            error: null
          });

          // Remove from storage
          await AsyncStorage.removeItem(`@next_chapter/resume_${resumeId}`);
          
          // Update resume list
          const resumeListKey = '@next_chapter/resume_list';
          const existingList = await AsyncStorage.getItem(resumeListKey);
          if (existingList) {
            const resumeIds = JSON.parse(existingList).filter((id: string) => id !== resumeId);
            await AsyncStorage.setItem(resumeListKey, JSON.stringify(resumeIds));
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          set({ isLoading: false, error: errorMessage });
        }
      },

      // Set current resume
      setCurrentResume: (resume: Resume | null) => {
        set({ 
          currentResume: resume,
          currentAnalysis: resume ? get().analyses[resume.id] || null : null,
          error: null
        });
      },

      // Set AI consent
      setAIConsent: (consent: boolean) => {
        set({ hasAIConsent: consent });
        getResumeAI().setUserConsent(consent);
      },

      // Compare with job application
      compareWithJobApplication: async (jobKeywords: string[]) => {
        const { currentResume } = get();
        
        if (!currentResume) {
          throw new Error('No resume selected');
        }

        return getResumeAI().compareWithJobApplication(currentResume, jobKeywords);
      },

      // Reset store
      reset: () => {
        set({
          resumes: [],
          currentResume: null,
          analyses: {},
          currentAnalysis: null,
          rewriteSuggestions: null,
          uploadProgress: null,
          isLoading: false,
          error: null,
          hasAIConsent: false
        });
      }
    }),
    {
      name: '@next_chapter/resume_store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        resumes: state.resumes,
        currentResume: state.currentResume,
        analyses: state.analyses,
        hasAIConsent: state.hasAIConsent
      })
    }
  )
);