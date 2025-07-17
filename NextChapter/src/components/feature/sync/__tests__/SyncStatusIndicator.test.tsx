import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SyncStatusIndicator } from '../SyncStatusIndicator';
import { syncManager } from '../../../../services/database/sync/syncManager';
import { useNetworkStatus } from '../../../../hooks/useNetworkStatus';

// Mock dependencies
jest.mock('../../../../services/database/sync/syncManager');
jest.mock('../../../../hooks/useNetworkStatus');

// Setup mocks
const mockSyncManager = syncManager as jest.Mocked<typeof syncManager>;

describe('SyncStatusIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNetworkStatus as jest.Mock).mockReturnValue({ isConnected: true });
  });

  it('should show synced status when all data is synced', () => {
    mockSyncManager.getSyncStatus.mockReturnValue({
      totalPending: 0,
      isFullySynced: true,
      bouncePlan: { pendingOperations: 0, lastSync: new Date() },
      jobApplications: { pendingOperations: 0, lastSync: new Date() },
      budget: { pendingOperations: 0, lastSync: new Date() },
      wellness: { pendingOperations: 0, lastSync: new Date() },
      coach: { pendingOperations: 0, lastSync: new Date() }
    });

    const { getByText, getByTestId } = render(<SyncStatusIndicator />);

    expect(getByText('All data synced')).toBeTruthy();
    expect(getByTestId('sync-icon-check')).toBeTruthy();
  });

  it('should show pending sync count when data needs syncing', () => {
    mockSyncManager.getSyncStatus.mockReturnValue({
      totalPending: 5,
      isFullySynced: false,
      bouncePlan: { pendingOperations: 2, lastSync: new Date() },
      jobApplications: { pendingOperations: 3, lastSync: new Date() },
      budget: { pendingOperations: 0, lastSync: new Date() },
      wellness: { pendingOperations: 0, lastSync: new Date() },
      coach: { pendingOperations: 0, lastSync: new Date() }
    });

    const { getByText } = render(<SyncStatusIndicator />);

    expect(getByText('5 items pending sync')).toBeTruthy();
  });

  it('should show offline indicator when network is disconnected', () => {
    (useNetworkStatus as jest.Mock).mockReturnValue({ isConnected: false });
    mockSyncManager.getSyncStatus.mockReturnValue({
      totalPending: 3,
      isFullySynced: false
    });

    const { getByText, getByTestId } = render(<SyncStatusIndicator />);

    expect(getByText('Offline - 3 items queued')).toBeTruthy();
    expect(getByTestId('sync-icon-offline')).toBeTruthy();
  });

  it('should trigger manual sync when pressed', async () => {
    mockSyncManager.getSyncStatus.mockReturnValue({
      totalPending: 2,
      isFullySynced: false
    });
    mockSyncManager.syncAll.mockResolvedValue({
      success: true,
      errors: []
    });

    const { getByTestId } = render(<SyncStatusIndicator />);
    const syncButton = getByTestId('sync-button');

    fireEvent.press(syncButton);

    await waitFor(() => {
      expect(mockSyncManager.syncAll).toHaveBeenCalled();
    });
  });

  it('should show syncing status during sync', async () => {
    mockSyncManager.getSyncStatus.mockReturnValue({
      totalPending: 2,
      isFullySynced: false
    });
    (syncManager.syncAll as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true, errors: [] }), 100))
    );

    const { getByTestId, getByText } = render(<SyncStatusIndicator />);
    const syncButton = getByTestId('sync-button');

    fireEvent.press(syncButton);

    expect(getByText('Syncing...')).toBeTruthy();
    expect(getByTestId('sync-icon-loading')).toBeTruthy();
  });

  it('should show error state when sync fails', async () => {
    mockSyncManager.getSyncStatus.mockReturnValue({
      totalPending: 2,
      isFullySynced: false
    });
    mockSyncManager.syncAll.mockResolvedValue({
      success: false,
      errors: ['Network error', 'Server error']
    });

    const { getByTestId, getByText } = render(<SyncStatusIndicator />);
    const syncButton = getByTestId('sync-button');

    fireEvent.press(syncButton);

    await waitFor(() => {
      expect(getByText('Sync failed - tap to retry')).toBeTruthy();
      expect(getByTestId('sync-icon-error')).toBeTruthy();
    });
  });

  it('should expand to show detailed sync status', async () => {
    const mockStatus = {
      totalPending: 5,
      isFullySynced: false,
      bouncePlan: { pendingOperations: 1, lastSync: new Date('2025-01-08T10:00:00Z') },
      jobApplications: { pendingOperations: 2, lastSync: new Date('2025-01-08T09:00:00Z') },
      budget: { pendingOperations: 1, lastSync: new Date('2025-01-08T11:00:00Z') },
      wellness: { pendingOperations: 1, lastSync: new Date('2025-01-08T08:00:00Z') },
      coach: { pendingOperations: 0, lastSync: new Date('2025-01-08T12:00:00Z') }
    };

    mockSyncManager.getSyncStatus.mockReturnValue(mockStatus);

    const { getByTestId, getByText } = render(<SyncStatusIndicator />);
    const expandButton = getByTestId('expand-button');

    fireEvent.press(expandButton);

    await waitFor(() => {
      expect(getByText('Bounce Plan: 1 pending')).toBeTruthy();
      expect(getByText('Job Applications: 2 pending')).toBeTruthy();
      expect(getByText('Budget: 1 pending')).toBeTruthy();
      expect(getByText('Wellness: 1 pending')).toBeTruthy();
      expect(getByText('Coach: Synced')).toBeTruthy();
    });
  });

  it('should auto-sync when coming back online', async () => {
    const { rerender } = render(<SyncStatusIndicator />);
    
    // Start offline
    (useNetworkStatus as jest.Mock).mockReturnValue({ isConnected: false });
    (syncManager.hasPendingSyncs as jest.Mock).mockReturnValue(true);
    
    rerender(<SyncStatusIndicator />);

    // Come back online
    (useNetworkStatus as jest.Mock).mockReturnValue({ isConnected: true });
    mockSyncManager.syncAll.mockResolvedValue({
      success: true,
      errors: []
    });

    rerender(<SyncStatusIndicator />);

    await waitFor(() => {
      expect(mockSyncManager.syncAll).toHaveBeenCalled();
    });
  });

  it('should show conflict resolution UI when conflicts exist', async () => {
    mockSyncManager.getSyncStatus.mockReturnValue({
      totalPending: 2,
      isFullySynced: false
    });
    mockSyncManager.syncAll.mockResolvedValue({
      success: true,
      errors: [],
      conflicts: [{
        type: 'coach_message',
        localData: { content: 'Local message' },
        serverData: { content: 'Server message' }
      }]
    });

    const { getByTestId, getByText } = render(<SyncStatusIndicator />);
    const syncButton = getByTestId('sync-button');

    fireEvent.press(syncButton);

    await waitFor(() => {
      expect(getByText('1 conflict resolved')).toBeTruthy();
    });
  });
});