import { useAuth as useAuthContext } from '../context/AuthContext';

// Re-export with proper typing
export const useAuth = () => {
  const auth = useAuthContext();
  return {
    ...auth,
    loading: auth.isLoading, // Add alias for backward compatibility
  };
};