import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isDark } = useTheme();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    };
    prepare();
  }, []);

  if (!appReady) {
    return <View style={{ flex: 1, backgroundColor: '#000000' }} />;
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor="#000000" translucent={false}/>
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDark ? '#0F0F14' : '#F2F2F7' },
        animation: 'slide_from_right',
      }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="otp" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="provider-home" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="chatroom" />
        <Stack.Screen name="post" />
        <Stack.Screen name="alerts" />
        <Stack.Screen name="customer-profile" />
        <Stack.Screen name="provider-profile" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="edit-provider-profile" />
        <Stack.Screen name="my-requests" />
        <Stack.Screen name="my-jobs" />
        <Stack.Screen name="reviews" />
        <Stack.Screen name="payment-settings" />
        <Stack.Screen name="privacy-settings" />
        <Stack.Screen name="help-support" />
        <Stack.Screen name="notifications-settings" />
        <Stack.Screen name="performance" />
        <Stack.Screen name="refer-earn" />
        <Stack.Screen name="blocked-users" />
        <Stack.Screen name="report-problem" />
        <Stack.Screen name="terms-of-service" />
        <Stack.Screen name="privacy-policy" />
        <Stack.Screen name="send-offer" />
        <Stack.Screen name="appearance" />
        <Stack.Screen name="job-checkin" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}
