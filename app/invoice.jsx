import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export default function InvoiceScreen() {
  const { theme } = useTheme();

  // --- Static Data: Line Items ---
  const lineItems = [
    { name: "Labor Charge", price: "₱2,000", description: "Standard labor for preventive maintenance service (2 hours)", icon: "account-wrench" },
    { name: "Synthetic Engine Oil (5L)", price: "₱1,200", description: "Full synthetic motor oil replacement", icon: "oil" },
    { name: "Oil Filter", price: "₱350", description: "OEM replacement filter", icon: "filter-variant" },
    { name: "Air Filter", price: "₱250", description: "Cabin air filter replacement", icon: "air-filter" },
    { name: "Environmental Fee", price: "₱100", description: "Disposal and recycling fee", icon: "leaf" },
  ];

  const total = 3900;

  return (
    <ScrollView 
      className="flex-1" 
      style={{ backgroundColor: theme.background }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-6 pt-12 pb-10">
        
        {/* --- Status Banner --- */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <View className="flex-row items-center mb-1">
              <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
              <Text className="text-[10px] font-black uppercase tracking-[2px]" style={{ color: theme.error }}>
                Payment Due
              </Text>
            </View>
            <Text className="text-3xl font-black" style={{ color: theme.text }}>
              Final <Text style={{ color: theme.primary }}>Invoice</Text>
            </Text>
          </View>
          <TouchableOpacity 
            className="w-12 h-12 rounded-2xl items-center justify-center border" 
            style={{ backgroundColor: theme.surface, borderColor: theme.border }}
          >
            <Ionicons name="download-outline" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* --- Invoice Metadata Card --- */}
        <View 
          className="p-6 rounded-[32px] mb-8 border" 
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <View className="flex-row justify-between pb-4 border-b border-dashed" style={{ borderBottomColor: theme.border }}>
            <View>
              <Text className="text-[10px] font-black uppercase opacity-40 mb-1" style={{ color: theme.text }}>Invoice ID</Text>
              <Text className="text-base font-bold" style={{ color: theme.text }}>INV-2024-001</Text>
            </View>
            <View className="items-end">
              <Text className="text-[10px] font-black uppercase opacity-40 mb-1" style={{ color: theme.text }}>Date Issued</Text>
              <Text className="text-base font-bold" style={{ color: theme.text }}>Apr 23, 2026</Text>
            </View>
          </View>

          <View className="flex-row items-center mt-6">
            <View className="w-10 h-10 rounded-xl items-center justify-center mr-4" style={{ backgroundColor: theme.primary + '10' }}>
              <MaterialCommunityIcons name="car-info" size={20} color={theme.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-black uppercase opacity-40" style={{ color: theme.text }}>Vehicle Details</Text>
              <Text className="text-sm font-bold" style={{ color: theme.text }}>Toyota Vios • <Text style={{ color: theme.primary }}>ABC 1234</Text></Text>
            </View>
          </View>

          <View className="flex-row items-center mt-4">
            <View className="w-10 h-10 rounded-xl items-center justify-center mr-4" style={{ backgroundColor: theme.primary + '10' }}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={theme.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-black uppercase opacity-40" style={{ color: theme.text }}>Primary Service</Text>
              <Text className="text-sm font-bold" style={{ color: theme.text }}>PMS (Preventive Maintenance)</Text>
            </View>
          </View>
        </View>

        {/* --- Line Items Section --- */}
        <View className="mb-6 flex-row justify-between items-center">
            <Text className="text-xl font-black" style={{ color: theme.text }}>Breakdown</Text>
            <Text className="text-xs font-bold opacity-40" style={{ color: theme.text }}>{lineItems.length} ITEMS</Text>
        </View>

        {lineItems.map((item, index) => (
          <View key={index} className="flex-row items-start mb-6">
            <View className="w-8 h-8 rounded-lg items-center justify-center mt-1" style={{ backgroundColor: theme.background }}>
              <MaterialCommunityIcons name={item.icon} size={18} color={theme.textSecondary} />
            </View>
            <View className="flex-1 mx-4">
              <Text className="text-sm font-black mb-1" style={{ color: theme.text }}>{item.name}</Text>
              <Text className="text-xs leading-4 opacity-50" style={{ color: theme.textSecondary }}>{item.description}</Text>
            </View>
            <Text className="text-sm font-black" style={{ color: theme.text }}>{item.price}</Text>
          </View>
        ))}

        {/* --- Totals Summary --- */}
        <View 
          className="p-8 rounded-[40px] mt-4 mb-10 overflow-hidden" 
          style={{ backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}
        >
          {/* Decorative Circle Background */}
          <View className="absolute -top-10 -right-10 w-32 h-32 rounded-full" style={{ backgroundColor: theme.primary + '05' }} />
          
          <View className="flex-row justify-between mb-4">
            <Text className="text-sm font-medium opacity-50" style={{ color: theme.text }}>Subtotal</Text>
            <Text className="text-sm font-bold" style={{ color: theme.text }}>₱{total.toLocaleString()}</Text>
          </View>
          
          <View className="flex-row justify-between mb-6">
            <Text className="text-sm font-medium opacity-50" style={{ color: theme.text }}>Tax (VAT 0%)</Text>
            <Text className="text-sm font-bold" style={{ color: theme.text }}>₱0.00</Text>
          </View>

          <View className="pt-6 border-t border-dashed" style={{ borderTopColor: theme.border }}>
            <View className="flex-row justify-between items-end">
              <View>
                <Text className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.primary }}>Amount Due</Text>
                <Text className="text-4xl font-black mt-1" style={{ color: theme.text }}>₱{total.toLocaleString()}</Text>
              </View>
              <Ionicons name="shield-checkmark" size={24} color={theme.primary} />
            </View>
          </View>
        </View>

        {/* --- Payment Methods Section --- */}
        <Text className="text-xs font-black uppercase tracking-[2px] mb-4 text-center opacity-40" style={{ color: theme.text }}>
          Select Secure Payment
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          className="p-5 rounded-3xl mb-4 flex-row items-center border"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <View className="w-12 h-12 rounded-2xl bg-emerald-500/10 justify-center items-center mr-4">
            <FontAwesome5 name="money-bill-wave" size={20} color="#10b981" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-black" style={{ color: theme.text }}>Cash Payment</Text>
            <Text className="text-xs opacity-50" style={{ color: theme.textSecondary }}>Pay at the front desk</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.border} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          className="p-5 rounded-3xl mb-8 flex-row items-center border shadow-xl shadow-primary/10"
          style={{ backgroundColor: theme.primary, borderColor: theme.primary }}
        >
          <View className="w-12 h-12 rounded-2xl bg-white/20 justify-center items-center mr-4">
            <FontAwesome5 name="stripe-s" size={20} color="#FFF" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-black text-white">Stripe Checkout</Text>
            <Text className="text-xs text-white/70">Credit card, Gcash, or Maya</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>

        {/* Footer Note */}
        <Text className="text-[10px] text-center font-medium opacity-30 leading-4" style={{ color: theme.text }}>
          Electronic Receipt generated by Garage Hub Management System.{"\n"}
          Thank you for trusting us with your vehicle.
        </Text>
      </View>
    </ScrollView>
  );
}