import { Stack } from "expo-router";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider } from "../context/AuthContext";
import "../global.css";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="booking" options={{ title: "Book Appointment" }} />
          <Stack.Screen name="services" options={{ title: "Our Services" }} />
          <Stack.Screen name="estimate" options={{ title: "Service Estimate" }} />
          <Stack.Screen name="tracking" options={{ title: "Track Appointment" }} />
          <Stack.Screen name="invoice" options={{ title: "Final Invoice" }} />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}