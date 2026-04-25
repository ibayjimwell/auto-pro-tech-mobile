import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Load token on app start
    const loadStoredData = async () => {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };
    loadStoredData();
  }, []);

  const login = async (emailOrPhone, password) => {
    const response = await api.login({ emailOrPhone, password });
    if (response.success) {
      await AsyncStorage.setItem('auth_token', response.token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);
      return { success: true };
    }
    return { success: false, message: response.message };
  };

  const register = async (fullName, email, phone, password) => {
    const response = await api.register({ fullName, email, phone, password });
    if (response.success) {
      await AsyncStorage.setItem('auth_token', response.token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);
      return { success: true };
    }
    return { success: false, message: response.message };
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);