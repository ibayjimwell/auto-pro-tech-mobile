import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
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

  const loadAppointments = async () => {
    if (!user?.id) return;
    try {
      const res = await appointmentsApi.list({ customerId: user.id, _t: Date.now() });
      const all = res.data || [];
      console.log('All appointments count:', all.length);

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

  const formatTime = (timeStr) => timeStr?.slice(0,5) || '';
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: theme.background }}>
      <View className="px-5 pt-12">
        <Text className="text-2xl font-bold mb-6" style={{ color: theme.text }}>My Appointments</Text>
        {appointments.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons name="calendar-outline" size={64} color={theme.textSecondary} />
            <Text className="mt-4 text-center" style={{ color: theme.textSecondary }}>
              No upcoming appointments
            </Text>
            <TouchableOpacity
              className="mt-4 bg-primary px-6 py-2 rounded-full"
              style={{ backgroundColor: theme.primary }}
              onPress={() => router.push('/booking')}
            >
              <Text className="text-white font-semibold">Book an Appointment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          appointments.map((apt) => (
            <View key={apt.id} className="p-4 mb-4 rounded-xl" style={{ backgroundColor: theme.surface }}>
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Text className="text-lg font-bold" style={{ color: theme.text }}>
                    {apt.serviceType?.name || 'Service'}
                  </Text>
                  <Text className="text-sm" style={{ color: theme.textSecondary }}>
                    {apt.vehicle?.make} {apt.vehicle?.model} • {apt.vehicle?.plateNumber}
                  </Text>
                </View>
                <View className="px-3 py-1 rounded-full" style={{ backgroundColor: theme.success + '20' }}>
                  <Text className="text-xs font-semibold" style={{ color: theme.success }}>{apt.status}</Text>
                </View>
              </View>

              <View className="flex-row items-center mb-3">
                <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
                <Text className="text-sm ml-1 mr-4" style={{ color: theme.textSecondary }}>
                  {formatDate(apt.appointmentDate)}
                </Text>
                <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                <Text className="text-sm ml-1" style={{ color: theme.textSecondary }}>
                  {formatTime(apt.appointmentTime)}
                </Text>
              </View>

              <View className="flex-row justify-end mt-2">
                <TouchableOpacity
                  className="bg-primary px-6 py-2 rounded-full"
                  style={{ backgroundColor: theme.primary }}
                  onPress={() => router.push(`/tracking?appointmentId=${apt.id}`)}
                >
                  <Text className="text-white text-center font-semibold">Track</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}