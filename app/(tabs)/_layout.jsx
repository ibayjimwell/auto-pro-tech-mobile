import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, TouchableOpacity, Dimensions, Platform } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

/**
 * --- Custom Tab Bar Component ---
 * Rebuilt with "Liquid Glass" aesthetics: transparency, glass borders, and glow effects.
 */
function CustomTabBar({ state, descriptors, navigation, theme }) {
  return (
    <View 
      className="absolute bottom-8 self-center flex-row items-center justify-around rounded-[32px] px-3"
      style={{ 
        // --- Liquid Glass Container ---
        backgroundColor: theme.surface + 'B3', // Transparent glass (70% opacity)
        width: width * 0.90,
        height: 64,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)', // Light glass border for shine
        overflow: 'hidden',
        ...Platform.select({
          ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15 },
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

        // --- Logic: Icon Mapping ---
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

        // --- UI Pieces: Liquid Highlight Style ---
        const animatedPillStyle = useAnimatedStyle(() => {
          return {
            // Liquid glow effect using primary color with low opacity
            backgroundColor: withTiming(isFocused ? theme.primary + '25' : 'transparent', { duration: 200 }),
            transform: [
              { scale: withSpring(isFocused ? 1.1 : 0.8, { damping: 15, stiffness: 150 }) }
            ],
            opacity: withTiming(isFocused ? 1 : 0, { duration: 150 })
          };
        });

        // --- UI Pieces: Active Icon Animation ---
        const animatedIconStyle = useAnimatedStyle(() => {
          return {
            transform: [
                { scale: withSpring(isFocused ? 1.15 : 1, { damping: 12 }) },
                { translateY: withTiming(isFocused ? -2 : 0, { duration: 200 }) }
            ]
          };
        });

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.6}
            className="items-center justify-center flex-1 h-full"
          >
            <View className="items-center justify-center w-full h-full">
              {/* --- Liquid Glow Layer --- */}
              <Animated.View 
                className="absolute w-14 h-10 rounded-2xl"
                style={[
                    animatedPillStyle,
                    { shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 10 }
                ]}
              />

              {/* --- Icon Layer (Fixed to Primary Red) --- */}
              <Animated.View style={animatedIconStyle}>
                <Ionicons 
                  name={getIcon(route.name, isFocused)} 
                  size={24} 
                  color={isFocused ? theme.primary : theme.textSecondary} 
                />
              </Animated.View>
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
      // --- Integration: Custom Glass UI ---
      tabBar={(props) => <CustomTabBar {...props} theme={theme} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: { 
            position: 'absolute', 
            backgroundColor: 'transparent', 
            borderTopWidth: 0,
            elevation: 0,
        },
        // Fast, normal cross-fade
        animation: 'fade',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home" }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{ title: "Vehicles" }}
      />
      <Tabs.Screen
        name="services"
        options={{ title: "Services" }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile" }}
      />
    </Tabs>
  );
}