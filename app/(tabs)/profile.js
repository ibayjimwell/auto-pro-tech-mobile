import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

export default function ProfileScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();

  const recentHistory = [
    { id: 1, service: "PMS (Preventive Maintenance)", date: "2024-01-15", status: "COMPLETED", price: "₱3,500" },
    { id: 2, service: "Oil Change", date: "2023-12-10", status: "COMPLETED", price: "₱1,500" },
  ];

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: theme.background }}>
      <View className="px-5 pt-12">
        {/* Profile Header */}
        <View className="items-center mb-6">
          <View className="w-24 h-24 rounded-full bg-primary justify-center items-center mb-3">
            <Text className="text-4xl text-white">JD</Text>
          </View>
          <Text className="text-2xl font-bold" style={{ color: theme.text }}>
            John Doe
          </Text>
          <Text style={{ color: theme.textSecondary }}>Member since Jan 2023</Text>
        </View>

        {/* Contact Info */}
        <View className="flex-row justify-around mb-6">
          <View className="items-center">
            <Ionicons name="mail-outline" size={24} color={theme.primary} />
            <Text className="text-sm mt-1" style={{ color: theme.textSecondary }}>
              john.doe@example.com
            </Text>
          </View>
          <View className="items-center">
            <Ionicons name="call-outline" size={24} color={theme.primary} />
            <Text className="text-sm mt-1" style={{ color: theme.textSecondary }}>
              +63 912 345 6789
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row justify-around mb-6">
          <View className="items-center p-4 rounded-xl flex-1 mr-2" style={{ backgroundColor: theme.surface }}>
            <Text className="text-3xl font-bold" style={{ color: theme.primary }}>
              2
            </Text>
            <Text style={{ color: theme.textSecondary }}>Vehicles</Text>
          </View>
          <View className="items-center p-4 rounded-xl flex-1 ml-2" style={{ backgroundColor: theme.surface }}>
            <Text className="text-3xl font-bold" style={{ color: theme.primary }}>
              2
            </Text>
            <Text style={{ color: theme.textSecondary }}>Visits</Text>
          </View>
        </View>

        {/* Recent History */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-xl font-semibold" style={{ color: theme.text }}>
            Recent History
          </Text>
          <Link href="/history">
            <Text className="text-base font-medium" style={{ color: theme.primary }}>View All</Text>
          </Link>
        </View>

        {recentHistory.map((item) => (
          <View key={item.id} className="p-4 mb-2 rounded-xl" style={{ backgroundColor: theme.surface }}>
            <View className="flex-row justify-between">
              <Text className="text-base font-semibold" style={{ color: theme.text }}>
                {item.service}
              </Text>
              <Text className="text-base font-bold" style={{ color: theme.primary }}>
                {item.price}
              </Text>
            </View>
            <View className="flex-row justify-between mt-1">
              <Text style={{ color: theme.textSecondary }}>{item.date}</Text>
              <Text style={{ color: theme.success }}>{item.status}</Text>
            </View>
          </View>
        ))}

        {/* Settings & Theme Toggle */}
        <View className="mt-6">
          <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-200">
            <Ionicons name="settings-outline" size={24} color={theme.text} />
            <Text className="ml-3 text-base" style={{ color: theme.text }}>
              Settings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center py-4 border-b border-gray-200"
            onPress={toggleTheme}
          >
            <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={24} color={theme.text} />
            <Text className="ml-3 text-base" style={{ color: theme.text }}>
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center py-4">
            <Ionicons name="log-out-outline" size={24} color={theme.error} />
            <Text className="ml-3 text-base" style={{ color: theme.error }}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </View>

    <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 }}>
        <Link href="/login" asChild>
            <TouchableOpacity style={{ padding: 10, backgroundColor: theme.primary, borderRadius: 8 }}>
            <Text style={{ color: '#fff' }}>Go to Login</Text>
            </TouchableOpacity>
        </Link>
        <Link href="/signup" asChild>
            <TouchableOpacity style={{ padding: 10, backgroundColor: theme.accent, borderRadius: 8 }}>
            <Text style={{ color: '#000' }}>Go to Sign Up</Text>
            </TouchableOpacity>
        </Link>
    </View>

    </ScrollView>
  );
}