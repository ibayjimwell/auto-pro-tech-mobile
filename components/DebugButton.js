import React from 'react';
import { TouchableOpacity, Text, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/AuthContext';

export default function DebugButton() {
  const { token, user } = useAuth();

  const checkStorage = async () => {
    let rawToken = null;
    let rawUser = null;
    try {
      if (Platform.OS === 'web') {
        rawToken = await AsyncStorage.getItem('auth_token');
        rawUser = await AsyncStorage.getItem('auth_user');
      } else {
        rawToken = await SecureStore.getItemAsync('auth_token');
        rawUser = await SecureStore.getItemAsync('auth_user');
      }
    } catch (err) {
      console.error('DebugButton storage read error:', err);
    }

    Alert.alert(
      '🔐 Auth Debug Info',
      `Context token: ${token ? '✅ YES' : '❌ NO'}\n` +
      `Context user: ${user ? user.fullName || 'YES' : 'NO'}\n` +
      `Storage token: ${rawToken ? '✅ YES' : '❌ NO'}\n` +
      `Storage user: ${rawUser ? '✅ YES' : '❌ NO'}\n` +
      `Platform: ${Platform.OS}`
    );
  };

  return (
    <TouchableOpacity
      onPress={checkStorage}
      style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#ff4444',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 30,
        zIndex: 999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>🐞 DEBUG</Text>
    </TouchableOpacity>
  );
}