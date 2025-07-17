# Network State Detection and Offline Queue Implementation

## Overview
This implementation adds network state detection and offline queue functionality to the NextChapter React Native app, specifically for the Bounce Plan feature.

## Key Components

### 1. **Network State Management (OfflineContext)**
- Uses `@react-native-community/netinfo` to detect network connectivity
- Provides real-time network status throughout the app
- Auto-triggers sync when connection is restored
- Checks for pending syncs every 5 seconds

### 2. **Offline Queue (bouncePlanStore)**
- Stores failed or offline operations in a queue
- Each queued operation includes:
  - Unique ID and timestamp
  - Operation type (complete, skip, reopen, updateNotes)
  - Task ID and optional data (notes)
- Queue persists to AsyncStorage for reliability

### 3. **Sync Manager**
- Central service for syncing all app data
- Processes offline queue when online
- Returns detailed sync results with error messages
- Handles partial sync failures gracefully

### 4. **UI Components**

#### NetworkStatusBar
- Animated status bar showing network state
- Color-coded indicators:
  - Red: No internet connection
  - Orange: Changes pending sync
  - Blue: Currently syncing
  - Green: Connected and synced
- "Sync Now" button when changes are pending

#### BouncePlanScreen Updates
- Integrated network status bar
- Smart sync logic in task handlers:
  - Attempts immediate sync when online
  - Queues operations when offline
  - Falls back to queue on sync failures

## Usage Example

```typescript
// Task completion with network awareness
const handleCompleteTask = async (taskId: string, notes?: string) => {
  // Update local state (optimistic update)
  await completeTask(taskId, notes);
  
  // Sync or queue based on network status
  if (isConnected) {
    const success = await syncTaskToDatabase(user.id, taskId);
    if (!success) {
      // Failed while online, queue for retry
      addToOfflineQueue({
        type: 'complete',
        taskId,
        data: { notes }
      });
    }
  } else {
    // Offline, queue for later sync
    addToOfflineQueue({
      type: 'complete',
      taskId,
      data: { notes }
    });
  }
};
```

## Testing
- Comprehensive test suite for offline queue operations
- Tests cover:
  - Queue management (add, clear, size)
  - Processing with success/failure scenarios
  - Persistence to AsyncStorage
  - Mixed success/failure handling

## Benefits
1. **Offline-First**: Users can continue working without internet
2. **Data Integrity**: No data loss during network issues
3. **User Feedback**: Clear visual indicators of sync status
4. **Automatic Recovery**: Syncs resume when connection restored
5. **Graceful Degradation**: App remains fully functional offline

## Future Enhancements
- Extend offline queue to other features (job applications, budget, etc.)
- Add conflict resolution for simultaneous edits
- Implement exponential backoff for failed syncs
- Add detailed sync history and logs