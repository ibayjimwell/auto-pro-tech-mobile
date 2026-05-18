import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import serviceTypesApi from "../../services/serviceTypesApi";

// --- Map API service type to the card display format ---
const SERVICE_ICONS = [
  "car-wrench",
  "oil",
  "tire",
  "brake-pads",
  "car-wash",
  "engine",
  "disc",
  "car-cog",
  "speedometer",
  "wrench",
  "car-settings",
];

const formatDuration = (minutes) => {
  if (!minutes) return '';
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs} hour${hrs > 1 ? 's' : ''}`;
  }
  return `${minutes} mins`;
};

const formatPrice = (price) => {
  if (!price && price !== 0) return '';
  return `₱${Number(price).toLocaleString()}`;
};

const getServiceIcon = (index) => {
  return SERVICE_ICONS[index % SERVICE_ICONS.length];
};

export default function ServicesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadServices = async () => {
    try {
      const res = await serviceTypesApi.listActive();
      const data = res.data?.data || res.data || res;
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load services:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [])
  );

  const handleBookService = (service) => {
    router.push(`/booking?serviceId=${service.id}`);
  };

  return (
    <ScrollView 
      className="flex-1 pb-10" 
      style={{ backgroundColor: theme.background }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-6 pt-14 pb-10">
        
        {/* --- Header Section --- */}
        <View className="mb-8">
          <Text className="text-3xl font-black" style={{ color: theme.text }}>
            Our <Text style={{ color: theme.primary }}>Services</Text>
          </Text>
          <Text className="text-sm font-medium mt-2 leading-5" style={{ color: theme.textSecondary }}>
            Choose from our premium maintenance packages designed to keep your vehicle in peak condition.
          </Text>
        </View>

        {/* --- Loading State --- */}
        {loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : services.length === 0 ? (
          <View className="py-20 rounded-[40px] border border-dashed items-center" style={{ borderColor: theme.border }}>
            <Ionicons name="construct-outline" size={48} color={theme.textSecondary} />
            <Text className="mt-4 font-black text-lg" style={{ color: theme.text }}>No services available</Text>
          </View>
        ) : (
          /* --- Services List --- */
          services.map((service, index) => (
            <TouchableOpacity 
              activeOpacity={0.9}
              key={service.id} 
              className="mb-5 p-6 rounded-[32px] border shadow-sm" 
              style={{ 
                  backgroundColor: theme.surface, 
                  borderColor: theme.border 
              }}
            >
              {/* Top Row: Icon & Duration */}
              <View className="flex-row justify-between items-start mb-4">
                <View 
                  className="w-14 h-14 rounded-2xl items-center justify-center" 
                  style={{ backgroundColor: theme.primary + '10' }}
                >
                  <MaterialCommunityIcons name={getServiceIcon(index)} size={30} color={theme.primary} />
                </View>
                <View 
                  className="px-3 py-1.5 rounded-full flex-row items-center" 
                  style={{ backgroundColor: theme.background }}
                >
                  <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                  <Text className="text-[11px] font-black ml-1.5 uppercase" style={{ color: theme.textSecondary }}>
                    {formatDuration(service.durationMinutes)}
                  </Text>
                </View>
              </View>

              {/* Middle Row: Content */}
              <View className="mb-6">
                <Text className="text-xl font-black mb-2" style={{ color: theme.text }}>
                  {service.name}
                </Text>
                <Text className="text-sm leading-5 font-medium opacity-60" style={{ color: theme.text }}>
                  {service.description}
                </Text>
              </View>

              {/* Bottom Row: Price & Action */}
              <View 
                  className="flex-row justify-between items-center pt-4 border-t" 
                  style={{ borderTopColor: theme.border }}
              >
                <View>
                  <Text className="text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: theme.text }}>
                    Starting at
                  </Text>
                  <Text className="text-2xl font-black" style={{ color: theme.primary }}>
                    {formatPrice(service.basePrice)}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleBookService(service)}
                  activeOpacity={0.7}
                  className="flex-row items-center py-3 px-5 rounded-2xl shadow-lg shadow-primary/20" 
                  style={{ backgroundColor: theme.primary }}
                >
                  <Text className="text-white font-black uppercase tracking-widest text-xs mr-2">
                    Book
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* --- Footer Disclaimer --- */}
        <View className="mt-4 p-6 rounded-3xl items-center" style={{ backgroundColor: theme.primary + '05' }}>
            <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} />
            <Text className="text-[11px] text-center mt-2 font-medium opacity-50" style={{ color: theme.text }}>
                Prices may vary depending on vehicle issue, make and model.{"\n"}All services include a free inspection.
            </Text>
        </View>
        
        <View className="h-10" />
      </View>
    </ScrollView>
  );
}