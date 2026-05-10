import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, TouchableOpacity, Dimensions, Platform } from "react-native";
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

/**
 * --- Custom Tab Bar Component ---
 * Rebuilds the UI to support transparency, floating effects, and custom animations.
 * [Logic Unchanged, UI Completely Redesigned]
 */
function CustomTabBar({ state, descriptors, navigation, theme }) {
  return (
    <View 
      className="absolute bottom-6 self-center flex-row items-center justify-around rounded-[32px] px-2 shadow-2xl"
      style={{ 
        backgroundColor: theme.surface + 'E6', // Semi-transparent glass effect
        width: width * 0.92,
        height: 70,
        borderWidth: 1,
        borderColor: theme.border,
        ...Platform.select({
          ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
          android: { elevation: 10 }
        })
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // --- Icon Logic ---
        const getIcon = (routeName, focused) => {
          const icons = {
            index: focused ? "grid" : "grid-outline",
            vehicles: focused ? "car-sport" : "car-sport-outline",
            profile: focused ? "person" : "person-outline",
            booking: focused ? "calendar" : "calendar-outline",
            services: focused ? "construct" : "construct-outline",
            estimate: focused ? "calculator" : "calculator-outline",
            tracking: focused ? "map" : "map-outline",
            invoice: focused ? "receipt" : "receipt-outline",
          };
          return icons[routeName] || "help-circle-outline";
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            className="items-center justify-center"
          >
            {/* --- Active Indicator (Pill Animation Effect) --- */}
            <View 
              className="items-center justify-center rounded-2xl"
              style={{
                width: 48,
                height: 48,
                backgroundColor: isFocused ? theme.primary : 'transparent',
                // Subtle scale effect when active
                transform: [{ scale: isFocused ? 1.1 : 1 }]
              }}
            >
              <Ionicons 
                name={getIcon(route.name, isFocused)} 
                size={22} 
                color={isFocused ? "#FFFFFF" : theme.textSecondary} 
              />
              
              {/* --- Dot Indicator for Inactive --- */}
              {isFocused && (
                <View 
                  className="absolute -bottom-1 w-1 h-1 rounded-full bg-white" 
                />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      // --- Custom Tab Bar Integration ---
      tabBar={(props) => <CustomTabBar {...props} theme={theme} />}
      screenOptions={{
        headerShown: false,
        // Ensure content doesn't overlap with the floating navbar
        tabBarShowLabel: false,
        tabBarStyle: { position: 'absolute', backgroundColor: 'transparent', borderTopWidth: 0 },
      }}
    >
      {/* --- Main Navigation Hubs --- */}
      <Tabs.Screen
        name="index"
        options={{ title: "Home" }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{ title: "Vehicles" }}
      />
      
      {/* --- Service & Diagnostic Tools --- */}
      <Tabs.Screen
        name="services"
        options={{ title: "Services" }}
      />
      <Tabs.Screen
        name="booking"
        options={{ title: "Booking" }}
      />
      <Tabs.Screen
        name="estimate"
        options={{ title: "Estimate" }}
      />
      <Tabs.Screen
        name="tracking"
        options={{ title: "Tracking" }}
      />
      <Tabs.Screen
        name="invoice"
        options={{ title: "Invoice" }}
      />
      
      {/* --- Identity --- */}
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile" }}
      />
    </Tabs>
  );
}