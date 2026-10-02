import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  teamName: string | null;
  reportingTlName: string | null;
  loading: boolean;
  isAdmin: boolean;
  isTL: boolean;
  isAgent: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (data: any) => Promise<{ message: string; status: string }>;
  logout: () => Promise<void>;
  quickSwitch: (role?: string, username?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [reportingTlName, setReportingTlName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      if (!getStoredToken()) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await api.getMe();
      setUser(data.user);
      setTeamName(data.teamName);
      setReportingTlName(data.reportingTlName);
    } catch (err) {
      console.warn('Failed to restore session:', err);
      clearStoredToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    const res = await api.login(credentials);
    setStoredToken(res.token);
    setUser(res.user);
    await fetchProfile();
  };

  const register = async (data: any) => {
    return api.register(data);
  };

  const quickSwitch = async (role?: string, username?: string) => {
    setLoading(true);
    try {
      const res = await api.quickSwitch({ role, username });
      setStoredToken(res.token);
      setUser(res.user);
      await fetchProfile();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      clearStoredToken();
      setUser(null);
      setTeamName(null);
      setReportingTlName(null);
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isTL = user?.role === 'TEAM_LEADER';
  const isAgent = user?.role === 'AGENT';

  return (
    <AuthContext.Provider
      value={{
        user,
        teamName,
        reportingTlName,
        loading,
        isAdmin,
        isTL,
        isAgent,
        login,
        register,
        logout,
        quickSwitch,
        refreshUser: fetchProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
