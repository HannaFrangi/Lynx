import { Platform } from 'react-native';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,

  register: async (username, name, email, password) => {
    set({ isLoading: true });
    const signUpMethod = 'signUp Mobile IOS';

    try {
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, name, email, password, signUpMethod }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Something Went Wrong');

      // Extract JWT token from cookie header
      const cookieHeader = res.headers.get('set-cookie');
      const jwtToken = cookieHeader?.split(';')[0].split('=')[1];

      if (!jwtToken) {
        throw new Error('No JWT token received');
      }

      // Save both user data and JWT token
      await AsyncStorage.setItem('user', JSON.stringify(data));
      await AsyncStorage.setItem('token', jwtToken);

      // Update store state
      set({
        token: jwtToken,
        user: data.user,
      });

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },
}));
