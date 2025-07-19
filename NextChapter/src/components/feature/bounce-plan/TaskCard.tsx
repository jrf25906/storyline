import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@context/ThemeContext';
import { BouncePlanTaskDefinition } from '@constants/bouncePlanTasks';
import { Body, BodySM, Caption } from '@components/common/Typography';

interface TaskCardProps {
  task: BouncePlanTaskDefinition;
  status: 'locked' | 'available' | 'completed' | 'skipped';
  onPress: () => void;
  isExpanded?: boolean;
}

const CATEGORY_COLORS = {
  mindset: '#8B5CF6',
  practical: '#3B82F6',
  network: '#10B981',
  prepare: '#F59E0B',
  action: '#EF4444',
};

const CATEGORY_ICONS = {
  mindset: 'bulb-outline',
  practical: 'construct-outline',
  network: 'people-outline',
  prepare: 'document-text-outline',
  action: 'rocket-outline',
};

export default function TaskCard({ task, status, onPress, isExpanded = false }: TaskCardProps) {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  
  // Early return if task is not provided
  if (!task) {
    return null;
  }
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };
  
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />;
      case 'skipped':
        return <Ionicons name="close-circle" size={24} color={theme.colors.textSecondary} />;
      case 'locked':
        return <Ionicons name="lock-closed" size={24} color={theme.colors.textSecondary} />;
      default:
        return <Ionicons name="ellipse-outline" size={24} color={theme.colors.primary} />;
    }
  };
  
  const isDisabled = status === 'locked';
  const categoryColor = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.mindset; // Fallback to mindset color
  
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.7}
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: isDisabled ? 0.6 : 1,
          },
          status === 'completed' && styles.completedContainer,
          status === 'skipped' && styles.skippedContainer,
        ]}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Day ${task.day}: ${task.title}. Status: ${status}`}
        accessibilityHint={isDisabled ? 'Task is locked' : 'Tap to view task details'}
      >
        <View style={styles.header}>
          <View style={styles.leftSection}>
            <View style={[styles.dayBadge, { backgroundColor: categoryColor + '20' }]}>
              <Text style={[styles.dayText, { color: categoryColor }]}>
                Day {task.day}
              </Text>
            </View>
            <View style={[styles.categoryIcon, { backgroundColor: categoryColor + '15' }]}>
              <Ionicons 
                name={(CATEGORY_ICONS[task.category] || CATEGORY_ICONS.mindset) as any} 
                size={20} 
                color={categoryColor} 
              />
            </View>
          </View>
          <View style={styles.rightSection}>
            {task.duration !== '0 minutes' && (
              <Caption style={[styles.duration, { color: theme.colors.textSecondary }]}>
                {task.duration}
              </Caption>
            )}
            {getStatusIcon()}
          </View>
        </View>
        
        <View style={styles.content}>
          <Body style={[styles.title, { color: theme.colors.text }]}>
            {task.title}
          </Body>
          {!task.isWeekend && (
            <BodySM 
              style={[styles.description, { color: theme.colors.textSecondary }]}
              numberOfLines={isExpanded ? undefined : 2}
            >
              {task.description}
            </BodySM>
          )}
        </View>
        
        {status === 'completed' && (
          <View style={[styles.completedBadge, { backgroundColor: theme.colors.success + '20' }]}>
            <Ionicons name="checkmark" size={16} color={theme.colors.success} />
            <Caption style={[styles.completedText, { color: theme.colors.success }]}>
              Completed
            </Caption>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  completedContainer: {
    borderWidth: 0,
  },
  skippedContainer: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  duration: {
    fontSize: 12,
  },
  content: {
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '500',
  },
});