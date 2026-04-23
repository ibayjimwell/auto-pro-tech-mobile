import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export default function ServicesScreen() {
  const { theme } = useTheme();

  const services = [
    {
      id: 1,
      name: "PMS (Preventive Maintenance)",
      duration: "2 hours",
      description: "Comprehensive check-up including fluid top-ups, filter replacement, and 50-point safety inspection.",
      price: "₱3,500",
    },
    {
      id: 2,
      name: "Oil Change",
      duration: "45 mins",
      description: "High-quality synthetic oil replacement with new oil filter to keep your engine running smoothly.",
      price: "₱1,500",
    },
    {
      id: 3,
      name: "Tire Rotation",
      duration: "30 mins",
      description: "Rotating tires to ensure even wear, extend tire life, and improve handling and safety.",
      price: "₱800",
    },
    {
      id: 4,
      name: "Brake Inspection",
      duration: "1 hour",
      description: "Thorough inspection of brake pads, rotors, and fluid levels to ensure reliable stopping power.",
      price: "₱1,200",
    },
    {
      id: 5,
      name: "Car Wash & Wax",
      duration: "1 hour",
      description: "Premium exterior wash, interior vacuuming, and protective wax coating for a showroom shine.",
      price: "₱500",
    },
  ];

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: theme.background }}>
      <View className="px-5 pt-4">
        <Text className="text-2xl font-bold mb-2" style={{ color: theme.text }}>
          Our Services
        </Text>
        <Text className="text-base mb-4" style={{ color: theme.textSecondary }}>
          Choose from our premium maintenance packages
        </Text>

        {services.map((service) => (
          <View key={service.id} className="mb-4 p-4 rounded-xl" style={{ backgroundColor: theme.surface }}>
            <Text className="text-xl font-semibold mb-1" style={{ color: theme.text }}>
              {service.name}
            </Text>
            <Text className="text-sm mb-2" style={{ color: theme.textSecondary }}>
              {service.duration}
            </Text>
            <Text className="text-base mb-3" style={{ color: theme.textSecondary }}>
              {service.description}
            </Text>
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-bold" style={{ color: theme.primary }}>
                {service.price}
              </Text>
              <TouchableOpacity className="flex-row items-center">
                <Text className="mr-1 font-semibold" style={{ color: theme.primary }}>
                  Book
                </Text>
                <Ionicons name="arrow-forward" size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}