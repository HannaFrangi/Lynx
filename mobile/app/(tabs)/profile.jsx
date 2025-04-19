import { View, Text, Touchable, TouchableOpacity } from 'react-native';
import React from 'react';
import { useAuthStore } from '../../store/authStore';

export default function profile() {
  const { logout } = useAuthStore();
  return (
    <View>
      <Text>profile</Text>
      <TouchableOpacity onPress={() => logout()}>
        <Text>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
