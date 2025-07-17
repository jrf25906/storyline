import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getContrastRatio, meetsWCAGAA } from '../../utils/accessibility';

interface ChecklistItem {
  id: string;
  category: string;
  description: string;
  checked: boolean;
}

const initialChecklist: ChecklistItem[] = [
  // Touch Targets
  {
    id: 'touch-1',
    category: 'Touch Targets',
    description: 'All interactive elements are at least 48x48dp',
    checked: false,
  },
  {
    id: 'touch-2',
    category: 'Touch Targets',
    description: 'Touch targets have adequate spacing between them',
    checked: false,
  },
  // Screen Reader
  {
    id: 'sr-1',
    category: 'Screen Reader',
    description: 'All interactive elements have accessibilityLabel',
    checked: false,
  },
  {
    id: 'sr-2',
    category: 'Screen Reader',
    description: 'Complex interactions have accessibilityHint',
    checked: false,
  },
  {
    id: 'sr-3',
    category: 'Screen Reader',
    description: 'All elements have appropriate accessibilityRole',
    checked: false,
  },
  {
    id: 'sr-4',
    category: 'Screen Reader',
    description: 'Dynamic content changes are announced',
    checked: false,
  },
  // Keyboard Navigation
  {
    id: 'kb-1',
    category: 'Keyboard',
    description: 'All interactive elements are keyboard accessible',
    checked: false,
  },
  {
    id: 'kb-2',
    category: 'Keyboard',
    description: 'Focus order is logical and predictable',
    checked: false,
  },
  {
    id: 'kb-3',
    category: 'Keyboard',
    description: 'Focus indicators are clearly visible',
    checked: false,
  },
  // Color & Contrast
  {
    id: 'color-1',
    category: 'Color & Contrast',
    description: 'Text has 4.5:1 contrast ratio (3:1 for large text)',
    checked: false,
  },
  {
    id: 'color-2',
    category: 'Color & Contrast',
    description: 'Color is not the only way to convey information',
    checked: false,
  },
  {
    id: 'color-3',
    category: 'Color & Contrast',
    description: 'UI works in high contrast mode',
    checked: false,
  },
  // Error Handling
  {
    id: 'error-1',
    category: 'Errors',
    description: 'Error messages are clear and helpful',
    checked: false,
  },
  {
    id: 'error-2',
    category: 'Errors',
    description: 'Errors are announced to screen readers',
    checked: false,
  },
  {
    id: 'error-3',
    category: 'Errors',
    description: 'Error recovery instructions are provided',
    checked: false,
  },
  // Loading States
  {
    id: 'loading-1',
    category: 'Loading',
    description: 'Loading states are announced',
    checked: false,
  },
  {
    id: 'loading-2',
    category: 'Loading',
    description: 'Users can understand what is loading',
    checked: false,
  },
  // Crisis Support
  {
    id: 'crisis-1',
    category: 'Crisis Support',
    description: 'Crisis resources are easily accessible',
    checked: false,
  },
  {
    id: 'crisis-2',
    category: 'Crisis Support',
    description: 'Crisis alerts use assertive announcements',
    checked: false,
  },
  {
    id: 'crisis-3',
    category: 'Crisis Support',
    description: 'Emergency contacts have large touch targets',
    checked: false,
  },
];

export const AccessibilityChecklist: React.FC = () => {
  const { theme } = useTheme();
  const [checklist, setChecklist] = useState(initialChecklist);
  const [showOnlyUnchecked, setShowOnlyUnchecked] = useState(false);

  const toggleItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const categories = Array.from(
    new Set(checklist.map((item) => item.category))
  );

  const getCompletionRate = () => {
    const completed = checklist.filter((item) => item.checked).length;
    return Math.round((completed / checklist.length) * 100);
  };

  const testContrast = () => {
    const textColor = theme.colors.text;
    const bgColor = theme.colors.background;
    const ratio = getContrastRatio(textColor, bgColor);
    const meetsAA = meetsWCAGAA(ratio);

    Alert.alert(
      'Contrast Test',
      `Text/Background contrast: ${ratio.toFixed(2)}:1\n${
        meetsAA ? '✅ Meets WCAG AA' : '❌ Fails WCAG AA (needs 4.5:1)'
      }`,
      [{ text: 'OK' }]
    );
  };

  const filteredChecklist = showOnlyUnchecked
    ? checklist.filter((item) => !item.checked)
    : checklist;

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Accessibility Checklist
        </Text>
        <Text style={[styles.completion, { color: theme.colors.textMuted }]}>
          {getCompletionRate()}% Complete
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => setShowOnlyUnchecked(!showOnlyUnchecked)}
          accessibilityRole="button"
          accessibilityLabel={`${showOnlyUnchecked ? 'Show all' : 'Show only unchecked'} items`}
        >
          <Text style={[styles.filterText, { color: theme.colors.text }]}>
            {showOnlyUnchecked ? 'Show All' : 'Show Unchecked'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: theme.colors.primary }]}
          onPress={testContrast}
          accessibilityRole="button"
          accessibilityLabel="Test color contrast"
        >
          <Text style={styles.testButtonText}>Test Contrast</Text>
        </TouchableOpacity>
      </View>

      {categories.map((category) => (
        <View key={category} style={styles.category}>
          <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>
            {category}
          </Text>
          {filteredChecklist
            .filter((item) => item.category === category)
            .map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.item, { backgroundColor: theme.colors.surface }]}
                onPress={() => toggleItem(item.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: item.checked }}
                accessibilityLabel={item.description}
              >
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: theme.colors.border },
                    item.checked && { backgroundColor: theme.colors.success },
                  ]}
                >
                  {item.checked && (
                    <Feather name="check" size={16} color="white" />
                  )}
                </View>
                <Text
                  style={[
                    styles.itemText,
                    { color: theme.colors.text },
                    item.checked && styles.checkedText,
                  ]}
                >
                  {item.description}
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
          Remember: Accessibility is not just about compliance, it's about
          ensuring everyone can use the app effectively, especially users in
          vulnerable states.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  completion: {
    fontSize: 16,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  testButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  category: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    minHeight: 48, // Ensure touch target size
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    flex: 1,
    fontSize: 14,
  },
  checkedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  footer: {
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  footerText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AccessibilityChecklist;