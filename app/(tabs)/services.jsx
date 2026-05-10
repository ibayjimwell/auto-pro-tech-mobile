import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

export default function ServicesScreen() {
  const { theme } = useTheme();

  // --- Static Data: Services ---
  const services = [
    {
      id: 1,
      name: "PMS (Preventive Maintenance)",
      duration: "2 hours",
      description: "Comprehensive check-up including fluid top-ups, filter replacement, and 50-point safety inspection.",
      price: "₱3,500",
      icon: "car-wrench",
    },
    {
      id: 2,
      name: "Oil Change",
      duration: "45 mins",
      description: "High-quality synthetic oil replacement with new oil filter to keep your engine running smoothly.",
      price: "₱1,500",
      icon: "oil",
    },
    {
      id: 3,
      name: "Tire Rotation",
      duration: "30 mins",
      description: "Rotating tires to ensure even wear, extend tire life, and improve handling and safety.",
      price: "₱800",
      icon: "tire",
    },
    {
      id: 4,
      name: "Brake Inspection",
      duration: "1 hour",
      description: "Thorough inspection of brake pads, rotors, and fluid levels to ensure reliable stopping power.",
      price: "₱1,200",
      icon: "brake-pads",
    },
    {
      id: 5,
      name: "Car Wash & Wax",
      duration: "1 hour",
      description: "Premium exterior wash, interior vacuuming, and protective wax coating for a showroom shine.",
      price: "₱500",
      icon: "car-wash",
    },
  ];

  return (
    <ScrollView 
      className="flex-1" 
      style={{ backgroundColor: theme.background }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-6 pt-14 pb-10">
        
        {/* --- Header Section --- */}
        <View className="mb-8">
          <Text className="text-sm font-bold uppercase tracking-[2px] opacity-50" style={{ color: theme.text }}>
            Expert Care
          </Text>
          <Text className="text-3xl font-black" style={{ color: theme.text }}>
            Our <Text style={{ color: theme.primary }}>Services</Text>
          </Text>
          <Text className="text-sm font-medium mt-2 leading-5" style={{ color: theme.textSecondary }}>
            Choose from our premium maintenance packages designed to keep your vehicle in peak condition.
          </Text>
        </View>

        {/* --- Services List --- */}
        {services.map((service) => (
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
                <MaterialCommunityIcons name={service.icon} size={30} color={theme.primary} />
              </View>
              <View 
                className="px-3 py-1.5 rounded-full flex-row items-center" 
                style={{ backgroundColor: theme.background }}
              >
                <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                <Text className="text-[11px] font-black ml-1.5 uppercase" style={{ color: theme.textSecondary }}>
                  {service.duration}
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
                  {service.price}
                </Text>
              </View>

              <TouchableOpacity 
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
        ))}

        {/* --- Footer Disclaimer --- */}
        <View className="mt-4 p-6 rounded-3xl items-center" style={{ backgroundColor: theme.primary + '05' }}>
            <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} />
            <Text className="text-[11px] text-center mt-2 font-medium opacity-50" style={{ color: theme.text }}>
                Prices may vary depending on vehicle make and model.{"\n"}All services include a free multi-point inspection.
            </Text>
        </View>
        
        <View className="h-10" />
      </View>
    </ScrollView>
  );
}