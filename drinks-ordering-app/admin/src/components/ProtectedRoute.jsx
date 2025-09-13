import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import "../styles/Loading.css"; // Loading spinner

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const [artificialLoading, setArtificialLoading] = useState(true);

  // Delay for showcasing the loading indicator
  useEffect(() => {
    const timer = setTimeout(() => {
      setArtificialLoading(false);
    }, 1500); // timeout just to showcase the loading state

    return () => clearTimeout(timer);
  }, []);

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