import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import authApi from '../services/authApi';

const AuthContext = createContext();

// --- Platform-aware storage wrapper ---
const storage = {
  async getItem(key) {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  async setItem(key, value) {
    if (Platform.OS === 'web') {
      return await AsyncStorage.setItem(key, value);
    } else {
      return await SecureStore.setItemAsync(key, value);
    }
  },
  async removeItem(key) {
    if (Platform.OS === 'web') {
      return await AsyncStorage.removeItem(key);
    } else {
      return await SecureStore.deleteItemAsync(key);
    }
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedToken = await storage.getItem('auth_token');
        const storedUser = await storage.getItem('auth_user');
        console.log('[Auth] Loaded token:', storedToken ? 'YES' : 'NO', 'Platform:', Platform.OS);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('[Auth] Failed to load from storage', error);
      } finally {
        setLoading(false);
      }
    };
    loadStoredData();
  }, []);

  const login = async (emailOrPhone, password) => {
    try {
      const response = await authApi.login({ emailOrPhone, password });
      if (response.success) {
        await storage.setItem('auth_token', response.token);
        await storage.setItem('auth_user', JSON.stringify(response.user));
        console.log('[Auth] Token saved, Platform:', Platform.OS);
        setToken(response.token);
        setUser(response.user);
        return { success: true };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      console.error('[Auth] Login error:', error);
      return { success: false, message: error.message };
    }
  };

  const register = async (fullName, email, phone, password) => {
    try {
      const response = await authApi.register({ fullName, email, phone, password });
      if (response.success) {
        await storage.setItem('auth_token', response.token);
        await storage.setItem('auth_user', JSON.stringify(response.user));
        setToken(response.token);
        setUser(response.user);
        return { success: true };
      }
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error) {
      console.error('[Auth] Register error:', error);
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    await storage.removeItem('auth_token');
    await storage.removeItem('auth_user');
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