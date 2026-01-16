import React, { useState, useEffect } from 'react';
import HomePage from './app-simple.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { authFunctions } from './lib/supabaseClient.js';

export default function AppRoot() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  
  // Set to true to force show homepage for testing
  const FORCE_HOMEPAGE = false;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Only check auth if supabase is available
        const result = await authFunctions.getSession();
        const isAuth = !!result?.session?.user;
        setIsAuthenticated(isAuth);
      } catch (err) {
        console.error('Auth check error:', err);
        setIsAuthenticated(false);
      } finally {
        setHasCheckedAuth(true);
      }
    };

    checkAuth();

    // Listen to auth changes
    const unsubscribe = authFunctions.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Show dashboard if authenticated, otherwise show homepage
  // Always show homepage while checking auth to avoid UI flashing
  if (!FORCE_HOMEPAGE && isAuthenticated && hasCheckedAuth) {
    try {
      return <Dashboard />;
    } catch (err) {
      console.error('Dashboard error:', err);
      return <HomePage />;
    }
  }

  return <HomePage />;
}
