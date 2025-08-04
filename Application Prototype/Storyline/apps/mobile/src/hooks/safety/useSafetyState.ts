/**
 * useSafetyState Hook
 * 
 * Manages emotional safety state and crisis detection for the Storyline app.
 * Provides trauma-informed state management with built-in crisis intervention.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { SafetyState, CrisisLevel, EmotionalSupportAction } from '../../components/Safety';

export interface SafetyStateConfig {
  /** Enable automatic crisis detection */
  enableCrisisDetection?: boolean;
  
  /** Threshold for automatic safety state changes */
  sensitivityLevel?: 'low' | 'medium' | 'high';
  
  /** Callback for crisis detection events */
  onCrisisDetected?: (level: CrisisLevel, context?: string) => void;
  
  /** Callback for emotional support requests */
  onSupportRequested?: (action: EmotionalSupportAction) => void;
}

export interface SafetyStateReturn {
  /** Current safety state */
  safetyState: SafetyState;
  
  /** Current crisis level */
  crisisLevel: CrisisLevel;
  
  /** Whether safe space mode is active */
  isSafeSpaceActive: boolean;
  
  /** Whether the user has requested a break */
  isBreakRequested: boolean;
  
  /** Update safety state manually */
  setSafetyState: (state: SafetyState) => void;
  
  /** Update crisis level manually */
  setCrisisLevel: (level: CrisisLevel) => void;
  
  /** Toggle safe space mode */
  toggleSafeSpace: () => void;
  
  /** Request emotional support */
  requestSupport: (action: EmotionalSupportAction) => void;
  
  /** Analyze text for crisis keywords (basic implementation) */
  analyzeContent: (content: string) => void;
  
  /** Reset all safety states */
  resetSafetyState: () => void;
  
  /** Set break status */
  setBreakRequested: (requested: boolean) => void;
}

// Basic crisis keywords for detection
const CRISIS_KEYWORDS = {
  high: [
    'suicide', 'kill myself', 'end it all', 'no point living',
    'better off dead', 'want to die', 'hurt myself'
  ],
  medium: [
    'hopeless', 'worthless', 'can\'t go on', 'giving up',
    'nothing matters', 'empty inside', 'broken'
  ],
  low: [
    'overwhelmed', 'stressed', 'anxious', 'sad',
    'worried', 'concerned', 'upset', 'frustrated'
  ]
};

export const useSafetyState = (config: SafetyStateConfig = {}): SafetyStateReturn => {
  const {
    enableCrisisDetection = true,
    sensitivityLevel = 'medium',
    onCrisisDetected,
    onSupportRequested,
  } = config;

  // State management
  const [safetyState, setSafetyStateInternal] = useState<SafetyState>('safe');
  const [crisisLevel, setCrisisLevelInternal] = useState<CrisisLevel>('none');
  const [isSafeSpaceActive, setIsSafeSpaceActive] = useState(true);
  const [isBreakRequested, setIsBreakRequested] = useState(false);

  // Refs for managing detection
  const lastCrisisDetection = useRef<number>(0);
  const crisisDetectionCooldown = 30000; // 30 seconds between detections

  // Basic content analysis for crisis detection
  const analyzeContent = useCallback((content: string) => {
    if (!enableCrisisDetection) return;

    const now = Date.now();
    if (now - lastCrisisDetection.current < crisisDetectionCooldown) {
      return; // Too soon since last detection
    }

    const lowerContent = content.toLowerCase();
    let detectedLevel: CrisisLevel = 'none';

    // Check for high-risk keywords first
    if (CRISIS_KEYWORDS.high.some(keyword => lowerContent.includes(keyword))) {
      detectedLevel = 'high';
    } else if (CRISIS_KEYWORDS.medium.some(keyword => lowerContent.includes(keyword))) {
      detectedLevel = 'medium';
    } else if (CRISIS_KEYWORDS.low.some(keyword => lowerContent.includes(keyword))) {
      detectedLevel = 'low';
    }

    // Apply sensitivity level filtering
    if (sensitivityLevel === 'low' && detectedLevel === 'low') {
      detectedLevel = 'none';
    } else if (sensitivityLevel === 'high' && detectedLevel === 'none') {
      // More sensitive detection for edge cases
      const concernWords = ['struggle', 'difficult', 'hard time', 'tough'];
      if (concernWords.some(word => lowerContent.includes(word))) {
        detectedLevel = 'low';
      }
    }

    if (detectedLevel !== 'none') {
      lastCrisisDetection.current = now;
      setCrisisLevelInternal(detectedLevel);
      
      // Update safety state based on crisis level
      if (detectedLevel === 'high') {
        setSafetyStateInternal('concern');
      } else if (detectedLevel === 'medium') {
        setSafetyStateInternal('caution');
      }

      onCrisisDetected?.(detectedLevel, content);
    }
  }, [enableCrisisDetection, sensitivityLevel, onCrisisDetected]);

  // Manual safety state setter with validation
  const setSafetyState = useCallback((state: SafetyState) => {
    setSafetyStateInternal(state);
    
    // Auto-adjust crisis level based on safety state
    if (state === 'safe' && crisisLevel !== 'none') {
      setCrisisLevelInternal('none');
    }
  }, [crisisLevel]);

  // Manual crisis level setter with validation
  const setCrisisLevel = useCallback((level: CrisisLevel) => {
    setCrisisLevelInternal(level);
    
    // Auto-adjust safety state based on crisis level
    if (level === 'high') {
      setSafetyStateInternal('concern');
    } else if (level === 'medium') {
      setSafetyStateInternal('caution');
    } else if (level === 'none') {
      setSafetyStateInternal('safe');
    }
  }, []);

  // Toggle safe space mode
  const toggleSafeSpace = useCallback(() => {
    setIsSafeSpaceActive(prev => !prev);
  }, []);

  // Request emotional support
  const requestSupport = useCallback((action: EmotionalSupportAction) => {
    onSupportRequested?.(action);
    
    // Handle specific actions
    switch (action) {
      case 'break':
        setIsBreakRequested(true);
        break;
      case 'pause':
        // Pause is temporary, don't set break status
        break;
      case 'emergency':
        // Escalate crisis level for emergency requests
        setCrisisLevelInternal('high');
        setSafetyStateInternal('concern');
        break;
    }
  }, [onSupportRequested]);

  // Reset all safety states
  const resetSafetyState = useCallback(() => {
    setSafetyStateInternal('safe');
    setCrisisLevelInternal('none');
    setIsSafeSpaceActive(true);
    setIsBreakRequested(false);
    lastCrisisDetection.current = 0;
  }, []);

  // Set break status
  const setBreakRequested = useCallback((requested: boolean) => {
    setIsBreakRequested(requested);
  }, []);

  // Auto-recovery for crisis states (after some time)
  useEffect(() => {
    if (crisisLevel !== 'none') {
      const recoveryTime = crisisLevel === 'high' ? 300000 : 120000; // 5 min for high, 2 min for others
      
      const timer = setTimeout(() => {
        if (crisisLevel === 'high') {
          setCrisisLevelInternal('medium');
          setSafetyStateInternal('caution');
        } else if (crisisLevel === 'medium') {
          setCrisisLevelInternal('low');
        } else {
          setCrisisLevelInternal('none');
          setSafetyStateInternal('safe');
        }
      }, recoveryTime);

      return () => clearTimeout(timer);
    }
  }, [crisisLevel]);

  return {
    safetyState,
    crisisLevel,
    isSafeSpaceActive,
    isBreakRequested,
    setSafetyState,
    setCrisisLevel,
    toggleSafeSpace,
    requestSupport,
    analyzeContent,
    resetSafetyState,
    setBreakRequested,
  };
};