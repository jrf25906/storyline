/**
 * Recording Service
 * Manages recording storage in Firebase
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from '../firebase/config';
import { authService } from '../auth/authService';

export interface Recording {
  id: string;
  userId: string;
  uri?: string; // Local URI before upload
  audioUrl?: string; // Firebase Storage URL
  duration: number;
  timestamp: Date;
  transcription?: string;
  sentiment?: {
    text: string;
    confidence: number;
  };
  summary?: string;
  chapter?: string;
  scene?: string;
  tags?: string[];
  isProcessed: boolean;
}

class RecordingService {
  private readonly RECORDINGS_COLLECTION = 'recordings';
  private readonly AUDIO_STORAGE_PATH = 'recordings';

  /**
   * Save recording to Firebase
   */
  async saveRecording(recording: Omit<Recording, 'id' | 'userId'>): Promise<Recording | null> {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured, saving locally only');
      return null;
    }

    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Upload audio file if local URI exists
      let audioUrl = recording.audioUrl;
      if (recording.uri && !audioUrl) {
        audioUrl = await this.uploadAudioFile(recording.uri, user.uid);
      }

      // Create recording document
      const recordingId = doc(collection(db, this.RECORDINGS_COLLECTION)).id;
      const recordingData: Recording = {
        ...recording,
        id: recordingId,
        userId: user.uid,
        audioUrl,
        timestamp: recording.timestamp || new Date(),
        isProcessed: recording.isProcessed || false,
      };

      // Remove local URI before saving to Firestore
      delete recordingData.uri;

      // Save to Firestore
      await setDoc(
        doc(db, this.RECORDINGS_COLLECTION, recordingId), 
        {
          ...recordingData,
          timestamp: Timestamp.fromDate(recordingData.timestamp),
        }
      );

      return recordingData;
    } catch (error) {
      console.error('Error saving recording:', error);
      throw error;
    }
  }

  /**
   * Upload audio file to Firebase Storage
   */
  private async uploadAudioFile(localUri: string, userId: string): Promise<string> {
    try {
      // Fetch the audio file
      const response = await fetch(localUri);
      const blob = await response.blob();

      // Create storage reference
      const timestamp = Date.now();
      const fileName = `${userId}/${timestamp}.m4a`;
      const storageRef = ref(storage, `${this.AUDIO_STORAGE_PATH}/${fileName}`);

      // Upload file
      const snapshot = await uploadBytes(storageRef, blob);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading audio file:', error);
      throw error;
    }
  }

  /**
   * Get user's recordings
   */
  async getUserRecordings(
    userId?: string,
    limitCount: number = 50
  ): Promise<Recording[]> {
    if (!isFirebaseConfigured) {
      return [];
    }

    const user = authService.getCurrentUser();
    const targetUserId = userId || user?.uid;
    
    if (!targetUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const q = query(
        collection(db, this.RECORDINGS_COLLECTION),
        where('userId', '==', targetUserId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const recordings: Recording[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        recordings.push({
          ...data,
          id: doc.id,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as Recording);
      });

      return recordings;
    } catch (error) {
      console.error('Error fetching recordings:', error);
      return [];
    }
  }

  /**
   * Get single recording
   */
  async getRecording(recordingId: string): Promise<Recording | null> {
    if (!isFirebaseConfigured) {
      return null;
    }

    try {
      const docRef = doc(db, this.RECORDINGS_COLLECTION, recordingId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as Recording;
    } catch (error) {
      console.error('Error fetching recording:', error);
      return null;
    }
  }

  /**
   * Update recording
   */
  async updateRecording(
    recordingId: string, 
    updates: Partial<Recording>
  ): Promise<void> {
    if (!isFirebaseConfigured) {
      return;
    }

    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const docRef = doc(db, this.RECORDINGS_COLLECTION, recordingId);
      
      // Convert Date to Timestamp if updating timestamp
      const updateData = { ...updates };
      if (updateData.timestamp) {
        updateData.timestamp = Timestamp.fromDate(updateData.timestamp) as any;
      }

      await setDoc(docRef, updateData, { merge: true });
    } catch (error) {
      console.error('Error updating recording:', error);
      throw error;
    }
  }

  /**
   * Delete recording
   */
  async deleteRecording(recordingId: string): Promise<void> {
    if (!isFirebaseConfigured) {
      return;
    }

    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Get recording to find audio URL
      const recording = await this.getRecording(recordingId);
      
      if (recording && recording.userId !== user.uid) {
        throw new Error('Unauthorized to delete this recording');
      }

      // Delete audio file from storage if exists
      if (recording?.audioUrl) {
        try {
          const audioRef = ref(storage, recording.audioUrl);
          await deleteObject(audioRef);
        } catch (error) {
          console.error('Error deleting audio file:', error);
        }
      }

      // Delete Firestore document
      await deleteDoc(doc(db, this.RECORDINGS_COLLECTION, recordingId));
    } catch (error) {
      console.error('Error deleting recording:', error);
      throw error;
    }
  }

  /**
   * Get recordings by chapter
   */
  async getRecordingsByChapter(
    chapter: string,
    userId?: string
  ): Promise<Recording[]> {
    if (!isFirebaseConfigured) {
      return [];
    }

    const user = authService.getCurrentUser();
    const targetUserId = userId || user?.uid;
    
    if (!targetUserId) {
      throw new Error('User not authenticated');
    }

    try {
      const q = query(
        collection(db, this.RECORDINGS_COLLECTION),
        where('userId', '==', targetUserId),
        where('chapter', '==', chapter),
        orderBy('timestamp', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const recordings: Recording[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        recordings.push({
          ...data,
          id: doc.id,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as Recording);
      });

      return recordings;
    } catch (error) {
      console.error('Error fetching recordings by chapter:', error);
      return [];
    }
  }
}

// Export singleton instance
export const recordingService = new RecordingService();