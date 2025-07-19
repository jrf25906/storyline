import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing } from '@theme';
import { useFocusOnMount } from '@utils/focusManager';

interface SkipLink {
  id: string;
  label: string;
  targetRef: React.RefObject<ScrollView | View>;
}

interface SkipLinksProps {
  links: SkipLink[];
  visible?: boolean;
}

/**
 * Skip links for keyboard and screen reader navigation
 * Allows users to skip repetitive content
 */
export function SkipLinks({ links, visible = false }: SkipLinksProps) {
  const [isVisible, setIsVisible] = useState(visible);
  const skipLinksRef = useFocusOnMount(isVisible);

  const handleSkipTo = (targetRef: React.RefObject<ScrollView | View>) => {
    if (targetRef.current) {
      if ('scrollTo' in targetRef.current) {
        // It's a ScrollView
        targetRef.current.scrollTo({ y: 0, animated: true });
      }
      // Set focus to the target
      targetRef.current.focus?.();
    }
    setIsVisible(false);
  };

  const handleFocus = () => {
    setIsVisible(true);
  };

  const handleBlur = () => {
    if (!visible) {
      setIsVisible(false);
    }
  };

  return (
    <View
      ref={skipLinksRef}
      style={[styles.container, !isVisible && styles.hidden]}
      accessibilityRole="navigation"
      accessibilityLabel="Skip navigation"
    >
      {links.map((link) => (
        <TouchableOpacity
          key={link.id}
          style={styles.link}
          onPress={() => handleSkipTo(link.targetRef)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityRole="link"
          accessibilityLabel={`Skip to ${link.label}`}
        >
          <Text style={styles.linkText}>{link.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

interface MainContentWrapperProps {
  children: React.ReactNode;
  skipLinks?: Array<{
    id: string;
    label: string;
  }>;
}

/**
 * Wrapper component that provides skip links for main content areas
 */
export function MainContentWrapper({ children, skipLinks = [] }: MainContentWrapperProps) {
  // Create refs for each content section
  const contentRefs = useRef<Map<string, React.RefObject<View>>>(new Map());

  // Initialize refs for skip links
  skipLinks.forEach((link) => {
    if (!contentRefs.current.has(link.id)) {
      contentRefs.current.set(link.id, React.createRef<View>());
    }
  });

  const skipLinkData: SkipLink[] = skipLinks.map((link) => ({
    ...link,
    targetRef: contentRefs.current.get(link.id)!,
  }));

  // Clone children and add refs
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.props.skipLinkId) {
      const ref = contentRefs.current.get(child.props.skipLinkId);
      if (ref) {
        return React.cloneElement(child as any, { ref });
      }
    }
    return child;
  });

  return (
    <View style={styles.wrapper}>
      <SkipLinks links={skipLinkData} />
      {enhancedChildren}
    </View>
  );
}

/**
 * Landmark component for semantic sections
 */
interface LandmarkProps {
  children: React.ReactNode;
  type: 'main' | 'navigation' | 'complementary' | 'contentinfo';
  label: string;
  skipLinkId?: string;
}

export const Landmark = React.forwardRef<View, LandmarkProps>(
  ({ children, type, label, skipLinkId }, ref) => {
    const accessibilityRole = Platform.select({
      ios: undefined, // iOS doesn't support these roles
      default: type as any,
    });

    return (
      <View
        ref={ref}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={label}
        accessible={true}
        style={styles.landmark}
      >
        {children}
      </View>
    );
  }
);

Landmark.displayName = 'Landmark';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.primary,
    zIndex: 1000,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.sm,
    ...Platform.select({
      ios: {
        paddingTop: 50, // Account for status bar
      },
      android: {
        paddingTop: 30,
      },
    }),
  },
  hidden: {
    transform: [{ translateY: -200 }],
  },
  link: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: 4,
  },
  linkText: {
    fontSize: Typography.fontSizes.body,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.primary,
  },
  wrapper: {
    flex: 1,
  },
  landmark: {
    flex: 1,
  },
});