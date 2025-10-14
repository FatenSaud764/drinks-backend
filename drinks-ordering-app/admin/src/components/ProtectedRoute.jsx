/**
 * @author Kirsten Sanders
 * @description This component protects routes by checking authentication status.
*/

import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import "../styles/Loading.css"; // Loading spinner

export default function ProtectedRoute({ children, __testDelay, delayMs }) {
  const { isAuthenticated, loading } = useAuth();
  const isTestEnv = process.env.NODE_ENV === 'test';
  const [artificialLoading, setArtificialLoading] = useState(!isTestEnv);
  // Allow explicit override but skip entirely in test env
  const effectiveDelay = isTestEnv ? 0 : (typeof delayMs === 'number' ? delayMs : (typeof __testDelay === 'number' ? __testDelay : 1500));

  useEffect(() => {
    if (isTestEnv) return; // no artificial delay in tests
    const timer = setTimeout(() => setArtificialLoading(false), effectiveDelay);
    return () => clearTimeout(timer);
  }, [effectiveDelay, isTestEnv]);

  // Show loading while checking authentication OR during artificial delay
  if (loading || artificialLoading) {
    return (
      <div className="page">
        <div className="page-container">
          <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p>Checking authentication...</p>
        </div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}