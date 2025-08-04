import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';
import { ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

export function AuthGuard({ children, redirectTo = '/' }: AuthGuardProps) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}