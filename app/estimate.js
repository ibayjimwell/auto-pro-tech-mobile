import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function EstimateScreen() {
  const { theme } = useTheme();

  const lineItems = [
    { name: "Labor Charge", price: "₱2,000", description: "Standard labor for preventive maintenance service" },
    { name: "Synthetic Engine Oil (5L)", price: "₱1,200", description: "Full synthetic motor oil replacement" },
    { name: "Oil Filter", price: "₱350", description: "OEM replacement filter" },
    { name: "Air Filter", price: "₱250", description: "Cabin air filter replacement" },
    { name: "Environmental Fee", price: "₱100", description: "Disposal and recycling fee" },
  ];

  const subtotal = 3900;

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: theme.background }}>
      <View className="px-5 pt-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-sm" style={{ color: theme.warning }}>
            Pending Approval
          </Text>
          <Text className="text-2xl font-bold mt-1" style={{ color: theme.text }}>
            Service Estimate
          </Text>
        </View>

        {/* Estimate Details */}
        <View className="p-4 rounded-xl mb-4" style={{ backgroundColor: theme.surface }}>
          <Text className="text-sm mb-2" style={{ color: theme.textSecondary }}>
            ESTIMATE ID
          </Text>
          <Text className="text-lg font-semibold mb-4" style={{ color: theme.text }}>
            EST-2024-001
          </Text>

          <View className="mb-2">
            <Text className="text-sm" style={{ color: theme.textSecondary }}>
              Service
            </Text>
            <Text className="text-base font-semibold" style={{ color: theme.text }}>
              PMS (Preventive Maintenance)
            </Text>
          </View>

          <View className="mb-2">
            <Text className="text-sm" style={{ color: theme.textSecondary }}>
              Vehicle
            </Text>
            <Text className="text-base" style={{ color: theme.text }}>
              Toyota Vios
            </Text>
            <Text className="text-sm" style={{ color: theme.textSecondary }}>
              ABC 1234
            </Text>
          </View>

          <View>
            <Text className="text-sm" style={{ color: theme.textSecondary }}>
              Estimated Duration
            </Text>
            <Text className="text-base" style={{ color: theme.text }}>
              2 hours
            </Text>
          </View>
        </View>

        {/* Cost Breakdown */}
        <Text className="text-xl font-semibold mb-3" style={{ color: theme.text }}>
          Cost Breakdown
        </Text>

        {lineItems.map((item, index) => (
          <View key={index} className="mb-3">
            <View className="flex-row justify-between">
              <Text className="text-base font-semibold" style={{ color: theme.text }}>
                {item.name}
              </Text>
              <Text className="text-base font-semibold" style={{ color: theme.text }}>
                {item.price}
              </Text>
            </View>
            <Text className="text-sm" style={{ color: theme.textSecondary }}>
              {item.description}
            </Text>
          </View>
        ))}

        <View className="border-t border-gray-200 mt-4 pt-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-lg font-semibold" style={{ color: theme.text }}>
              Subtotal
            </Text>
            <Text className="text-lg font-bold" style={{ color: theme.text }}>
              ₱{subtotal.toLocaleString()}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-base" style={{ color: theme.textSecondary }}>
              Tax (VAT)
            </Text>
            <Text className="text-base" style={{ color: theme.textSecondary }}>
              ₱0
            </Text>
          </View>
          <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-200">
            <Text className="text-xl font-bold" style={{ color: theme.text }}>
              Estimated Total
            </Text>
            <Text className="text-xl font-bold" style={{ color: theme.primary }}>
              ₱{subtotal.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Disclaimer */}
        <Text className="text-xs my-4" style={{ color: theme.textSecondary }}>
          * This is an estimate based on initial inspection. Final cost may vary depending on actual parts required and labor time. You will be notified of any significant changes before work proceeds.
        </Text>

        {/* Action Buttons */}
        <View className="flex-row justify-between mb-8">
          <TouchableOpacity
            className="flex-1 py-4 rounded-lg mr-2"
            style={{ backgroundColor: theme.success }}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Confirm & Proceed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 py-4 rounded-lg ml-2"
            style={{ backgroundColor: theme.error }}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Reject Estimate
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}