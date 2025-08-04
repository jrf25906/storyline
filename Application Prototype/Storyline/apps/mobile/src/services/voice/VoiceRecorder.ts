/**
 * Voice Recording Service
 * Handles audio recording, playback, and real-time processing
 */

import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export type RecordingStatus = {
  canRecord: boolean;
  isRecording: boolean;
  isDoneRecording: boolean;
  durationMillis: number;
  metering?: number;
};

export type VoiceRecorderCallbacks = {
  onRecordingStatusUpdate?: (status: RecordingStatus) => void;
  onRecordingComplete?: (uri: string, duration: number) => void;
  onError?: (error: Error) => void;
  onMeteringUpdate?: (metering: number) => void;
};

class VoiceRecorderService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private callbacks: VoiceRecorderCallbacks = {};
  private meteringInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.setupAudioMode();
  }

  private async setupAudioMode() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Failed to setup audio mode:', error);
    }
  }

  public setCallbacks(callbacks: VoiceRecorderCallbacks) {
    this.callbacks = callbacks;
  }

  public async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      this.callbacks.onError?.(new Error('Failed to request permissions'));
      return false;
    }
  }

  public async startRecording(): Promise<void> {
    try {
      // Check permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission not granted');
      }

      // Stop any existing recording
      if (this.recording) {
        await this.stopRecording();
      }

      // Configure recording options for high quality
      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      };

      // Create and prepare recording
      const { recording } = await Audio.Recording.createAsync(
        recordingOptions,
        this.onRecordingStatusUpdate.bind(this),
        100 // Update interval in milliseconds
      );

      this.recording = recording;

      // Start metering updates for visualization
      this.startMeteringUpdates();

    } catch (error) {
      console.error('Failed to start recording:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  public async stopRecording(): Promise<{ uri: string; duration: number } | null> {
    try {
      if (!this.recording) {
        return null;
      }

      // Stop metering updates
      this.stopMeteringUpdates();

      // Stop and unload the recording
      await this.recording.stopAndUnloadAsync();
      
      // Get the recording URI
      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();
      
      if (!uri) {
        throw new Error('No recording URI available');
      }

      // Notify callback
      const duration = status.durationMillis || 0;
      this.callbacks.onRecordingComplete?.(uri, duration);

      // Clean up
      this.recording = null;

      return { uri, duration };
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.callbacks.onError?.(error as Error);
      return null;
    }
  }

  public async pauseRecording(): Promise<void> {
    try {
      if (this.recording) {
        await this.recording.pauseAsync();
      }
    } catch (error) {
      console.error('Failed to pause recording:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  public async resumeRecording(): Promise<void> {
    try {
      if (this.recording) {
        await this.recording.startAsync();
      }
    } catch (error) {
      console.error('Failed to resume recording:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  public async playRecording(uri: string): Promise<void> {
    try {
      // Stop any existing playback
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      // Load and play the sound
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      
      this.sound = sound;

      // Set up playback finished callback
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          this.stopPlayback();
        }
      });

    } catch (error) {
      console.error('Failed to play recording:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  public async stopPlayback(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
    } catch (error) {
      console.error('Failed to stop playback:', error);
    }
  }

  private onRecordingStatusUpdate(status: Audio.RecordingStatus) {
    const recordingStatus: RecordingStatus = {
      canRecord: status.canRecord,
      isRecording: status.isRecording,
      isDoneRecording: status.isDoneRecording,
      durationMillis: status.durationMillis,
      metering: status.metering,
    };
    
    this.callbacks.onRecordingStatusUpdate?.(recordingStatus);
    
    // Update metering for visualization
    if (status.metering !== undefined) {
      this.callbacks.onMeteringUpdate?.(status.metering);
    }
  }

  private startMeteringUpdates() {
    if (Platform.OS === 'ios') {
      // iOS provides metering through status updates
      return;
    }

    // For Android, we might need to implement custom metering
    this.meteringInterval = setInterval(async () => {
      if (this.recording) {
        try {
          const status = await this.recording.getStatusAsync();
          if (status.metering !== undefined) {
            this.callbacks.onMeteringUpdate?.(status.metering);
          }
        } catch (error) {
          console.error('Metering update error:', error);
        }
      }
    }, 100);
  }

  private stopMeteringUpdates() {
    if (this.meteringInterval) {
      clearInterval(this.meteringInterval);
      this.meteringInterval = null;
    }
  }

  public isRecording(): boolean {
    return this.recording !== null;
  }

  public async getRecordingStatus(): Promise<RecordingStatus | null> {
    if (!this.recording) {
      return null;
    }

    try {
      const status = await this.recording.getStatusAsync();
      return {
        canRecord: status.canRecord,
        isRecording: status.isRecording,
        isDoneRecording: status.isDoneRecording,
        durationMillis: status.durationMillis,
        metering: status.metering,
      };
    } catch (error) {
      console.error('Failed to get recording status:', error);
      return null;
    }
  }

  public cleanup() {
    this.stopMeteringUpdates();
    if (this.recording) {
      this.recording.stopAndUnloadAsync().catch(console.error);
    }
    if (this.sound) {
      this.sound.unloadAsync().catch(console.error);
    }
  }
}

// Export singleton instance
export const voiceRecorder = new VoiceRecorderService();