import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Platform } from "react-native";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useState, useCallback, useEffect } from "react";
import appointmentsApi from "../../services/appointmentsApi";

export default function HomeScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [underInspectionAppointments, setUnderInspectionAppointments] = useState([]);
  const [inProgressAppointments, setInProgressAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Logic: Load Data ---
  const loadUpcomingAppointment = async () => {
    if (!user?.id) return;
    try {
      const res = await appointmentsApi.list({ customerId: user.id, _t: Date.now() });
      const allAppointments = res.data || [];
      const now = new Date();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const upcoming = allAppointments
        .filter(apt => {
          if (apt.status !== 'CONFIRMED') return false;
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

      const underInspection = allAppointments.filter(apt => apt.status === 'UNDER_INSPECTION');
      const inProgress = allAppointments.filter(apt => apt.status === 'IN_PROGRESS');
      setUnderInspectionAppointments(underInspection);
      setInProgressAppointments(inProgress);
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

  // --- Helpers: Formatting ---
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <ScrollView 
      className="flex-1 pb-10" 
      style={{ backgroundColor: theme.background }}
      showsVerticalScrollIndicator={false}
    >
      {/* --- Section: Header & Greeting --- */}
      <View className="px-6 pt-14 pb-6 flex-row justify-between items-center">
        <View>
          <Text className="text-sm font-bold uppercase tracking-widest opacity-60" style={{ color: theme.text }}>
            Welcome back
          </Text>
          <Text className="text-3xl font-black" style={{ color: theme.text }}>
            {user?.fullName?.split(' ')[0] || 'Customer'}
            <Text style={{ color: theme.primary }}>.</Text>
          </Text>
        </View>
        <TouchableOpacity 
          onPress={toggleTheme} 
          className="w-12 h-12 rounded-2xl items-center justify-center border"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* --- Section: Hero Promo Card --- */}
      <View className="px-6">
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => router.push('/booking')}
          className="relative rounded-[32px] overflow-hidden h-48 shadow-xl shadow-black/20"
        >
          <Image
            source={{ uri: 'https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=600' }}
            className="absolute w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute w-full h-full bg-black/50" />
          <View className="flex-1 p-7 justify-center">
            <View className="bg-white/20 self-start px-3 py-1 rounded-lg mb-2">
              <Text className="text-white text-[10px] font-bold uppercase tracking-tighter">the shop is open</Text>
            </View>
            <Text className="text-white text-2xl font-black mb-1 leading-7"><Text style={{ color: theme.primary }}>Auto</Text>Care {"\n"}PMS & Checkup</Text>
            <Text className="text-white text-xs mb-4 opacity-80 font-medium">Keep your engine running smooth.</Text>
            <View 
              className="self-start px-6 py-2.5 rounded-xl flex-row items-center"
              style={{ backgroundColor: '#FFD700' }}
            >
              <Text className="text-black font-black text-sm mr-2">Book Now</Text>
              <Ionicons name="arrow-forward" size={16} color="black" />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* --- Section: Quick Actions --- */}
      <View className="px-6 mt-8">
        <Text className="text-lg font-black mb-4 px-1" style={{ color: theme.text }}>Services</Text>
        <View className="flex-row justify-between">
          <ActionItem 
            icon="calendar" 
            label="Booking" 
            color={theme.primary} 
            theme={theme} 
            onPress={() => router.push('/booking')} 
          />
          <ActionItem 
            icon="location" 
            label="Tracking" 
            color="#6366f1" 
            theme={theme} 
            onPress={() => router.push('/tracking?appointmentId=dummy')} 
          />
          <ActionItem 
            icon="receipt" 
            label="Payment" 
            color="#10b981" 
            theme={theme} 
            onPress={() => router.push('/invoice')} 
          />
        </View>
      </View>

      {/* --- Section: Upcoming Appointment --- */}
      <View className="px-6 mt-8">
        <View className="flex-row justify-between items-end mb-4 px-1">
          <Text className="text-lg font-black" style={{ color: theme.text }}>Schedule</Text>
          <Link href="/appointments">
            <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.primary }}>View All</Text>
          </Link>
        </View>

        {loading ? (
          <View className="h-32 rounded-3xl items-center justify-center border border-dashed" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : upcomingAppointment ? (
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push(`/tracking?appointmentId=${upcomingAppointment.id}`)}
            className="p-5 rounded-[28px] border" 
            style={{ backgroundColor: theme.surface, borderColor: theme.border }}
          >
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: theme.primary + '15' }}>
                  <MaterialCommunityIcons name="car-cog" size={26} color={theme.primary} />
                </View>
                <View>
                  <Text className="text-lg font-black" style={{ color: theme.text }}>
                    {upcomingAppointment.serviceType?.name || 'Service'}
                  </Text>
                  <Text className="text-xs font-bold opacity-50" style={{ color: theme.text }}>
                    {upcomingAppointment.vehicle?.make} {upcomingAppointment.vehicle?.model}
                  </Text>
                </View>
              </View>
              <View className="px-3 py-1 rounded-lg" style={{ backgroundColor: theme.primary + '20' }}>
                <Text className="text-[10px] font-black" style={{ color: theme.primary }}>{upcomingAppointment.status}</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <View className="flex-row">
                <View className="flex-row items-center mr-4">
                  <Ionicons name="calendar-clear" size={14} color={theme.primary} />
                  <Text className="text-[13px] ml-1.5 font-bold" style={{ color: theme.textSecondary }}>
                    {formatDate(upcomingAppointment.appointmentDate)}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="time" size={14} color={theme.primary} />
                  <Text className="text-[13px] ml-1.5 font-bold" style={{ color: theme.textSecondary }}>
                    {formatTime(upcomingAppointment.appointmentTime)}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>
        ) : (
          <View className="p-8 rounded-[28px] items-center border border-dashed" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <View className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-900 items-center justify-center mb-4">
              <Ionicons name="calendar-outline" size={32} color={theme.textSecondary} />
            </View>
            <Text className="text-center font-bold mb-4" style={{ color: theme.textSecondary }}>
              No active bookings.
            </Text>
            <TouchableOpacity
              className="px-8 py-3 rounded-2xl"
              style={{ backgroundColor: theme.primary }}
              onPress={() => router.push('/booking')}
            >
              <Text className="text-white font-black text-xs uppercase tracking-widest">Book Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* --- Section: Under Inspection --- */}
      <View className="px-6 mt-8">
        <View className="flex-row justify-between items-end mb-4 px-1">
          <Text className="text-lg font-black" style={{ color: theme.text }}>Under Inspection</Text>
          <Link href="/appointments">
            <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.primary }}>View All</Text>
          </Link>
        </View>

        {loading ? (
          <View className="h-32 rounded-3xl items-center justify-center border border-dashed" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : underInspectionAppointments.length > 0 ? (
          underInspectionAppointments.map((appointment) => (
            <TouchableOpacity 
              key={appointment.id}
              activeOpacity={0.8}
              onPress={() => router.push(`/tracking?appointmentId=${appointment.id}`)}
              className="p-5 rounded-[28px] border mb-3" 
              style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: '#f59e0b20' }}>
                    <MaterialCommunityIcons name="car-wrench" size={26} color="#f59e0b" />
                  </View>
                  <View>
                    <Text className="text-lg font-black" style={{ color: theme.text }}>
                      {appointment.serviceType?.name || 'Service'}
                    </Text>
                    <Text className="text-xs font-bold opacity-50" style={{ color: theme.text }}>
                      {appointment.vehicle?.make} {appointment.vehicle?.model}
                    </Text>
                  </View>
                </View>
                <View className="px-3 py-1 rounded-lg" style={{ backgroundColor: '#f59e0b20' }}>
                  <Text className="text-[10px] font-black" style={{ color: '#f59e0b' }}>{appointment.status}</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                <View className="flex-row">
                  <View className="flex-row items-center mr-4">
                    <Ionicons name="calendar-clear" size={14} color="#f59e0b" />
                    <Text className="text-[13px] ml-1.5 font-bold" style={{ color: theme.textSecondary }}>
                      {formatDate(appointment.appointmentDate)}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="time" size={14} color="#f59e0b" />
                    <Text className="text-[13px] ml-1.5 font-bold" style={{ color: theme.textSecondary }}>
                      {formatTime(appointment.appointmentTime)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View className="p-6 rounded-[28px] items-center border border-dashed mb-3" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <View className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-900 items-center justify-center mb-3">
              <Ionicons name="checkmark-circle-outline" size={24} color={theme.textSecondary} />
            </View>
            <Text className="text-center font-bold text-sm" style={{ color: theme.textSecondary }}>
              No vehicles under inspection.
            </Text>
          </View>
        )}
      </View>

      {/* --- Section: In Progress --- */}
      <View className="px-6 mt-2">
        <View className="flex-row justify-between items-end mb-4 px-1">
          <Text className="text-lg font-black" style={{ color: theme.text }}>In Progress</Text>
          <Link href="/appointments">
            <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.primary }}>View All</Text>
          </Link>
        </View>

        {loading ? (
          <View className="h-32 rounded-3xl items-center justify-center border border-dashed" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : inProgressAppointments.length > 0 ? (
          inProgressAppointments.map((appointment) => (
            <TouchableOpacity 
              key={appointment.id}
              activeOpacity={0.8}
              onPress={() => router.push(`/tracking?appointmentId=${appointment.id}`)}
              className="p-5 rounded-[28px] border mb-3" 
              style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: '#3b82f620' }}>
                    <MaterialCommunityIcons name="progress-wrench" size={26} color="#3b82f6" />
                  </View>
                  <View>
                    <Text className="text-lg font-black" style={{ color: theme.text }}>
                      {appointment.serviceType?.name || 'Service'}
                    </Text>
                    <Text className="text-xs font-bold opacity-50" style={{ color: theme.text }}>
                      {appointment.vehicle?.make} {appointment.vehicle?.model}
                    </Text>
                  </View>
                </View>
                <View className="px-3 py-1 rounded-lg" style={{ backgroundColor: '#3b82f620' }}>
                  <Text className="text-[10px] font-black" style={{ color: '#3b82f6' }}>{appointment.status}</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                <View className="flex-row">
                  <View className="flex-row items-center mr-4">
                    <Ionicons name="calendar-clear" size={14} color="#3b82f6" />
                    <Text className="text-[13px] ml-1.5 font-bold" style={{ color: theme.textSecondary }}>
                      {formatDate(appointment.appointmentDate)}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="time" size={14} color="#3b82f6" />
                    <Text className="text-[13px] ml-1.5 font-bold" style={{ color: theme.textSecondary }}>
                      {formatTime(appointment.appointmentTime)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View className="p-6 rounded-[28px] items-center border border-dashed mb-3" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
            <View className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-900 items-center justify-center mb-3">
              <Ionicons name="checkmark-circle-outline" size={24} color={theme.textSecondary} />
            </View>
            <Text className="text-center font-bold text-sm" style={{ color: theme.textSecondary }}>
              No vehicles in progress.
            </Text>
          </View>
        )}
      </View>

      {/* --- Section: My Vehicles --- */}
      <View className="mt-8">
        <View className="flex-row justify-between items-center mb-4 px-7">
          <Text className="text-lg font-black" style={{ color: theme.text }}>Garage</Text>
          <Link href="/vehicles">
            <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.primary }}>Manage</Text>
          </Link>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}>
          <VehicleCard name="Toyota Vios" plate="ABC 1234" year="2021" theme={theme} />
          <VehicleCard name="Honda Civic" plate="XYZ 5678" year="2022" theme={theme} />
          <TouchableOpacity 
            className="mr-4 p-5 rounded-3xl w-40 h-32 items-center justify-center border border-dashed" 
            style={{ borderColor: theme.border }}
          >
            <Ionicons name="add-circle" size={32} color={theme.primary} />
            <Text className="text-[10px] font-bold mt-2 uppercase tracking-tighter" style={{ color: theme.textSecondary }}>Add Vehicle</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* --- Section: Popular Services --- */}
      <View className="px-6 mt-8 mb-12">
        <Text className="text-lg font-black mb-4 px-1" style={{ color: theme.text }}>Trending Services</Text>
        <ServiceCard name="PMS Check" duration="2 hours" price="₱3,500" icon="speedometer" theme={theme} />
        <ServiceCard name="Synthetic Oil Change" duration="45 mins" price="₱1,500" icon="water" theme={theme} />
        <ServiceCard name="Wheel Balancing" duration="30 mins" price="₱800" icon="disc" theme={theme} />
      </View>
    </ScrollView>
  );
}

// --- Sub-Component: Quick Action Button ---
const ActionItem = ({ icon, label, color, theme, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    className="items-center w-[30%]"
  >
    <View 
      className="w-16 h-16 rounded-3xl items-center justify-center mb-2 shadow-sm"
      style={{ backgroundColor: theme.surface, borderBottomWidth: 3, borderBottomColor: color + '40' }}
    >
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text className="text-[11px] font-black uppercase tracking-tighter" style={{ color: theme.text }}>{label}</Text>
  </TouchableOpacity>
);

// --- Sub-Component: Vehicle Card ---
const VehicleCard = ({ name, plate, year, theme }) => (
  <TouchableOpacity 
    activeOpacity={0.8}
    className="mr-4 p-5 rounded-[28px] w-44 h-32 justify-between border" 
    style={{ backgroundColor: theme.surface, borderColor: theme.border }}
  >
    <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: theme.primary + '10' }}>
      <Ionicons name="car" size={20} color={theme.primary} />
    </View>
    <View>
      <Text className="text-sm font-black" numberOfLines={1} style={{ color: theme.text }}>{name}</Text>
      <Text className="text-[10px] font-bold opacity-50 uppercase tracking-widest" style={{ color: theme.text }}>{plate}</Text>
    </View>
  </TouchableOpacity>
);

// --- Sub-Component: Service Card ---
const ServiceCard = ({ name, duration, price, icon, theme }) => (
  <TouchableOpacity 
    activeOpacity={0.8}
    className="flex-row justify-between items-center p-5 mb-4 rounded-3xl border" 
    style={{ backgroundColor: theme.surface, borderColor: theme.border }}
  >
    <View className="flex-row items-center flex-1">
      <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: theme.background }}>
        <Ionicons name={icon} size={22} color={theme.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-black" style={{ color: theme.text }}>{name}</Text>
        <Text className="text-xs font-bold opacity-50" style={{ color: theme.text }}>{duration}</Text>
      </View>
    </View>
    <View className="items-end">
      <Text className="text-base font-black" style={{ color: theme.primary }}>{price}</Text>
      <Text className="text-[10px] font-bold uppercase tracking-tighter opacity-40" style={{ color: theme.text }}>From</Text>
    </View>
  </TouchableOpacity>
);