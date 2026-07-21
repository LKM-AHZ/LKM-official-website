import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { getAuthPath } from './auth-paths';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: Props) {
  const { state } = useAuth();

  if (!state.isLoggedIn) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="text-6xl">🔒</div>
          <p className="text-lg text-base-content">请先登录后再访问此页面</p>
          <a href={getAuthPath('login')} className="btn btn-primary">
            前往登录
          </a>
        </div>
      )
    );
  }

  return <>{children}</>;
}
