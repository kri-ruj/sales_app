import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[]; // Optional: Specify roles that are allowed to access this route
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show a loading indicator while checking auth status
    // This prevents a flash of the login page before auth status is confirmed
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">กำลังโหลดข้อมูลผู้ใช้...</p>
          <p className="text-sm text-gray-500">กรุณารอสักครู่</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for role authorization if allowedRoles are provided
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !user.role || !allowedRoles.includes(user.role)) {
      // User does not have the required role, redirect to an unauthorized page or home
      // For now, redirecting to home. Consider creating a dedicated "Unauthorized" page.
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้'); // Simple alert for now
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />; // If authenticated (and authorized, if roles are checked), render the child route's element
};

export default ProtectedRoute; 