import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { Image } from "react-native";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import appointmentsApi from "../../services/appointmentsApi";
import { useEffect } from "react";
import { registerForPushNotificationsAsync } from '../../services/notification';
import pushNotificationApi from '../../services/pushNotificationApi';
import { Platform } from "react-native";

export default function HomeScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pushNification = async () => {
        const token = await registerForPushNotificationsAsync();
        if (token) {
            await pushNotificationApi.registerToken(token, Platform.OS);
        }
    }
  }, []);

  const loadUpcomingAppointment = async () => {
    if (!user?.id) return;
    try {
      const res = await appointmentsApi.list({ customerId: user.id, _t: Date.now() });
      const allAppointments = res.data || [];

      const now = new Date();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const upcoming = allAppointments
        .filter(apt => {
          if (apt.status === 'CANCELLED' || apt.status === 'COMPLETED') return false;
          const aptDate = new Date(apt.appointmentDate);
          if (aptDate < todayMidnight) return false;
          if (aptDate.getTime() === todayMidnight.getTime()) {
            const [hour, minute] = apt.appointmentTime.split(':').map(Number);
            const aptTime = new Date().setHours(hour, minute, 0);
            if (aptTime < now.getTime()) return false;
          }
          return true;
        })
        .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

      setUpcomingAppointment(upcoming[0] || null);
    } catch (error) {
      console.error("Failed to load upcoming appointment", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUpcomingAppointment();
    }, [user?.id])
  );

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.slice(0,5);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: theme.background }}>
      {/* Custom Header */}
      <View className="px-5 pt-12 pb-2 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-bold" style={{ color: theme.text }}>
            Welcome back,
          </Text>
          <Text className="text-3xl font-bold" style={{ color: theme.primary }}>
            {user?.fullName?.split(' ')[0] || 'Customer'}
          </Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} className="p-2">
          <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={28} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Hero Promo Card */}
      <View className="px-5 mt-2">
        <View className="relative rounded-2xl overflow-hidden h-40">
          <Image
            source={{ uri: 'https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=600' }}
            className="absolute w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute w-full h-full bg-black/40" />
          <View className="flex-1 p-5 justify-center">
            <Text className="text-white text-2xl font-bold mb-1">Need Car Service?</Text>
            <Text className="text-white text-sm mb-4 opacity-90">Book your appointment now on AutoProTech!</Text>
            <TouchableOpacity
              className="bg-accent self-start px-6 py-2 rounded-full"
              style={{ backgroundColor: '#FFD700' }}
              onPress={() => router.push('/booking')}
            >
              <Text className="text-black font-bold">Book Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-5 mt-6">
        <Text className="text-xl font-semibold mb-3" style={{ color: theme.text }}>Quick Actions</Text>
        <View className="flex-row justify-between">
          <TouchableOpacity
            className="flex-1 bg-surface mr-2 p-4 rounded-xl items-center"
            style={{ backgroundColor: theme.surface }}
            onPress={() => router.push('/booking')}
          >
            <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: theme.primary + '20' }}>
              <Ionicons name="calendar-outline" size={24} color={theme.primary} />
            </View>
            <Text className="text-sm font-semibold" style={{ color: theme.text }}>Booking</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-surface mx-2 p-4 rounded-xl items-center"
            style={{ backgroundColor: theme.surface }}
            onPress={() => router.push('/tracking?appointmentId=dummy')}
          >
            <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: theme.accent + '20' }}>
              <Ionicons name="location-outline" size={24} color={theme.accent} />
            </View>
            <Text className="text-sm font-semibold" style={{ color: theme.text }}>Tracking</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-surface ml-2 p-4 rounded-xl items-center"
            style={{ backgroundColor: theme.surface }}
            onPress={() => router.push('/invoice')}
          >
            <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: theme.success + '20' }}>
              <Ionicons name="card-outline" size={24} color={theme.success} />
            </View>
            <Text className="text-sm font-semibold" style={{ color: theme.text }}>Payment</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upcoming Appointment */}
      <View className="px-5 mt-6">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-xl font-semibold" style={{ color: theme.text }}>Upcoming Appointment</Text>
          <Link href="/appointments">
            <Text className="text-base font-medium" style={{ color: theme.primary }}>View All</Text>
          </Link>
        </View>

        {loading ? (
          <View className="p-4 rounded-xl items-center" style={{ backgroundColor: theme.surface }}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : upcomingAppointment ? (
          <View className="p-4 rounded-xl" style={{ backgroundColor: theme.surface }}>
            <View className="flex-row justify-between items-start mb-2">
              <View>
                <Text className="text-lg font-bold" style={{ color: theme.text }}>
                  {upcomingAppointment.serviceType?.name || 'Service'}
                </Text>
                <Text className="text-sm" style={{ color: theme.textSecondary }}>
                  {upcomingAppointment.vehicle?.make} {upcomingAppointment.vehicle?.model} • {upcomingAppointment.vehicle?.plateNumber}
                </Text>
              </View>
              <View className="px-3 py-1 rounded-full" style={{ backgroundColor: theme.success + '20' }}>
                <Text className="text-xs font-semibold" style={{ color: theme.success }}>
                  {upcomingAppointment.status}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center mb-3">
              <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
              <Text className="text-sm ml-1 mr-4" style={{ color: theme.textSecondary }}>
                {formatDate(upcomingAppointment.appointmentDate)}
              </Text>
              <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
              <Text className="text-sm ml-1" style={{ color: theme.textSecondary }}>
                {formatTime(upcomingAppointment.appointmentTime)}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-primary py-2 rounded-full mt-2"
              style={{ backgroundColor: theme.primary }}
              onPress={() => router.push(`/tracking?appointmentId=${upcomingAppointment.id}`)}
            >
              <Text className="text-white text-center font-semibold">Track Appointment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="p-4 rounded-xl items-center" style={{ backgroundColor: theme.surface }}>
            <Ionicons name="calendar-outline" size={48} color={theme.textSecondary} />
            <Text className="mt-2 text-center" style={{ color: theme.textSecondary }}>
              No upcoming appointments.{"\n"}Book one now!
            </Text>
            <TouchableOpacity
              className="mt-3 bg-primary px-6 py-2 rounded-full"
              style={{ backgroundColor: theme.primary }}
              onPress={() => router.push('/booking')}
            >
              <Text className="text-white font-semibold">Book Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* My Vehicles */}
      <View className="px-5 mt-6">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-xl font-semibold" style={{ color: theme.text }}>My Vehicles</Text>
          <Link href="/vehicles">
            <Text className="text-base font-medium" style={{ color: theme.primary }}>Manage</Text>
          </Link>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <VehicleCard name="Toyota Vios" plate="ABC 1234" year="2021" theme={theme} />
          <VehicleCard name="Honda Civic" plate="XYZ 5678" year="2022" theme={theme} />
        </ScrollView>
      </View>

      {/* Popular Services */}
      <View className="px-5 mt-6 mb-6">
        <Text className="text-xl font-semibold mb-3" style={{ color: theme.text }}>Popular Services</Text>
        <ServiceCard name="PMS" duration="2 hours" price="₱3,500" theme={theme} />
        <ServiceCard name="Oil Change" duration="45 mins" price="₱1,500" theme={theme} />
        <ServiceCard name="Tire Rotation" duration="30 mins" price="₱800" theme={theme} />
      </View>
    </ScrollView>
  );
}

const VehicleCard = ({ name, plate, year, theme }) => (
  <TouchableOpacity className="mr-3 p-4 rounded-xl w-40" style={{ backgroundColor: theme.surface }}>
    <Text className="text-lg font-bold mb-1" style={{ color: theme.text }}>{name}</Text>
    <Text className="text-sm mb-2" style={{ color: theme.textSecondary }}>{plate} • {year}</Text>
    <View className="flex-row justify-end"><Ionicons name="chevron-forward" size={20} color={theme.textSecondary} /></View>
  </TouchableOpacity>
);

const ServiceCard = ({ name, duration, price, theme }) => (
  <TouchableOpacity className="flex-row justify-between items-center p-4 mb-3 rounded-xl" style={{ backgroundColor: theme.surface }}>
    <View className="flex-1">
      <Text className="text-lg font-bold mb-1" style={{ color: theme.text }}>{name}</Text>
      <Text className="text-sm" style={{ color: theme.textSecondary }}>{duration}</Text>
    </View>
    <View className="flex-row items-center">
      <View className="items-end mr-3">
        <Text className="text-lg font-bold" style={{ color: theme.primary }}>{price}</Text>
        <Text className="text-sm" style={{ color: theme.textSecondary }}>Starting</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
    </View>
  </TouchableOpacity>
);