import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
const _api = 'https://lynx-j8g5.onrender.com/api';
// const _api = 'http://localhost:3000/api';
export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,

  register: async (username, name, email, password) => {
    set({ isLoading: true });
    const signUpMethod = 'signUp Mobile IOS';
    try {
      const res = await fetch(`${_api}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          name,
          email,
          password,
          signUpMethod,
        }),
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
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
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

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const x = await fetch(`${_api}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      const data = await x.json();

      if (!x.ok) throw new Error(data.message || 'Something Went Wrong');

      // Extract JWT token from cookie header
      const cookieHeader = x.headers.get('set-cookie');
      const jwtToken = cookieHeader?.split(';')[0].split('=')[1];

      if (!jwtToken) {
        throw new Error('No JWT token received');
      }

      // Save both user data and JWT token
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
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

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userJSON = await AsyncStorage.getItem('user');
      const user = userJSON ? JSON.parse(userJSON) : null;

      set({ token, user });
    } catch (error) {
      console.log(error);
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      set({ token: null, user: null });
    } catch (error) {
      console.log(error);
    }
  },
}));
