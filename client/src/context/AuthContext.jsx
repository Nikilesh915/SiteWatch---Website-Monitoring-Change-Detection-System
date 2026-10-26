import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sitewatch_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const savedToken = localStorage.getItem('sitewatch_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.warn('Failed to verify token:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('sitewatch_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (name, email, password, alertEmail) => {
    const res = await api.post('/auth/register', { name, email, password, alertEmail });
    if (res.data.success) {
      localStorage.setItem('sitewatch_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const demoLogin = async () => {
    const res = await api.post('/auth/demo');
    if (res.data.success) {
      localStorage.setItem('sitewatch_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.data.message || 'Demo initialization failed');
  };

  const updatePreferences = async (preferencesData) => {
    const res = await api.put('/auth/preferences', preferencesData);
    if (res.data.success) {
      setUser(prev => ({ ...prev, ...res.data.user }));
      return res.data;
    }
    throw new Error(res.data.message || 'Failed to update preferences');
  };

  const logout = () => {
    localStorage.removeItem('sitewatch_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        demoLogin,
        logout,
        updatePreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
