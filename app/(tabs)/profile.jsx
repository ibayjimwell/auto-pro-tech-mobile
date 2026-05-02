import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import Modal from "react-native-modal";
import customersApi from "../../services/customersApi";
import pushNotificationApi from '../../services/pushNotificationApi';

export default function ProfileScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ vehicles: 0, visits: 0 });
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      try {
        const vehiclesRes = await customersApi.getVehiclesByCustomer(user.id);
        const appointmentsRes = await customersApi.getCustomerAppointments(user.id);
        setStats({
          vehicles: vehiclesRes.data?.length || 0,
          visits: appointmentsRes.data?.length || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    setShowLogoutModal(false);
    try {
      await logout();
      await pushNotificationApi.unregisterToken(token);
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Show error feedback (you can use a toast or inline message)
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const initials = user?.fullName
    ? user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "JD";

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Jan 2023";

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: theme.background }}>
      <View className="px-5 pt-12">
        {/* Profile Header */}
        <View className="items-center mb-6">
          <View
            className="w-24 h-24 rounded-full justify-center items-center mb-3"
            style={{ backgroundColor: theme.primary }}
          >
            <Text className="text-4xl text-white">{initials}</Text>
          </View>
          <Text className="text-2xl font-bold" style={{ color: theme.text }}>
            {user?.fullName || "User"}
          </Text>
          <Text style={{ color: theme.textSecondary }}>Member since {joinDate}</Text>
        </View>

        {/* Contact Info */}
        <View className="flex-row justify-around mb-6">
          <View className="items-center">
            <Ionicons name="mail-outline" size={24} color={theme.primary} />
            <Text className="text-sm mt-1" style={{ color: theme.textSecondary }}>
              {user?.email || "No email"}
            </Text>
          </View>
          <View className="items-center">
            <Ionicons name="call-outline" size={24} color={theme.primary} />
            <Text className="text-sm mt-1" style={{ color: theme.textSecondary }}>
              {user?.phone || "No phone"}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row justify-around mb-6">
          <View className="items-center p-4 rounded-xl flex-1 mr-2" style={{ backgroundColor: theme.surface }}>
            <Text className="text-3xl font-bold" style={{ color: theme.primary }}>
              {stats.vehicles}
            </Text>
            <Text style={{ color: theme.textSecondary }}>Vehicles</Text>
          </View>
          <View className="items-center p-4 rounded-xl flex-1 ml-2" style={{ backgroundColor: theme.surface }}>
            <Text className="text-3xl font-bold" style={{ color: theme.primary }}>
              {stats.visits}
            </Text>
            <Text style={{ color: theme.textSecondary }}>Visits</Text>
          </View>
        </View>

        {/* Recent History (placeholder) */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-xl font-semibold" style={{ color: theme.text }}>
            Recent History
          </Text>
          <TouchableOpacity onPress={() => router.push("/history")}>
            <Text className="text-base font-medium" style={{ color: theme.primary }}>View All</Text>
          </TouchableOpacity>
        </View>

        <View className="p-4 mb-2 rounded-xl" style={{ backgroundColor: theme.surface }}>
          <View className="flex-row justify-between">
            <Text className="text-base font-semibold" style={{ color: theme.text }}>
              PMS (Preventive Maintenance)
            </Text>
            <Text className="text-base font-bold" style={{ color: theme.primary }}>
              ₱3,500
            </Text>
          </View>
          <View className="flex-row justify-between mt-1">
            <Text style={{ color: theme.textSecondary }}>2024-01-15</Text>
            <Text style={{ color: theme.success }}>COMPLETED</Text>
          </View>
        </View>

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

          <TouchableOpacity
            className="flex-row items-center py-4"
            onPress={() => setShowLogoutModal(true)}
            disabled={loggingOut}
          >
            <Ionicons name="log-out-outline" size={24} color={theme.error} />
            <Text className="ml-3 text-base" style={{ color: theme.error }}>
              {loggingOut ? "Logging out..." : "Logout"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        isVisible={showLogoutModal}
        onBackdropPress={() => setShowLogoutModal(false)}
        backdropOpacity={0.6}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <View className="bg-white rounded-2xl p-6" style={{ backgroundColor: theme.surface }}>
          <Text className="text-xl font-bold mb-2" style={{ color: theme.text }}>
            Logout
          </Text>
          <Text className="text-base mb-6" style={{ color: theme.textSecondary }}>
            Are you sure you want to logout?
          </Text>
          <View className="flex-row justify-end gap-3">
            <TouchableOpacity
              className="px-4 py-2 rounded-lg mr-2"
              onPress={() => setShowLogoutModal(false)}
            >
              <Text className="font-semibold" style={{ color: theme.textSecondary }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: theme.error }}
              onPress={handleLogoutConfirm}
            >
              <Text className="text-white font-semibold">Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}