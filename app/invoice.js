import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function InvoiceScreen() {
  const { theme } = useTheme();

  const lineItems = [
    { name: "Labor Charge", price: "₱2,000", description: "Standard labor for preventive maintenance service (2 hours)" },
    { name: "Synthetic Engine Oil (5L)", price: "₱1,200", description: "Full synthetic motor oil replacement" },
    { name: "Oil Filter", price: "₱350", description: "OEM replacement filter" },
    { name: "Air Filter", price: "₱250", description: "Cabin air filter replacement" },
    { name: "Environmental Fee", price: "₱100", description: "Disposal and recycling fee" },
  ];

  const total = 3900;

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: theme.background }}>
      <View className="px-5 pt-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-sm" style={{ color: theme.error }}>
            PAYMENT DUE
          </Text>
          <Text className="text-2xl font-bold mt-1" style={{ color: theme.text }}>
            Final Invoice
          </Text>
        </View>

        {/* Invoice Details */}
        <View className="p-4 rounded-xl mb-4" style={{ backgroundColor: theme.surface }}>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm" style={{ color: theme.textSecondary }}>
              INVOICE ID
            </Text>
            <Text className="text-sm" style={{ color: theme.textSecondary }}>
              Date Issued
            </Text>
          </View>
          <View className="flex-row justify-between mb-4">
            <Text className="text-lg font-semibold" style={{ color: theme.text }}>
              INV-2024-001
            </Text>
            <Text className="text-base" style={{ color: theme.text }}>
              4/23/2026
            </Text>
          </View>

          <View className="mb-2">
            <Text className="text-sm" style={{ color: theme.textSecondary }}>
              Service
            </Text>
            <Text className="text-base font-semibold" style={{ color: theme.text }}>
              PMS (Preventive Maintenance)
            </Text>
          </View>

          <View>
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
        </View>

        {/* Service Details */}
        <Text className="text-xl font-semibold mb-3" style={{ color: theme.text }}>
          Service Details
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
              ₱{total.toLocaleString()}
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
              Total Due
            </Text>
            <Text className="text-xl font-bold" style={{ color: theme.primary }}>
              ₱{total.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Payment Methods */}
        <Text className="text-xl font-semibold mt-6 mb-3" style={{ color: theme.text }}>
          SELECT PAYMENT METHOD
        </Text>

        <TouchableOpacity
          className="p-4 rounded-xl mb-3 flex-row items-center"
          style={{ backgroundColor: theme.surface }}
        >
          <View className="w-10 h-10 rounded-full bg-green-100 justify-center items-center mr-3">
            <Text className="text-2xl">💵</Text>
          </View>
          <Text className="text-lg font-semibold" style={{ color: theme.text }}>
            Pay with Cash
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="p-4 rounded-xl mb-8 flex-row items-center"
          style={{ backgroundColor: theme.surface }}
        >
          <View className="w-10 h-10 rounded-full bg-blue-100 justify-center items-center mr-3">
            <Text className="text-2xl">💳</Text>
          </View>
          <Text className="text-lg font-semibold" style={{ color: theme.text }}>
            Pay with Stripe
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}