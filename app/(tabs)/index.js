import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { Image } from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();

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
                    Book your appointment now and get 10% off on first service!
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

      {/* My Vehicles */}
      <View className="px-5 mt-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-xl font-semibold" style={{ color: theme.text }}>
            My Vehicles
          </Text>
          <Link href="/vehicles">
            <Text className="text-base" style={{ color: theme.primary }}>
              Manage &gt;
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
      <View className="px-5 mt-6">
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

// Helper components (unchanged)
const VehicleCard = ({ name, plate, year, theme }) => (
  <View
    className="mr-3 p-4 rounded-xl"
    style={{ backgroundColor: theme.surface }}
  >
    <Text className="text-lg font-bold" style={{ color: theme.text }}>
      {name}
    </Text>
    <Text style={{ color: theme.textSecondary }}>
      {plate} • {year}
    </Text>
    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
  </View>
);

const ServiceCard = ({ name, duration, price, theme }) => (
  <TouchableOpacity
    className="flex-row justify-between items-center p-4 mb-2 rounded-xl"
    style={{ backgroundColor: theme.surface }}
  >
    <View>
      <Text className="text-lg font-semibold" style={{ color: theme.text }}>
        {name}
      </Text>
      <Text style={{ color: theme.textSecondary }}>{duration}</Text>
    </View>
    <View className="flex-row items-center">
      <Text className="text-lg font-bold mr-2" style={{ color: theme.primary }}>
        {price}
      </Text>
      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
    </View>
  </TouchableOpacity>
);