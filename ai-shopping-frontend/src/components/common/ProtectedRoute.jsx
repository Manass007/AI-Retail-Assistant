import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
