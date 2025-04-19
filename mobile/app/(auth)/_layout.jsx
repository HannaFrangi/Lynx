import { Stack } from 'expo-router';
import { Toaster } from 'sonner-native';

export default function AuthLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
