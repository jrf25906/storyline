import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ALLOWED_FILE_EXTENSIONS, 
  MAX_FILE_SIZE,
  Resume,
  AllowedFileTypes 
} from '@types/resume';
import { getErrorMessage } from '@utils/typeGuards';

// Common technical keywords patterns
const TECHNICAL_PATTERNS = [
  // Programming languages
  /\b(javascript|typescript|python|java|csharp|c\+\+|ruby|go|swift|kotlin|php|rust|scala)\b/gi,
  // Frontend frameworks
  /\b(react|angular|vue|svelte|next\.js|nuxt|gatsby|ember)\b/gi,
  // Backend frameworks
  /\b(node\.js|express|django|flask|spring|rails|laravel|asp\.net)\b/gi,
  // Databases
  /\b(mysql|postgresql|mongodb|redis|dynamodb|firebase|cassandra|elasticsearch)\b/gi,
  // Cloud services
  /\b(aws|azure|gcp|google cloud|heroku|netlify|vercel)\b/gi,
  // DevOps tools
  /\b(docker|kubernetes|jenkins|github actions|gitlab ci|terraform|ansible)\b/gi,
  // Other technologies
  /\b(git|rest api|graphql|microservices|serverless|ci\/cd|agile|scrum)\b/gi,
  // Multi-word technical terms
  /\b(machine learning|artificial intelligence|data science|natural language processing|computer vision|deep learning|neural networks)\b/gi,
  // Skills
  /\b(project management|team leadership|communication|problem solving|analytical thinking)\b/gi
];

// Stop words to filter out
const STOP_WORDS = new Set([
  'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'between', 'under', 'again', 'further',
  'then', 'once', 'a', 'an', 'as', 'is', 'it', 'its', 'this', 'that',
  'these', 'those', 'am', 'are', 'was', 'were', 'been', 'be', 'have',
  'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'must', 'can', 'need', 'i', 'you', 'he', 'she', 'we',
  'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'whose',
  'where', 'when', 'why', 'how', 'all', 'both', 'each', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'just'
]);

const ENCRYPTION_KEY = process.env.RESUME_ENCRYPTION_KEY || 'next-chapter-resume-key';

export class ResumeParser {
  async pickDocument(): Promise<DocumentPicker.DocumentPickerResult> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ],
        copyToCacheDirectory: true
      });
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  validateFile(fileName: string, fileSize: number): { isValid: boolean; error?: string } {
    // Check file extension
    const extension = this.getFileExtension(fileName);
    if (!ALLOWED_FILE_EXTENSIONS.includes(extension as AllowedFileTypes)) {
      return { 
        isValid: false, 
        error: `Unsupported file type. Please upload ${ALLOWED_FILE_EXTENSIONS.join(', ')} files.` 
      };
    }

    // Check file size
    if (fileSize > MAX_FILE_SIZE) {
      return { 
        isValid: false, 
        error: 'File size exceeds 5MB limit. Please upload a smaller file.' 
      };
    }

    return { isValid: true };
  }

  async parseDocument(uri: string, fileName: string): Promise<{
    content: string;
    parsedText: string;
    fileType: string;
  }> {
    try {
      const fileType = this.getFileExtension(fileName);
      let content: string;
      let parsedText: string;

      if (fileType === '.txt') {
        // Read text files as UTF8
        content = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType?.UTF8 || 'utf8'
        });
        parsedText = content;
      } else {
        // Read other files as Base64
        content = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType?.Base64 || 'base64'
        });
        
        // For PDF and DOCX, we'll need a proper parser in production
        // For now, we'll simulate parsing by returning placeholder text
        parsedText = await this.extractTextFromBinary(content, fileType);
      }

      // Sanitize the parsed text
      parsedText = this.sanitizeText(parsedText);

      return { content, parsedText, fileType };
    } catch (error) {
      throw new Error(`Failed to parse document: ${getErrorMessage(error)}`);
    }
  }

  extractKeywords(text: string): string[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const keywords = new Set<string>();
    const lowerText = text.toLowerCase();

    // First, extract multi-word technical terms before extracting single words
    const multiWordPatterns = [
      /\bsoftware engineer(?:ing)?\b/gi,
      /\breact native\b/gi,
      /\bnode\.js\b/gi,
      /\bmachine learning\b/gi,
      /\bartificial intelligence\b/gi,
      /\bdata science\b/gi,
      /\bnatural language processing\b/gi,
      /\bproject management\b/gi,
      /\bteam lead(?:ership)?\b/gi,
      /\bfull stack\b/gi,
      /\bfront end\b/gi,
      /\bback end\b/gi,
      /\bsenior (?:software )?(?:developer|engineer)\b/gi,
      /\bcloud computing\b/gi,
      /\bagile methodology\b/gi
    ];

    // Extract multi-word terms first
    multiWordPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        keywords.add(match.toLowerCase());
      });
    });

    // Extract technical keywords using patterns
    TECHNICAL_PATTERNS.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        const lowerMatch = match.toLowerCase();
        // Don't add if it's already part of a multi-word term
        let isPartOfMultiWord = false;
        keywords.forEach(kw => {
          if (kw.includes(lowerMatch) && kw !== lowerMatch) {
            isPartOfMultiWord = true;
          }
        });
        if (!isPartOfMultiWord) {
          keywords.add(lowerMatch);
        }
      });
    });

    // Extract other potential keywords (2-3 word phrases)
    const words = lowerText.split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
      const word = words[i];
      const twoWord = `${words[i]} ${words[i + 1]}`;
      
      // Two-word phrases for common patterns
      if (this.isValidKeywordPhrase(twoWord)) {
        keywords.add(twoWord);
      }
      
      // Three-word phrases
      if (i < words.length - 2) {
        const threeWord = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        if (this.isValidKeywordPhrase(threeWord)) {
          keywords.add(threeWord);
        }
      }
    }

    // Convert to array and remove duplicates
    return Array.from(keywords).sort();
  }

  async saveToLocalStorage(resume: Resume): Promise<Resume> {
    try {
      // Generate ID if not provided
      const savedResume: Resume = {
        ...resume,
        id: resume.id || `resume-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: resume.userId || 'user-default',
        createdAt: resume.createdAt || new Date(),
        updatedAt: resume.updatedAt || new Date(),
        lastModified: resume.lastModified || new Date()
      };

      // Encrypt sensitive content
      const encryptedData = await this.encryptData(savedResume);
      
      // Save to AsyncStorage
      const key = `@next_chapter/resume_${savedResume.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(encryptedData));

      // Update resume list
      const resumeListKey = '@next_chapter/resume_list';
      const existingList = await AsyncStorage.getItem(resumeListKey);
      const resumeIds = existingList ? JSON.parse(existingList) : [];
      if (!resumeIds.includes(savedResume.id)) {
        resumeIds.push(savedResume.id);
        await AsyncStorage.setItem(resumeListKey, JSON.stringify(resumeIds));
      }

      return savedResume;
    } catch (error) {
      throw new Error(`Failed to save resume: ${getErrorMessage(error)}`);
    }
  }

  async loadFromLocalStorage(resumeId: string): Promise<Resume | null> {
    try {
      const key = `@next_chapter/resume_${resumeId}`;
      const encryptedData = await AsyncStorage.getItem(key);
      
      if (!encryptedData) {
        return null;
      }

      const resume = await this.decryptData(JSON.parse(encryptedData));
      return resume;
    } catch (error) {
      console.error('Failed to load resume:', error);
      return null;
    }
  }

  // Private helper methods
  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > -1 ? fileName.substring(lastDot).toLowerCase() : '';
  }

  private sanitizeText(text: string): string {
    // Remove extra whitespace and normalize line breaks
    return text
      .split('\n')  // Split by line
      .map(line => line.replace(/\s+/g, ' ').trim())  // Clean each line
      .filter(line => line.length > 0)  // Remove empty lines
      .join('\n');  // Join back with single newlines
  }

  private async extractTextFromBinary(base64Content: string, fileType: string): Promise<string> {
    // In a real implementation, we would use libraries like pdf.js or mammoth.js
    // For testing, we'll return simulated parsed text
    
    // This is a placeholder - in production, implement proper PDF/DOCX parsing
    return `Parsed content from ${fileType} file`;
  }

  private isValidKeywordPhrase(phrase: string): boolean {
    const words = phrase.split(' ');
    
    // Check if any word is a stop word
    if (words.some(w => STOP_WORDS.has(w))) {
      return false;
    }
    
    // Check for common multi-word terms
    const multiWordTerms = [
      'machine learning', 'artificial intelligence', 'data science',
      'natural language processing', 'computer vision', 'deep learning',
      'neural networks', 'project management', 'team leadership',
      'react native', 'vue js', 'node js', 'software engineer', 'software engineering',
      'senior software', 'full stack', 'front end', 'back end', 'team lead'
    ];
    
    return multiWordTerms.includes(phrase.toLowerCase());
  }

  private async encryptData(data: Resume): Promise<any> {
    try {
      // Encrypt sensitive fields
      const encrypted = {
        ...data,
        content: (CryptoJS as any).AES.encrypt(data.content, ENCRYPTION_KEY).toString(),
        parsedText: (CryptoJS as any).AES.encrypt(data.parsedText, ENCRYPTION_KEY).toString()
      };
      return encrypted;
    } catch (error) {
      throw error;
    }
  }

  private async decryptData(encryptedData: any): Promise<Resume | null> {
    try {
      if (!encryptedData) return null;
      
      // Decrypt sensitive fields
      const decrypted = {
        ...encryptedData,
        content: (CryptoJS as any).AES.decrypt(encryptedData.content, ENCRYPTION_KEY).toString((CryptoJS as any).enc.Utf8),
        parsedText: (CryptoJS as any).AES.decrypt(encryptedData.parsedText, ENCRYPTION_KEY).toString((CryptoJS as any).enc.Utf8),
        createdAt: new Date(encryptedData.createdAt),
        updatedAt: new Date(encryptedData.updatedAt),
        lastModified: new Date(encryptedData.lastModified)
      };
      return decrypted;
    } catch (error) {
      throw error;
    }
  }
}