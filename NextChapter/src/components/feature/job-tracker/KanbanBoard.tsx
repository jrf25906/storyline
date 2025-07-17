import React, { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  LayoutAnimation,
  UIManager,
  Platform,
  ViewStyle,
} from 'react-native';
import { JobApplication, JobApplicationStatus } from '../../../types/database';
import { useTheme } from '../../../context/ThemeContext';
import JobCard from './JobCard';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface KanbanBoardProps {
  applications: JobApplication[];
  onStatusChange: (id: string, newStatus: JobApplicationStatus) => void;
  onCardPress: (application: JobApplication) => void;
}

interface Column {
  id: JobApplicationStatus;
  title: string;
  color: string;
}

const COLUMNS: Column[] = [
  { id: 'applied', title: 'Applied', color: '#3B82F6' },
  { id: 'interviewing', title: 'Interviewing', color: '#F59E0B' },
  { id: 'offer', title: 'Offer', color: '#10B981' },
];

const { width: screenWidth } = Dimensions.get('window');
const COLUMN_WIDTH = screenWidth * 0.85;
const COLUMN_MARGIN = 12;

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  applications,
  onStatusChange,
  onCardPress,
}) => {
  const { theme } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const draggedItem = useRef<{
    id: string;
    fromColumn: JobApplicationStatus;
    pan: Animated.ValueXY;
  } | null>(null);
  const scrollOffset = useRef({ x: 0, y: 0 });

  const getApplicationsForColumn = (status: JobApplicationStatus) => {
    return applications.filter(app => app.status === status);
  };

  const handleDrop = (toColumn: JobApplicationStatus) => {
    if (draggedItem.current) {
      const { id, fromColumn } = draggedItem.current;
      if (fromColumn !== toColumn) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onStatusChange(id, toColumn);
      }
      draggedItem.current = null;
    }
  };

  const createPanResponder = (application: JobApplication) => {
    const pan = new Animated.ValueXY();
    
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only start dragging if moved more than 5 pixels
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      
      onPanResponderGrant: () => {
        draggedItem.current = {
          id: application.id,
          fromColumn: application.status as JobApplicationStatus,
          pan,
        };
      },
      
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      
      onPanResponderRelease: (_, gestureState) => {
        // Calculate which column the card was dropped on
        const dropX = gestureState.moveX;
        const columnIndex = Math.floor((dropX + scrollOffset.current.x) / (COLUMN_WIDTH + COLUMN_MARGIN));
        const targetColumn = COLUMNS[Math.max(0, Math.min(columnIndex, COLUMNS.length - 1))];
        
        handleDrop(targetColumn.id);
        
        // Animate back to original position
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start();
      },
    });
  };

  const renderColumn = (column: Column) => {
    const columnApplications = getApplicationsForColumn(column.id);
    
    return (
      <View
        key={column.id}
        style={[
          styles.column,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={[styles.columnHeader, { backgroundColor: column.color }]}>
          <Text style={styles.columnTitle}>{column.title}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{columnApplications.length}</Text>
          </View>
        </View>
        
        <ScrollView
          style={styles.columnContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.columnContentContainer}
        >
          {columnApplications.map((application) => {
            const panResponder = createPanResponder(application);
            const animatedStyle = draggedItem.current?.id === application.id
              ? {
                  transform: [
                    { translateX: draggedItem.current.pan.x },
                    { translateY: draggedItem.current.pan.y },
                  ],
                  zIndex: 1000,
                  elevation: 5,
                }
              : {};
            
            return (
              <Animated.View
                key={application.id}
                style={[animatedStyle]}
                {...panResponder.panHandlers}
              >
                <JobCard
                  application={application}
                  onPress={() => onCardPress(application)}
                  isDragging={draggedItem.current?.id === application.id}
                />
              </Animated.View>
            );
          })}
          
          {columnApplications.length === 0 && (
            <View style={styles.emptyColumn}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No applications
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      pagingEnabled={false}
      decelerationRate="fast"
      snapToInterval={COLUMN_WIDTH + COLUMN_MARGIN}
      snapToAlignment="start"
      onScroll={(event) => {
        scrollOffset.current = {
          x: event.nativeEvent.contentOffset.x,
          y: event.nativeEvent.contentOffset.y,
        };
      }}
      scrollEventThrottle={16}
    >
      {COLUMNS.map(renderColumn)}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: COLUMN_MARGIN / 2,
    paddingVertical: 16,
  },
  column: {
    width: COLUMN_WIDTH,
    marginHorizontal: COLUMN_MARGIN / 2,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 400,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  columnTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  columnContent: {
    flex: 1,
  },
  columnContentContainer: {
    padding: 12,
  },
  emptyColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
  },
});

export default KanbanBoard;