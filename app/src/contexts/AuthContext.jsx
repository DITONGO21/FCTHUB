import { createContext, useContext, useEffect, useState } from 'react';
import { authApi, profilesApi } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);      // Supabase auth user
  const [profile, setProfile] = useState(null); // profiles table row
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing session on mount
    authApi.getSession().then(async (session) => {
      if (session?.user) {
        setUser(session.user);
        try {
          const p = await profilesApi.getById(session.user.id);
          setProfile(p);
        } catch (_) {}
      }
      setLoading(false);
    });

    // Listen to auth state changes
    const { data: { subscription } } = authApi.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        try {
          const p = await profilesApi.getById(session.user.id);
          setProfile(p);
        } catch (_) {}
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    return data;
  };

  const logout = async () => {
    await authApi.logout();
  };

  const register = async (fields) => {
    const data = await authApi.register(fields);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
