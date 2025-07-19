import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { OfflineQueueViewer } from '@components/feature/sync/OfflineQueueViewer';
import { syncManager } from '@services/database/sync/syncManager';

// Mock dependencies
jest.mock('../../../../services/database/sync/syncManager', () => ({
  syncManager: {
    getOfflineQueueVisualization: jest.fn(),
    clearQueueItem: jest.fn(),
    syncAll: jest.fn(),
  }
}));

// Mock Alert
const mockAlert = jest.fn((title, message, buttons) => {
  // Automatically press the confirm button if it exists
  const confirmButton = buttons?.find(b => b.style === 'destructive' || b.text === 'Remove');
  if (confirmButton?.onPress) {
    confirmButton.onPress();
  }
});

// Override the Alert.alert method
Alert.alert = mockAlert;

describe('OfflineQueueViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show empty state when no items are queued', () => {
    (syncManager.getOfflineQueueVisualization as jest.Mock).mockReturnValue({
      totalItems: 0,
      byFeature: {
        bouncePlan: 0,
        jobApplications: 0,
        budget: 0,
        wellness: 0,
        coach: 0
      },
      items: []
    });

    const { getByText } = render(<OfflineQueueViewer />);

    expect(getByText('No pending items')).toBeTruthy();
    expect(getByText('All changes have been saved')).toBeTruthy();
  });

  it('should display queue items grouped by feature', async () => {
    const mockQueue = {
      totalItems: 5,
      byFeature: {
        bouncePlan: 2,
        jobApplications: 2,
        budget: 0,
        wellness: 1,
        coach: 0
      },
      items: [
        {
          id: '1',
          feature: 'bouncePlan',
          type: 'task_completion',
          timestamp: new Date('2025-01-08T10:00:00Z'),
          data: { taskId: 'task-1', completed: true }
        },
        {
          id: '2',
          feature: 'bouncePlan',
          type: 'task_completion',
          timestamp: new Date('2025-01-08T10:30:00Z'),
          data: { taskId: 'task-2', completed: true }
        },
        {
          id: '3',
          feature: 'jobApplications',
          type: 'application_create',
          timestamp: new Date('2025-01-08T11:00:00Z'),
          data: { company: 'Tech Corp', position: 'Developer' }
        },
        {
          id: '4',
          feature: 'jobApplications',
          type: 'application_update',
          timestamp: new Date('2025-01-08T11:30:00Z'),
          data: { id: 'app-1', status: 'interviewing' }
        },
        {
          id: '5',
          feature: 'wellness',
          type: 'mood_entry',
          timestamp: new Date('2025-01-08T12:00:00Z'),
          data: { value: 4, note: 'Feeling better' }
        }
      ],
      oldestItem: new Date('2025-01-08T10:00:00Z')
    };

    (syncManager.getOfflineQueueVisualization as jest.Mock).mockReturnValue(mockQueue);

    const { getByText, getAllByText } = render(<OfflineQueueViewer />);

    // Check header
    expect(getByText('5 items waiting to sync')).toBeTruthy();

    // Check feature sections - note the component converts camelCase to space-separated
    expect(getByText('bounce Plan (2)')).toBeTruthy();
    expect(getByText('job Applications (2)')).toBeTruthy();
    expect(getByText('wellness (1)')).toBeTruthy();

    // Check individual items - use getAllByText for duplicate items
    expect(getAllByText('Task completion')).toHaveLength(2);
    expect(getByText('New application: Tech Corp')).toBeTruthy();
    expect(getByText('Status update: interviewing')).toBeTruthy();
    expect(getByText('Mood entry: 4/5')).toBeTruthy();
  });

  it('should show time since oldest item', () => {
    const mockQueue = {
      totalItems: 2,
      byFeature: { bouncePlan: 2 },
      items: [],
      oldestItem: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    };

    (syncManager.getOfflineQueueVisualization as jest.Mock).mockReturnValue(mockQueue);

    const { getByText } = render(<OfflineQueueViewer />);

    expect(getByText(/Oldest item: 2 hours ago/)).toBeTruthy();
  });

  it('should allow clearing specific queue items', async () => {
    const mockQueue = {
      totalItems: 1,
      byFeature: { bouncePlan: 1 },
      items: [{
        id: '1',
        feature: 'bouncePlan',
        type: 'task_completion',
        timestamp: new Date(),
        data: {}
      }]
    };

    (syncManager.getOfflineQueueVisualization as jest.Mock).mockReturnValue(mockQueue);
    (syncManager.clearQueueItem as jest.Mock).mockResolvedValue(true);

    const { getByTestId } = render(<OfflineQueueViewer />);
    const clearButton = getByTestId('clear-item-1');

    await act(async () => {
      fireEvent.press(clearButton);
    });

    // Verify Alert was called
    expect(mockAlert).toHaveBeenCalledWith(
      'Remove Item',
      'Are you sure you want to remove this item from the queue? This action cannot be undone.',
      expect.any(Array)
    );

    await waitFor(() => {
      expect(syncManager.clearQueueItem).toHaveBeenCalledWith('1');
    });
  });

  it('should collapse and expand feature sections', () => {
    const mockQueue = {
      totalItems: 2,
      byFeature: { bouncePlan: 2 },
      items: [
        {
          id: '1',
          feature: 'bouncePlan',
          type: 'task_completion',
          timestamp: new Date(),
          data: { taskId: 'task-1' }
        },
        {
          id: '2',
          feature: 'bouncePlan',
          type: 'task_completion',
          timestamp: new Date(),
          data: { taskId: 'task-2' }
        }
      ]
    };

    (syncManager.getOfflineQueueVisualization as jest.Mock).mockReturnValue(mockQueue);

    const { getAllByText, queryByText, getByTestId } = render(<OfflineQueueViewer />);

    // Items should be visible initially (2 task completion items)
    expect(getAllByText('Task completion')).toHaveLength(2);

    // Collapse section
    const collapseButton = getByTestId('collapse-bouncePlan');
    fireEvent.press(collapseButton);

    // Items should be hidden
    expect(queryByText('Task completion')).toBeNull();

    // Expand section
    fireEvent.press(collapseButton);

    // Items should be visible again
    expect(getAllByText('Task completion')).toHaveLength(2);
  });

  it('should retry sync for all items', async () => {
    const mockQueue = {
      totalItems: 3,
      byFeature: {
        bouncePlan: 1,
        jobApplications: 2
      },
      items: []
    };

    (syncManager.getOfflineQueueVisualization as jest.Mock).mockReturnValue(mockQueue);
    (syncManager.syncAll as jest.Mock).mockResolvedValue({
      success: true,
      errors: []
    });

    const { getByText, getByTestId } = render(<OfflineQueueViewer />);
    const retryButton = getByTestId('retry-all-button');

    await act(async () => {
      fireEvent.press(retryButton);
    });

    await waitFor(() => {
      expect(syncManager.syncAll).toHaveBeenCalled();
    });
  });

  it('should show appropriate icons for different queue item types', () => {
    const mockQueue = {
      totalItems: 4,
      byFeature: {
        bouncePlan: 1,
        jobApplications: 1,
        budget: 1,
        wellness: 1
      },
      items: [
        {
          id: '1',
          feature: 'bouncePlan',
          type: 'task_completion',
          timestamp: new Date(),
          data: {}
        },
        {
          id: '2',
          feature: 'jobApplications',
          type: 'application_create',
          timestamp: new Date(),
          data: {}
        },
        {
          id: '3',
          feature: 'budget',
          type: 'budget_update',
          timestamp: new Date(),
          data: {}
        },
        {
          id: '4',
          feature: 'wellness',
          type: 'mood_entry',
          timestamp: new Date(),
          data: {}
        }
      ]
    };

    (syncManager.getOfflineQueueVisualization as jest.Mock).mockReturnValue(mockQueue);

    const { getByTestId } = render(<OfflineQueueViewer />);

    expect(getByTestId('icon-bouncePlan')).toBeTruthy();
    expect(getByTestId('icon-jobApplications')).toBeTruthy();
    expect(getByTestId('icon-budget')).toBeTruthy();
    expect(getByTestId('icon-wellness')).toBeTruthy();
  });

  it('should show warning for large queue size', () => {
    const mockQueue = {
      totalItems: 50,
      byFeature: {
        bouncePlan: 10,
        jobApplications: 20,
        budget: 5,
        wellness: 15,
        coach: 0
      },
      items: [],
      sizeInBytes: 16 * 1024 * 1024 // 16MB (>75% of 20MB)
    };

    (syncManager.getOfflineQueueVisualization as jest.Mock).mockReturnValue(mockQueue);

    const { getByText, getByTestId } = render(<OfflineQueueViewer />);

    expect(getByText(/Large queue size/)).toBeTruthy();
    expect(getByText(/16\.0 MB of 20 MB limit/)).toBeTruthy();
    expect(getByTestId('storage-warning')).toBeTruthy();
  });
});