import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context';
import { LoadingSpinner } from '../ui';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login while saving the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Support two usages:
  // 1) <Route path="/" element={<ProtectedRoute><AdminHome/></ProtectedRoute>} />
  // 2) <Route element={<ProtectedRoute/>}><Route path="/" element={<AdminHome/>}/></Route>
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
