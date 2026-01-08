import React, { useEffect, useState } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/app/context/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { token, setAuthData } = useAuth();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      const start = Date.now();

      const t = await AsyncStorage.getItem("token");
      const e = await AsyncStorage.getItem("userEmail");
      const n = await AsyncStorage.getItem("userName");

      setAuthData(t, e, n);


      const elapsed = Date.now() - start;
      const remaining = Math.max(2500 - elapsed, 0);

      setTimeout(() => {
        setReady(true);
      }, remaining);
    };

    load();
  }, []);

  useEffect(() => {
    if (!ready) return;

    SplashScreen.hideAsync();

    if (!token) {
      router.replace("/signin");
    }
  }, [ready, token]);

  if (!ready) return null; 

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="signin" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
