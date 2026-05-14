import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import Modal from "react-native-modal";
import customersApi from "../../services/customersApi";
import appointmentsApi from "../../services/appointmentsApi";
import pushNotificationApi from '../../services/pushNotificationApi';

// --- Status color map (matches STATUS_CONFIG in other files) ---
const STATUS_COLORS = {
  COMPLETED: "#22c55e",
  IN_PROGRESS: "#f97316",
  UNDER_INSPECTION: "#3b82f6",
  WAITING_FOR_APPROVAL: "#eab308",
};

export default function ProfileScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ vehicles: 0, visits: 0 });
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // --- Helpers ---
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return '';
    return `₱${Number(price).toLocaleString()}`;
  };

  // --- Logic: Fetch Stats & Recent History ---
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) return;
      try {
        const res = await customersApi.getStats(user.id);
        const data = res.data?.data || res.data || {};
        setStats({
          vehicles: data.vehicleCount || 0,
          visits: data.visitCount || 0,
        });
        setCompletedAppointments(data.recentCompleted || []);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [user]);

  // --- Logic: Logout Handler (Functionality Preserved) ---
  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    setShowLogoutModal(false);
    try {
      await logout();
      if (typeof token !== 'undefined') {
          await pushNotificationApi.unregisterToken(token);
      }
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  // --- Design Helpers ---
  const initials = user?.fullName
    ? user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "JD";

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Jan 2023";

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
        className="flex-1 pb-10" 
        style={{ backgroundColor: theme.background }}
        showsVerticalScrollIndicator={false}
    >
      <View className="px-6 pt-16 pb-12">
        
        {/* --- Profile Header Section --- */}
        <View className="items-center mb-10">
          <View 
            className="w-28 h-28 rounded-[40px] justify-center items-center mb-5 shadow-xl shadow-primary/30"
            style={{ backgroundColor: theme.primary, transform: [{ rotate: '-4deg' }] }}
          >
            <View style={{ transform: [{ rotate: '4deg' }] }}>
                <Text className="text-4xl font-black text-white italic tracking-tighter">{initials}</Text>
            </View>
            {/* Decorative element */}
            <View className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-4 items-center justify-center" style={{ borderColor: theme.background }}>
                <Ionicons name="checkmark" size={14} color="white" />
            </View>
          </View>
          
          <Text className="text-3xl font-black tracking-tight" style={{ color: theme.text }}>
            {user?.fullName || "User"}
          </Text>
          <View className="flex-row items-center mt-1">
            <Ionicons name="calendar-outline" size={12} color={theme.textSecondary} />
            <Text className="text-xs font-bold ml-1 opacity-50 uppercase tracking-widest" style={{ color: theme.textSecondary }}>
              Member since {joinDate}
            </Text>
          </View>
        </View>

        {/* --- Contact Info Grid --- */}
        <View className="flex-row gap-3 mb-8">
            <View className="flex-1 p-4 rounded-3xl border" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <Ionicons name="mail-unread-outline" size={20} color={theme.primary} />
                <Text className="text-[10px] font-black uppercase opacity-40 mt-2 mb-0.5" style={{ color: theme.text }}>Email</Text>
                <Text className="text-xs font-bold truncate" numberOfLines={1} style={{ color: theme.text }}>{user?.email || "No email"}</Text>
            </View>
            <View className="flex-1 p-4 rounded-3xl border" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                <Ionicons name="phone-portrait-outline" size={20} color={theme.primary} />
                <Text className="text-[10px] font-black uppercase opacity-40 mt-2 mb-0.5" style={{ color: theme.text }}>Phone</Text>
                <Text className="text-xs font-bold" style={{ color: theme.text }}>{user?.phone || "No phone"}</Text>
            </View>
        </View>

        {/* --- Statistics Cards --- */}
        <View className="flex-row gap-4 mb-10">
          <View 
            className="flex-1 p-6 rounded-[32px] items-center border" 
            style={{ backgroundColor: theme.surface, borderColor: theme.border }}
          >
            <MaterialCommunityIcons name="car-multiple" size={24} color={theme.primary} />
            <Text className="text-3xl font-black mt-2" style={{ color: theme.text }}>{stats.vehicles}</Text>
            <Text className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: theme.textSecondary }}>Vehicles</Text>
          </View>
          <View 
            className="flex-1 p-6 rounded-[32px] items-center border" 
            style={{ backgroundColor: theme.surface, borderColor: theme.border }}
          >
            <MaterialCommunityIcons name="calendar-check-outline" size={24} color={theme.primary} />
            <Text className="text-3xl font-black mt-2" style={{ color: theme.text }}>{stats.visits}</Text>
            <Text className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: theme.textSecondary }}>Service Visits</Text>
          </View>
        </View>

        {/* --- Recent History Preview --- */}
        <View className="flex-row justify-between items-end mb-5 px-1">
          <View>
            <Text className="text-[10px] font-black uppercase tracking-[2px] opacity-40 mb-1" style={{ color: theme.text }}>Activity</Text>
            <Text className="text-xl font-black" style={{ color: theme.text }}>Recent History</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/history")}>
            <Text className="text-sm font-black" style={{ color: theme.primary }}>View All</Text>
          </TouchableOpacity>
        </View>

        {completedAppointments.length === 0 ? (
          <View className="p-8 mb-10 rounded-[28px] border border-dashed items-center" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <Ionicons name="time-outline" size={32} color={theme.textSecondary} />
            <Text className="mt-3 text-sm font-bold opacity-60" style={{ color: theme.textSecondary }}>No completed services yet</Text>
          </View>
        ) : (
          completedAppointments.map((apt) => (
            <TouchableOpacity 
              key={apt.id}
              activeOpacity={0.8}
              onPress={() => router.push(`/tracking?appointmentId=${apt.id}`)}
              className="p-5 mb-3 rounded-[28px] border shadow-sm" 
              style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-4">
                    <View className="px-2 py-0.5 rounded-md self-start mb-2" style={{ backgroundColor: STATUS_COLORS.COMPLETED + '15' }}>
                        <Text className="text-[9px] font-black uppercase tracking-tight" style={{ color: STATUS_COLORS.COMPLETED }}>COMPLETED</Text>
                    </View>
                    <Text className="text-base font-black mb-1" style={{ color: theme.text }}>
                      {apt.serviceType?.name || 'Service'}
                    </Text>
                    <View className="flex-row items-center">
                        <Ionicons name="calendar-outline" size={12} color={theme.textSecondary} />
                        <Text className="text-xs font-medium ml-1 opacity-60" style={{ color: theme.textSecondary }}>{formatDate(apt.appointmentDate)}</Text>
                    </View>
                    <Text className="text-[10px] font-bold mt-1 opacity-40 uppercase" style={{ color: theme.text }}>
                      {apt.vehicle?.make} {apt.vehicle?.model}
                    </Text>
                </View>
                <Text className="text-lg font-black" style={{ color: theme.primary }}>₱{Number(apt.serviceType?.basePrice || 0).toLocaleString()}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* --- Settings Menu List --- */}
        <View className="rounded-[32px] overflow-hidden border" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
          <TouchableOpacity 
            className="flex-row items-center justify-between p-5 border-b" 
            style={{ borderBottomColor: theme.border }}
          >
            <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: theme.background }}>
                    <Ionicons name="settings-outline" size={20} color={theme.text} />
                </View>
                <Text className="text-sm font-black" style={{ color: theme.text }}>Account Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center justify-between p-5 border-b" 
            style={{ borderBottomColor: theme.border }}
            onPress={toggleTheme}
          >
            <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: theme.background }}>
                    <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={20} color={theme.text} />
                </View>
                <Text className="text-sm font-black" style={{ color: theme.text }}>
                  {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                </Text>
            </View>
            <View className={`w-10 h-5 rounded-full px-1 justify-center ${isDarkMode ? 'bg-primary' : 'bg-gray-300'}`}>
                <View className={`w-3 h-3 rounded-full bg-white ${isDarkMode ? 'self-end' : 'self-start'}`} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center p-5"
            onPress={() => setShowLogoutModal(true)}
            disabled={loggingOut}
          >
            <View className="w-10 h-10 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: theme.error + '10' }}>
                <Ionicons name="log-out-outline" size={20} color={theme.error} />
            </View>
            <Text className="text-sm font-black" style={{ color: theme.error }}>
              {loggingOut ? "Logging out..." : "Sign Out"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <Text className="text-center mt-10 text-[10px] font-bold opacity-20 uppercase tracking-widest" style={{ color: theme.text }}>
            Garage Hub v2.0.4 • 2026
        </Text>
      </View>

      {/* --- Rebuilt Logout Modal (Material Style) --- */}
      <Modal
        isVisible={showLogoutModal}
        onBackdropPress={() => setShowLogoutModal(false)}
        backdropOpacity={0.4}
        animationIn="zoomIn"
        animationOut="zoomOut"
        useNativeDriver
      >
        <View className="p-8 rounded-[40px] items-center" style={{ backgroundColor: theme.surface }}>
          <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-6">
            <Ionicons name="power" size={32} color={theme.error} />
          </View>
          
          <Text className="text-2xl font-black text-center mb-2" style={{ color: theme.text }}>
            Sign Out
          </Text>
          <Text className="text-sm font-medium text-center mb-8 opacity-60 leading-5" style={{ color: theme.textSecondary }}>
            Are you sure you want to end your session? You'll need to sign back in to book services.
          </Text>
          
          <View className="flex-row gap-3 w-full">
            <TouchableOpacity
              className="flex-1 h-14 rounded-2xl items-center justify-center border"
              style={{ borderColor: theme.border }}
              onPress={() => setShowLogoutModal(false)}
            >
              <Text className="font-black uppercase tracking-widest text-xs" style={{ color: theme.textSecondary }}>
                Stay
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-1 h-14 rounded-2xl items-center justify-center shadow-lg shadow-red-500/20"
              style={{ backgroundColor: theme.error }}
              onPress={handleLogoutConfirm}
            >
              <Text className="text-white font-black uppercase tracking-widest text-xs">
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}