import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useState } from "react";

export default function LoginScreen() {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View
      className="flex-1 justify-center px-6"
      style={{ backgroundColor: theme.background }}
    >
      <Text className="text-3xl font-bold mb-2" style={{ color: theme.primary }}>
        AutoCare
      </Text>
      <Text className="text-base mb-8" style={{ color: theme.textSecondary }}>
        Your trusted automotive repair partner
      </Text>

      <Text className="text-sm mb-1" style={{ color: theme.text }}>
        Email Address
      </Text>
      <TextInput
        className="p-4 rounded-lg mb-4"
        style={{
          backgroundColor: theme.surface,
          color: theme.text,
          borderColor: theme.border,
          borderWidth: 1,
        }}
        placeholder="Enter your email"
        placeholderTextColor={theme.textSecondary}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <Text className="text-sm mb-1" style={{ color: theme.text }}>
        Password
      </Text>
      <View className="relative">
        <TextInput
          className="p-4 rounded-lg mb-2"
          style={{
            backgroundColor: theme.surface,
            color: theme.text,
            borderColor: theme.border,
            borderWidth: 1,
          }}
          placeholder="Enter your password"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          className="absolute right-4 top-4"
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={24}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity className="self-end mb-6">
        <Text style={{ color: theme.primary }}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="py-4 rounded-lg mb-4"
        style={{ backgroundColor: theme.primary }}
      >
        <Text className="text-white text-center font-semibold text-lg">
          Sign In
        </Text>
      </TouchableOpacity>

      <Text className="text-center mb-4" style={{ color: theme.textSecondary }}>
        or
      </Text>

      <View className="flex-row justify-center">
        <Text style={{ color: theme.textSecondary }}>
          Don't have an account?{" "}
        </Text>
        <Link href="/signup">
          <Text style={{ color: theme.primary, fontWeight: "600" }}>Sign Up</Text>
        </Link>
      </View>

      {/* Demo Credentials */}
      <View className="mt-8 p-4 rounded-lg" style={{ backgroundColor: theme.surface }}>
        <Text className="font-semibold mb-2" style={{ color: theme.text }}>
          Demo Credentials:
        </Text>
        <Text style={{ color: theme.textSecondary }}>
          Email: john@example.com
        </Text>
        <Text style={{ color: theme.textSecondary }}>
          Password: password123
        </Text>
      </View>
    </View>
  );
}