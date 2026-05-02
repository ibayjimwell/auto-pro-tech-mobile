import { Stack } from "expo-router";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

function RootLayoutNav() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#C41E3A" />
      </View>
    );
  }

  if (!user) {
    return (
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="booking" options={{ title: "Book Appointment" }} />
      <Stack.Screen name="services" options={{ title: "Our Services" }} />
      <Stack.Screen name="estimate" options={{ title: "Service Estimate" }} />
      <Stack.Screen name="tracking" options={{ title: "Track Appointment" }} />
      <Stack.Screen name="invoice" options={{ title: "Final Invoice" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}