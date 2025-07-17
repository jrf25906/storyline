import { useRef, useCallback, useEffect } from 'react';
import { 
  AccessibilityInfo,
  findNodeHandle,
  Platform,
  View,
  TextInput,
} from 'react-native';

/**
 * Enhanced focus management for accessibility
 * Provides utilities for managing focus, announcing changes, and keyboard navigation
 */

/**
 * Hook to manage focus on mount
 */
export function useFocusOnMount(shouldFocus = true, delay = 100) {
  const ref = useRef<View>(null);

  useEffect(() => {
    if (!shouldFocus) return;

    const timer = setTimeout(() => {
      if (ref.current) {
        const handle = findNodeHandle(ref.current);
        if (handle) {
          AccessibilityInfo.setAccessibilityFocus(handle);
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [shouldFocus, delay]);

  return ref;
}

/**
 * Hook to manage focus between elements
 */
export function useFocusManager() {
  const focusTargets = useRef<Map<string, View | TextInput>>(new Map());

  const registerFocusTarget = useCallback((key: string, element: View | TextInput | null) => {
    if (element) {
      focusTargets.current.set(key, element);
    } else {
      focusTargets.current.delete(key);
    }
  }, []);

  const focusOn = useCallback((key: string) => {
    const element = focusTargets.current.get(key);
    if (element) {
      const handle = findNodeHandle(element);
      if (handle) {
        if ('focus' in element && typeof element.focus === 'function') {
          element.focus();
        } else {
          AccessibilityInfo.setAccessibilityFocus(handle);
        }
      }
    }
  }, []);

  const focusNext = useCallback((currentKey: string) => {
    const keys = Array.from(focusTargets.current.keys());
    const currentIndex = keys.indexOf(currentKey);
    if (currentIndex !== -1 && currentIndex < keys.length - 1) {
      focusOn(keys[currentIndex + 1]);
    }
  }, [focusOn]);

  const focusPrevious = useCallback((currentKey: string) => {
    const keys = Array.from(focusTargets.current.keys());
    const currentIndex = keys.indexOf(currentKey);
    if (currentIndex > 0) {
      focusOn(keys[currentIndex - 1]);
    }
  }, [focusOn]);

  return {
    registerFocusTarget,
    focusOn,
    focusNext,
    focusPrevious,
  };
}

/**
 * Hook to announce screen reader messages
 */
export function useAccessibilityAnnounce() {
  const announce = useCallback((message: string, delay = 0) => {
    if (delay > 0) {
      setTimeout(() => {
        AccessibilityInfo.announceForAccessibility(message);
      }, delay);
    } else {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, []);

  const announceError = useCallback((error: string) => {
    announce(`Error: ${error}`);
  }, [announce]);

  const announceSuccess = useCallback((message: string) => {
    announce(`Success: ${message}`);
  }, [announce]);

  const announceProgress = useCallback((current: number, total: number, context?: string) => {
    const message = context 
      ? `${context}: ${current} of ${total}`
      : `Progress: ${current} of ${total}`;
    announce(message);
  }, [announce]);

  return {
    announce,
    announceError,
    announceSuccess,
    announceProgress,
  };
}

/**
 * Hook for focus trap (keeping focus within a modal/dialog)
 */
export function useFocusTrap(isActive = true) {
  const firstElementRef = useRef<View>(null);
  const lastElementRef = useRef<View>(null);
  const containerRef = useRef<View>(null);

  useEffect(() => {
    if (!isActive || Platform.OS !== 'ios') return;

    // Focus first element when trap activates
    const timer = setTimeout(() => {
      if (firstElementRef.current) {
        const handle = findNodeHandle(firstElementRef.current);
        if (handle) {
          AccessibilityInfo.setAccessibilityFocus(handle);
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isActive]);

  const handleKeyDown = useCallback((event: any) => {
    if (!isActive || event.key !== 'Tab') return;

    const isShift = event.shiftKey;
    const activeElement = event.target;

    if (isShift && activeElement === firstElementRef.current) {
      event.preventDefault();
      lastElementRef.current?.focus();
    } else if (!isShift && activeElement === lastElementRef.current) {
      event.preventDefault();
      firstElementRef.current?.focus();
    }
  }, [isActive]);

  return {
    containerRef,
    firstElementRef,
    lastElementRef,
    handleKeyDown,
  };
}

/**
 * Utility to check if screen reader is enabled
 */
export async function isScreenReaderEnabled(): Promise<boolean> {
  try {
    return await AccessibilityInfo.isScreenReaderEnabled();
  } catch {
    return false;
  }
}

/**
 * Utility to get preferred content size category
 */
export async function getPreferredContentSize(): Promise<string | null> {
  if (Platform.OS === 'ios') {
    try {
      // @ts-ignore - This method exists on iOS
      return await AccessibilityInfo.preferredContentSizeCategory?.();
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Focus state manager for forms
 */
export class FormFocusManager {
  private fields: Map<string, View | TextInput> = new Map();
  private order: string[] = [];

  register(fieldName: string, element: View | TextInput | null) {
    if (element) {
      this.fields.set(fieldName, element);
      if (!this.order.includes(fieldName)) {
        this.order.push(fieldName);
      }
    } else {
      this.fields.delete(fieldName);
      this.order = this.order.filter(name => name !== fieldName);
    }
  }

  focusField(fieldName: string) {
    const field = this.fields.get(fieldName);
    if (field && 'focus' in field) {
      field.focus();
    }
  }

  focusFirstError(errors: Record<string, any>) {
    for (const fieldName of this.order) {
      if (errors[fieldName]) {
        this.focusField(fieldName);
        const errorMessage = typeof errors[fieldName] === 'string' 
          ? errors[fieldName] 
          : 'This field has an error';
        AccessibilityInfo.announceForAccessibility(errorMessage);
        break;
      }
    }
  }

  focusNext(currentFieldName: string) {
    const currentIndex = this.order.indexOf(currentFieldName);
    if (currentIndex !== -1 && currentIndex < this.order.length - 1) {
      this.focusField(this.order[currentIndex + 1]);
    }
  }

  clear() {
    this.fields.clear();
    this.order = [];
  }
}