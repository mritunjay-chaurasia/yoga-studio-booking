import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../apis';
import { useIsMounted } from '../hooks/useIsMounted';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const mounted = useIsMounted();

  const clearSession = useCallback(() => {
    if (mounted.current) setUser(null);
  }, [mounted]);

  const loadUser = useCallback(async () => {
    try {
      const { user: me } = await authApi.getMe();
      if (mounted.current) setUser(me);
    } catch {
      try {
        const { user: refreshed } = await authApi.refresh();
        if (mounted.current) setUser(refreshed);
      } catch {
        if (mounted.current) clearSession();
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [clearSession, mounted]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    const handleSessionExpired = () => clearSession();
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () =>
      window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, [clearSession]);

  const login = async (email, password) => {
    const { user: loggedIn } = await authApi.login(email, password);
    setUser(loggedIn);
    return loggedIn;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* cookies cleared on server when possible */
    } finally {
      clearSession();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
