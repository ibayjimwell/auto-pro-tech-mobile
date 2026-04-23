import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { Image } from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: theme.background }}>
      {/* Custom Header */}
      <View className="px-5 pt-12 pb-2 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-bold" style={{ color: theme.text }}>
            Welcome back,
          </Text>
          <Text className="text-3xl font-bold" style={{ color: theme.primary }}>
            John Doe
          </Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} className="p-2">
          <Ionicons
            name={isDarkMode ? "sunny-outline" : "moon-outline"}
            size={28}
            color={theme.text}
          />
        </TouchableOpacity>
      </View>

      {/* Hero Promo Card */}
    <View className="px-5 mt-2">
        <View className="relative rounded-2xl overflow-hidden h-40">
            {/* Background Image */}
            <Image
                source={{ uri: 'https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=600' }}
                className="absolute w-full h-full"
                resizeMode="cover"
            />
            {/* Dark Overlay */}
            <View className="absolute w-full h-full bg-black/40" />
            
            {/* Content */}
            <View className="flex-1 p-5 justify-center">
                <Text className="text-white text-2xl font-bold mb-1">
                    Need Car Service?
                </Text>
                <Text className="text-white text-sm mb-4 opacity-90">
                    Book your appointment now on AutoProTech!
                </Text>
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
        <Text className="text-xl font-semibold mb-3" style={{ color: theme.text }}>
            Quick Actions
        </Text>
        <View className="flex-row justify-between">
            {/* Book Service */}
            <TouchableOpacity
                className="flex-1 bg-surface mr-2 p-4 rounded-xl items-center"
                style={{ backgroundColor: theme.surface }}
                onPress={() => router.push('/booking')}
            >
                <View
                    className="w-12 h-12 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: theme.primary + '20' }}
                >
                    <Ionicons name="calendar-outline" size={24} color={theme.primary} />
                </View>
                <Text className="text-sm font-semibold" style={{ color: theme.text }}>
                    Booking
                </Text>
            </TouchableOpacity>

            {/* Track Status */}
            <TouchableOpacity
                className="flex-1 bg-surface mx-2 p-4 rounded-xl items-center"
                style={{ backgroundColor: theme.surface }}
                onPress={() => router.push('/tracking')}
            >
                <View
                    className="w-12 h-12 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: theme.accent + '20' }}
                >
                    <Ionicons name="location-outline" size={24} color={theme.accent} />
                </View>
                <Text className="text-sm font-semibold" style={{ color: theme.text }}>
                    Tracking
                </Text>
            </TouchableOpacity>

            {/* Pay Invoice */}
            <TouchableOpacity
                className="flex-1 bg-surface ml-2 p-4 rounded-xl items-center"
                style={{ backgroundColor: theme.surface }}
                onPress={() => router.push('/invoice')}
            >
                <View
                    className="w-12 h-12 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: theme.success + '20' }}
                >
                    <Ionicons name="card-outline" size={24} color={theme.success} />
                </View>
                <Text className="text-sm font-semibold" style={{ color: theme.text }}>
                    Payment
                </Text>
            </TouchableOpacity>
        </View>
    </View>

    {/* Upcoming Appointment */}
    <View className="px-5 mt-6">
        <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xl font-semibold" style={{ color: theme.text }}>
                Upcoming Appointment
            </Text>
            <Link href="/appointments">
                <Text className="text-base font-medium" style={{ color: theme.primary }}>
                    View All
                </Text>
            </Link>
        </View>

        <View className="p-4 rounded-xl" style={{ backgroundColor: theme.surface }}>
            {/* Service & Vehicle */}
            <View className="flex-row justify-between items-start mb-2">
                <View>
                    <Text className="text-lg font-bold" style={{ color: theme.text }}>
                        PMS (Preventive Maintenance)
                    </Text>
                    <Text className="text-sm" style={{ color: theme.textSecondary }}>
                        Toyota Vios
                    </Text>
                </View>
                <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: theme.success + '20' }}
                >
                    <Text className="text-xs font-semibold" style={{ color: theme.success }}>
                        CONFIRMED
                    </Text>
                </View>
            </View>

            {/* Date & Time */}
            <View className="flex-row items-center mb-3">
                <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
                <Text className="text-sm ml-1 mr-4" style={{ color: theme.textSecondary }}>
                    2024-01-20
                </Text>
                <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                <Text className="text-sm ml-1" style={{ color: theme.textSecondary }}>
                    09:00 AM
                </Text>
            </View>

            {/* Divider */}
            <View className="border-t mb-3" style={{ borderColor: theme.border }} />

            {/* Cost & Track Button */}
            <View className="flex-row justify-between items-center">
                <View>
                    <Text className="text-xs" style={{ color: theme.textSecondary }}>
                        Estimated Cost
                    </Text>
                    <Text className="text-xl font-bold" style={{ color: theme.primary }}>
                        ₱3,500
                    </Text>
                </View>
                <TouchableOpacity
                    className="bg-primary px-6 py-2 rounded-full"
                    style={{ backgroundColor: theme.primary }}
                    onPress={() => router.push('/tracking')}
                >
                    <Text className="text-white font-semibold">Track</Text>
                </TouchableOpacity>
            </View>
        </View>
    </View>

      {/* My Vehicles */}
        <View className="px-5 mt-6">
            <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xl font-semibold" style={{ color: theme.text }}>
                    My Vehicles
                </Text>
                <Link href="/vehicles">
                <Text className="text-base font-medium" style={{ color: theme.primary }}>
                    Manage
                </Text>
                </Link>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <VehicleCard
                    name="Toyota Vios"
                    plate="ABC 1234"
                    year="2021"
                    theme={theme}
                />
                <VehicleCard
                    name="Honda Civic"
                    plate="XYZ 5678"
                    year="2022"
                    theme={theme}
                />
            </ScrollView>
        </View>

        {/* Popular Services */}
        <View className="px-5 mt-6 mb-6">
            <Text className="text-xl font-semibold mb-3" style={{ color: theme.text }}>
                Popular Services
            </Text>
            <ServiceCard
                name="PMS"
                duration="2 hours"
                price="₱3,500"
                theme={theme}
            />
            <ServiceCard
                name="Oil Change"
                duration="45 mins"
                price="₱1,500"
                theme={theme}
            />
            <ServiceCard
                name="Tire Rotation"
                duration="30 mins"
                price="₱800"
                theme={theme}
            />
        </View>
    </ScrollView>
  );
}

// Helper components
const VehicleCard = ({ name, plate, year, theme }) => (
  <TouchableOpacity
    className="mr-3 p-4 rounded-xl w-40"
    style={{ backgroundColor: theme.surface }}
    onPress={() => {/* navigate to vehicle details or booking */}}
  >
    <Text className="text-lg font-bold mb-1" style={{ color: theme.text }}>
      {name}
    </Text>
    <Text className="text-sm mb-2" style={{ color: theme.textSecondary }}>
      {plate} • {year}
    </Text>
    <View className="flex-row justify-end">
      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
    </View>
  </TouchableOpacity>
);

const ServiceCard = ({ name, duration, price, theme }) => (
  <TouchableOpacity
    className="flex-row justify-between items-center p-4 mb-3 rounded-xl"
    style={{ backgroundColor: theme.surface }}
    onPress={() => {/* navigate to booking with service pre-selected */}}
  >
    <View className="flex-1">
      <Text className="text-lg font-bold mb-1" style={{ color: theme.text }}>
        {name}
      </Text>
      <Text className="text-sm" style={{ color: theme.textSecondary }}>
        {duration}
      </Text>
    </View>
    <View className="flex-row items-center">
      <View className="items-end mr-3">
        <Text className="text-lg font-bold" style={{ color: theme.primary }}>
          {price}
        </Text>
        <Text className="text-sm" style={{ color: theme.textSecondary }}>
          Starting
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
    </View>
  </TouchableOpacity>
);