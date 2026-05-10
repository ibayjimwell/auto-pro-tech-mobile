import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
// Using Expo Vector Icons for consistent Material UI feel
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import appointmentsApi from "../../services/appointmentsApi";
import { useRouter } from "expo-router";

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
      {/* --- Custom Header --- */}
      <View className="px-6 pt-14 pb-6 flex-row items-center justify-between">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center border"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text className="text-xl font-black" style={{ color: theme.text }}>Schedule</Text>
        <View className="w-10" /> 
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6">
          
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
            appointments.map((apt) => (
              <View 
                key={apt.id} 
                className="p-5 mb-5 rounded-[32px] border shadow-sm shadow-black/5" 
                style={{ backgroundColor: theme.surface, borderColor: theme.border }}
              >
                {/* Card Top Section */}
                <View className="flex-row justify-between items-start mb-5">
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: theme.primary + '10' }}>
                      <MaterialCommunityIcons name="car-settings" size={26} color={theme.primary} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-black" style={{ color: theme.text }}>
                        {apt.serviceType?.name || 'Service'}
                      </Text>
                      <Text className="text-[11px] font-bold uppercase tracking-tighter opacity-50" style={{ color: theme.text }}>
                        {apt.vehicle?.make} {apt.vehicle?.model} • {apt.vehicle?.plateNumber}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Status Badge */}
                  <View className="px-3 py-1.5 rounded-xl" style={{ backgroundColor: theme.success + '15' }}>
                    <Text className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.success }}>
                      {apt.status}
                    </Text>
                  </View>
                </View>

                {/* Card Details Divider */}
                <View className="h-[1px] w-full mb-5 opacity-10" style={{ backgroundColor: theme.text }} />

                {/* Card Bottom: Date/Time & Action */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="flex-row items-center mr-5">
                      <Ionicons name="calendar-clear" size={14} color={theme.primary} />
                      <Text className="text-sm ml-1.5 font-bold" style={{ color: theme.textSecondary }}>
                        {formatDate(apt.appointmentDate)}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="time" size={14} color={theme.primary} />
                      <Text className="text-sm ml-1.5 font-bold" style={{ color: theme.textSecondary }}>
                        {formatTime(apt.appointmentTime)}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    className="w-12 h-12 rounded-2xl items-center justify-center shadow-md"
                    style={{ backgroundColor: theme.primary, shadowColor: theme.primary }}
                    onPress={() => router.push(`/tracking?appointmentId=${apt.id}`)}
                  >
                    <Ionicons name="compass" size={22} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
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