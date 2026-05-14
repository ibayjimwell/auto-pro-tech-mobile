import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
// Using Expo Vector Icons for consistent Material UI feel
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import appointmentsApi from "../services/appointmentsApi";
import { useRouter } from "expo-router";

// --- Status-based styling config ---
const STATUS_CONFIG = {
  PENDING: {
    icon: "clock-outline",
    color: "#ef4444",
    label: "Pending",
  },
  CONFIRMED: {
    icon: "check-circle-outline",
    color: "#dc2626",
    label: "Confirmed",
  },
  UNDER_INSPECTION: {
    icon: "car-wrench",
    color: "#3b82f6",
    label: "Under Inspection",
  },
  WAITING_FOR_APPROVAL: {
    icon: "clipboard-text-clock",
    color: "#eab308",
    label: "Awaiting Approval",
  },
  IN_PROGRESS: {
    icon: "progress-wrench",
    color: "#f97316",
    label: "In Progress",
  },
  COMPLETED: {
    icon: "check-circle",
    color: "#22c55e",
    label: "Completed",
  },
  CANCELLED: {
    icon: "close-circle",
    color: "#6b7280",
    label: "Cancelled",
  },
};

export default function AllAppointmentsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Logic: Data Fetching & Sorting ---
  const loadAppointments = async () => {
    if (!user?.id) return;
    try {
      const res = await appointmentsApi.list({ customerId: user.id, _t: Date.now() });
      const all = res.data || [];

      const now = new Date();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const upcoming = all.filter(apt => {
        if (apt.status === 'CANCELLED' || apt.status === 'COMPLETED') return false;
        const aptDate = new Date(apt.appointmentDate);
        if (aptDate < todayMidnight) return false;
        if (aptDate.getTime() === todayMidnight.getTime()) {
          const [hour, minute] = apt.appointmentTime.split(':').map(Number);
          const aptTime = new Date().setHours(hour, minute, 0);
          if (aptTime < now.getTime()) return false;
        }
        return true;
      });

      upcoming.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
      setAppointments(upcoming);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [user?.id])
  );

  // --- Helpers: UI Formatting ---
  const formatTime = (timeStr) => timeStr?.slice(0, 5) || '';
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  };

  // --- UI: Loading State ---
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text className="mt-4 font-bold opacity-50" style={{ color: theme.text }}>Updating Schedule...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6 py-6">
          
          {/* --- Section Header --- */}
          <View className="mb-6">
            <Text className="text-sm font-bold uppercase tracking-[2px] opacity-50" style={{ color: theme.text }}>
              Upcoming
            </Text>
            <View className="h-1 w-8 rounded-full mt-1" style={{ backgroundColor: theme.primary }} />
          </View>

          {/* --- Empty State --- */}
          {appointments.length === 0 ? (
            <View className="items-center py-20 px-10 rounded-[40px] border border-dashed" style={{ borderColor: theme.border }}>
              <View className="w-20 h-20 rounded-full items-center justify-center mb-6" style={{ backgroundColor: theme.surface }}>
                <Ionicons name="calendar-clear-outline" size={40} color={theme.textSecondary} />
              </View>
              <Text className="text-lg font-black text-center" style={{ color: theme.text }}>
                No active bookings
              </Text>
              <Text className="mt-2 text-center text-sm font-medium opacity-60 leading-5" style={{ color: theme.textSecondary }}>
                Looks like your calendar is clear. Need a checkup or an oil change?
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                className="mt-8 px-10 py-4 rounded-2xl shadow-lg"
                style={{ backgroundColor: theme.primary, shadowColor: theme.primary }}
                onPress={() => router.push('/booking')}
              >
                <Text className="text-white font-black uppercase tracking-widest text-xs">Book Appointment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // --- Appointment List ---
            appointments.map((apt) => {
              const statusConfig = getStatusConfig(apt.status);
              const iconColor = statusConfig.color;
              const badgeBg = statusConfig.color + '20';

              return (
                <TouchableOpacity
                  key={apt.id}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/tracking?appointmentId=${apt.id}`)}
                  className="p-5 mb-5 rounded-[28px] border shadow-sm shadow-black/5"
                  style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                >
                  {/* Card Top Section */}
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-row items-center flex-1">
                      <View
                        className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                        style={{ backgroundColor: badgeBg }}
                      >
                        <MaterialCommunityIcons name={statusConfig.icon} size={26} color={iconColor} />
                      </View>
                      <View className="flex-1 mr-2">
                        <Text
                          className="text-lg font-black"
                          style={{ color: theme.text }}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {apt.serviceType?.name || 'Service'}
                        </Text>
                        <Text className="text-xs font-bold opacity-50" style={{ color: theme.text }}>
                          {apt.vehicle?.make} {apt.vehicle?.model}
                        </Text>
                      </View>
                    </View>

                    {/* Status Badge */}
                    <View className="px-3 py-1 rounded-lg flex-shrink-0" style={{ backgroundColor: badgeBg }}>
                      <Text className="text-[10px] font-black" style={{ color: iconColor }}>
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>

                  {/* Card Bottom: Divider + Date/Time */}
                  <View className="flex-row items-center justify-between pt-4 border-t" style={{ borderColor: theme.border }}>
                    <View className="flex-row items-center flex-1">
                      <View className="flex-row items-center mr-4">
                        <Ionicons name="calendar-clear" size={14} color={iconColor} />
                        <Text className="text-[13px] ml-1.5 font-bold" style={{ color: theme.textSecondary }}>
                          {formatDate(apt.appointmentDate)}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="time" size={14} color={iconColor} />
                        <Text className="text-[13px] ml-1.5 font-bold" style={{ color: theme.textSecondary }}>
                          {formatTime(apt.appointmentTime)}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* --- Quick Floating Action --- */}
      {appointments.length > 0 && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push('/booking')}
          className="absolute bottom-10 right-6 w-16 h-16 rounded-full items-center justify-center shadow-xl shadow-primary/40"
          style={{ backgroundColor: theme.primary }}
        >
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}