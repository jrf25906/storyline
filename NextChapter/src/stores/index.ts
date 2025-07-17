// Export all Zustand stores
export { useUserStore } from './userStore';
export { useBouncePlanStore } from './bouncePlanStore';
export { useJobApplicationStore } from './jobApplicationStore';
export { useBudgetStore } from './budgetStore';
export { useCoachStore } from './coachStore';
export { useUIStore } from './uiStore';
export { useOfflineStore } from './offlineStore';

// Helper function to reset all stores (useful for logout)
export const resetAllStores = () => {
  useUserStore.getState().reset();
  useBouncePlanStore.getState().reset();
  useJobApplicationStore.getState().reset();
  useBudgetStore.getState().reset();
  useCoachStore.getState().reset();
  // Reset UI store to clear any loading/error states
  useUIStore.setState({
    globalLoading: false,
    loadingMessage: undefined,
    globalError: null,
    loadingStates: {},
    errors: {},
    networkStatus: 'online',
    offlineQueue: [],
  });
};

// Helper function to sync all offline data
export const syncAllOfflineData = async (userId: string) => {
  const promises = [
    useBouncePlanStore.getState().syncProgress(userId),
    useJobApplicationStore.getState().syncOfflineChanges(userId),
    useCoachStore.getState().syncOfflineMessages(userId),
  ];
  
  await Promise.allSettled(promises);
};