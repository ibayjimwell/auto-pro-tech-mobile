import { Stack, useRouter } from "expo-router";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { View, ActivityIndicator, TouchableOpacity, Text } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons"; // --- Vector Icons for Navigation ---
import "../global.css";

/**
 * --- Custom Liquid-Glass Header Component ---
 * Designed for functional screens (Tracking, Booking, etc.) outside of main tab navigation.
 * Features: High touch-target back buttons, Material typography, and glass dividers.
 */
function CustomStackHeader({ title, canGoBack }) {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View 
      style={{ 
        paddingTop: insets.top, // Dynamic status bar handling
        backgroundColor: theme.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.border + '40', // 25% opacity glass divider
      }}
      className="px-5 pb-4 shadow-sm"
    >
      <View className="flex-row items-center h-14">
        {/* --- Back Navigation Button: Redesigned for better reachability --- */}
        {canGoBack && (
          <TouchableOpacity 
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="w-11 h-11 items-center justify-center rounded-2xl mr-3"
            style={{ backgroundColor: theme.primary + '10' }} // Subtle glow effect
          >
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
        )}

        {/* --- Header Title Branding --- */}
        <View className="flex-1">
          <Text 
            className="text-lg font-black tracking-tight"
            style={{ color: theme.text }}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        {/* --- Decorative Status Indicator (Liquid Theme) --- */}
        <View 
          className="w-2 h-2 rounded-full" 
          style={{ backgroundColor: theme.primary }} 
        />
      </View>
    </View>
  );
}

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  // --- Global Loading State (Redesigned) ---
  if (loading) {
    return (
      <View 
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: theme.background }}
      >
        <View 
          className="p-8 rounded-[40px] shadow-2xl"
          style={{ backgroundColor: theme.surface }}
        >
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        // --- Navigation Transitions & Styles ---
        animation: "slide_from_right",
        contentStyle: { backgroundColor: theme.background },
        // IMPORTANT: We hide the header by default to prevent it showing on Home/Tabs
        headerShown: false,
      }}
    >
      {/* --- Conditional Authentication Routing --- */}
      {!user ? (
        <Stack.Screen 
          name="(auth)" 
          options={{ headerShown: false }} 
        />
      ) : (
        <>
          {/* --- Main Tab Navigation (Home, etc.) --- */}
          {/* We keep headerShown: false here so the Home screen remains clean */}
          <Stack.Screen 
            name="(tabs)" 
            options={{ headerShown: false }} 
          />

          {/* --- Redesigned Functional Screen Headers --- */}
          {/* We explicitly enable headerShown: true and the custom header for these routes */}
          <Stack.Screen 
            name="booking" 
            options={{ 
              headerShown: true,
              title: "Book Appointment",
              header: ({ options, navigation }) => (
                <CustomStackHeader 
                  title={options.title} 
                  canGoBack={navigation.canGoBack()} 
                />
              ),
            }} 
          />
          <Stack.Screen 
            name="appointments" 
            options={{ 
              headerShown: true,
              title: "My Appointments",
              header: ({ options, navigation }) => (
                <CustomStackHeader 
                  title={options.title} 
                  canGoBack={navigation.canGoBack()} 
                />
              ),
            }} 
          />
          <Stack.Screen 
            name="tracking" 
            options={{ 
              headerShown: true,
              title: "Track Repair",
              header: ({ options, navigation }) => (
                <CustomStackHeader 
                  title={options.title} 
                  canGoBack={navigation.canGoBack()} 
                />
              ),
            }} 
          />
          <Stack.Screen 
            name="invoice" 
            options={{ 
              headerShown: true,
              title: "Settlement Invoice",
              header: ({ options, navigation }) => (
                <CustomStackHeader 
                  title={options.title} 
                  canGoBack={navigation.canGoBack()} 
                />
              ),
            }} 
          />
        </>
      )}
    </Stack>
  );
}

/**
 * --- Application Provider Wrapper ---
 */
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