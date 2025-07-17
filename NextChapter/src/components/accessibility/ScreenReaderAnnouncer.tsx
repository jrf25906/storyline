import React, { useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import { useAccessibilityAnnounce } from '../../utils/focusManager';

interface AnnouncementQueueItem {
  message: string;
  priority: 'low' | 'medium' | 'high';
  delay?: number;
}

interface ScreenReaderContextType {
  announce: (message: string, priority?: 'low' | 'medium' | 'high', delay?: number) => void;
  announceStateChange: (component: string, newState: string) => void;
  announceProgress: (current: number, total: number, context?: string) => void;
  announceError: (error: string) => void;
  announceSuccess: (message: string) => void;
}

const ScreenReaderContext = createContext<ScreenReaderContextType | undefined>(undefined);

interface ScreenReaderProviderProps {
  children: ReactNode;
}

/**
 * Provider for centralized screen reader announcements
 */
export function ScreenReaderProvider({ children }: ScreenReaderProviderProps) {
  const { announce, announceError, announceSuccess, announceProgress } = useAccessibilityAnnounce();
  const announcementQueue = useRef<AnnouncementQueueItem[]>([]);
  const isProcessing = useRef(false);

  const processQueue = async () => {
    if (isProcessing.current || announcementQueue.current.length === 0) {
      return;
    }

    isProcessing.current = true;

    // Sort by priority
    announcementQueue.current.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    const item = announcementQueue.current.shift();
    if (item) {
      announce(item.message, item.delay || 0);
      
      // Wait before processing next item
      setTimeout(() => {
        isProcessing.current = false;
        processQueue();
      }, 500);
    }
  };

  const queueAnnouncement = (
    message: string, 
    priority: 'low' | 'medium' | 'high' = 'medium',
    delay?: number
  ) => {
    announcementQueue.current.push({ message, priority, delay });
    processQueue();
  };

  const announceStateChange = (component: string, newState: string) => {
    queueAnnouncement(`${component} ${newState}`, 'medium');
  };

  const contextValue: ScreenReaderContextType = {
    announce: queueAnnouncement,
    announceStateChange,
    announceProgress,
    announceError: (error) => {
      queueAnnouncement(error, 'high');
      announceError(error);
    },
    announceSuccess: (message) => {
      queueAnnouncement(message, 'high');
      announceSuccess(message);
    },
  };

  return (
    <ScreenReaderContext.Provider value={contextValue}>
      {children}
      <ScreenReaderLiveRegion />
    </ScreenReaderContext.Provider>
  );
}

export function useScreenReader() {
  const context = useContext(ScreenReaderContext);
  if (!context) {
    throw new Error('useScreenReader must be used within ScreenReaderProvider');
  }
  return context;
}

/**
 * Live region for dynamic announcements
 */
function ScreenReaderLiveRegion() {
  const [announcement, setAnnouncement] = React.useState('');
  
  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener(
      'announcementFinished',
      () => {
        // Clear announcement after it's been read
        setAnnouncement('');
      }
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <View 
      style={styles.liveRegion}
      accessibilityLiveRegion="polite"
      accessibilityElementsHidden={false}
      importantForAccessibility="yes"
    >
      <Text>{announcement}</Text>
    </View>
  );
}

/**
 * Hook for announcing loading states
 */
export function useLoadingAnnouncement(isLoading: boolean, context: string) {
  const { announceStateChange } = useScreenReader();
  const previousLoading = useRef(isLoading);

  useEffect(() => {
    if (isLoading !== previousLoading.current) {
      if (isLoading) {
        announceStateChange(context, 'loading');
      } else {
        announceStateChange(context, 'loaded');
      }
      previousLoading.current = isLoading;
    }
  }, [isLoading, context, announceStateChange]);
}

/**
 * Hook for announcing value changes
 */
export function useValueChangeAnnouncement<T>(
  value: T,
  formatter: (value: T) => string,
  context: string
) {
  const { announce } = useScreenReader();
  const previousValue = useRef(value);

  useEffect(() => {
    if (value !== previousValue.current) {
      const message = `${context} changed to ${formatter(value)}`;
      announce(message, 'low', 100);
      previousValue.current = value;
    }
  }, [value, formatter, context, announce]);
}

/**
 * Component for announcing task completion
 */
interface TaskCompletionAnnouncerProps {
  taskName: string;
  isCompleted: boolean;
}

export function TaskCompletionAnnouncer({ 
  taskName, 
  isCompleted 
}: TaskCompletionAnnouncerProps) {
  const { announceSuccess } = useScreenReader();
  const wasCompleted = useRef(isCompleted);

  useEffect(() => {
    if (isCompleted && !wasCompleted.current) {
      announceSuccess(`Task "${taskName}" completed successfully`);
    }
    wasCompleted.current = isCompleted;
  }, [isCompleted, taskName, announceSuccess]);

  return null;
}

/**
 * Component for announcing navigation changes
 */
interface NavigationAnnouncerProps {
  screenName: string;
  screenType?: 'screen' | 'modal' | 'sheet';
}

export function NavigationAnnouncer({ 
  screenName, 
  screenType = 'screen' 
}: NavigationAnnouncerProps) {
  const { announce } = useScreenReader();

  useEffect(() => {
    const message = screenType === 'screen' 
      ? `Navigated to ${screenName}`
      : `${screenName} ${screenType} opened`;
    
    announce(message, 'high', 100);
  }, [screenName, screenType, announce]);

  return null;
}

const styles = StyleSheet.create({
  liveRegion: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
});