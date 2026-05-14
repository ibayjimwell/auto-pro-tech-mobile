import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import authApi from '../services/authApi';

const AuthContext = createContext();

// --- Platform-aware storage wrapper with detailed logging ---
const storage = {
  async getItem(key) {
    console.log(`[Storage] ▶️ getItem(${key}) on ${Platform.OS}`);
    try {
      let value;
      if (Platform.OS === 'web') {
        value = await AsyncStorage.getItem(key);
      } else {
        value = await SecureStore.getItemAsync(key);
      }
      console.log(`[Storage] ✅ getItem(${key}) => ${value ? `${value.substring(0, 30)}...` : 'null'}`);
      return value;
    } catch (err) {
      console.error(`[Storage] ❌ getItem(${key}) error:`, err);
      return null;
    }
  },

  async setItem(key, value) {
    console.log(`[Storage] 💾 setItem(${key}) on ${Platform.OS}, value length = ${value?.length || 0}`);
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
      console.log(`[Storage] ✅ setItem(${key}) success`);
    } catch (err) {
      console.error(`[Storage] ❌ setItem(${key}) error:`, err);
      throw err;
    }
  },

  async removeItem(key) {
    console.log(`[Storage] 🗑️ removeItem(${key})`);
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
      console.log(`[Storage] ✅ removeItem(${key}) success`);
    } catch (err) {
      console.error(`[Storage] ❌ removeItem(${key}) error:`, err);
    }
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // --- Load stored credentials on app start ---
  useEffect(() => {
    const loadStoredData = async () => {
      console.log('[Auth] 🚀 loadStoredData started');
      try {
        const storedToken = await storage.getItem('auth_token');
        const storedUser = await storage.getItem('auth_user');
        console.log('[Auth] 🔍 Token present?', !!storedToken);
        console.log('[Auth] 🔍 User present?', !!storedUser);

        if (storedToken && storedUser) {
          let parsedUser;
          try {
            parsedUser = JSON.parse(storedUser);
            console.log('[Auth] ✅ Restored user:', parsedUser.fullName);
          } catch (e) {
            console.error('[Auth] ❌ Failed to parse storedUser JSON:', e);
            await storage.removeItem('auth_user'); // clear corrupted entry
            setUser(null);
            setToken(null);
            setLoading(false);
            return;
          }
          setToken(storedToken);
          setUser(parsedUser);
        } else {
          console.log('[Auth] ⚠️ No stored credentials found');
        }
      } catch (error) {
        console.error('[Auth] ❌ loadStoredData error:', error);
      } finally {
        setLoading(false);
        console.log('[Auth] loading set to false');
      }
    };
    loadStoredData();
  }, []);

  // --- Login ---
  const login = async (emailOrPhone, password) => {
    console.log('[Auth] 🔐 login() called');
    try {
      const response = await authApi.login({ emailOrPhone, password });
      console.log('[Auth] Login response.success =', response.success);
      if (response.success) {
        console.log('[Auth] Received token:', response.token ? 'YES' : 'NO');
        if (!response.token) {
          console.error('[Auth] ❌ Backend did not return a token!');
          return { success: false, message: 'Server error: missing token' };
        }
        await storage.setItem('auth_token', response.token);
        await storage.setItem('auth_user', JSON.stringify(response.user));
        console.log('[Auth] ✅ Token and user saved');
        setToken(response.token);
        setUser(response.user);
        return { success: true };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      console.error('[Auth] ❌ Login error:', error);
      return { success: false, message: error.message };
    }
  };

  // --- Register ---
  const register = async (fullName, email, phone, password) => {
    console.log('[Auth] 📝 register() called');
    try {
      const response = await authApi.register({ fullName, email, phone, password });
      console.log('[Auth] Register response.success =', response.success);
      if (response.success) {
        if (!response.token) {
          console.error('[Auth] ❌ Backend did not return a token on register!');
          return { success: false, message: 'Server error: missing token' };
        }
        await storage.setItem('auth_token', response.token);
        await storage.setItem('auth_user', JSON.stringify(response.user));
        console.log('[Auth] ✅ Token and user saved after register');
        setToken(response.token);
        setUser(response.user);
        return { success: true };
      }
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error) {
      console.error('[Auth] ❌ Register error:', error);
      return { success: false, message: error.message };
    }
  };

  // --- Logout ---
  const logout = async () => {
    console.log('[Auth] 🚪 logout() called');
    await storage.removeItem('auth_token');
    await storage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    console.log('[Auth] ✅ Logout complete');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);