import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useState } from "react";

export default function SignUpScreen() {
  const { theme } = useTheme();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <ScrollView
      className="flex-1 px-6 pt-12"
      style={{ backgroundColor: theme.background }}
    >
      <Text className="text-3xl font-bold mb-2" style={{ color: theme.primary }}>
        AutoCare
      </Text>
      <Text className="text-base mb-8" style={{ color: theme.textSecondary }}>
        Create your account to get started
      </Text>

      <Text className="text-sm mb-1" style={{ color: theme.text }}>
        Full Name
      </Text>
      <TextInput
        className="p-4 rounded-lg mb-4"
        style={{
          backgroundColor: theme.surface,
          color: theme.text,
          borderColor: theme.border,
          borderWidth: 1,
        }}
        placeholder="Enter your full name"
        placeholderTextColor={theme.textSecondary}
        value={fullName}
        onChangeText={setFullName}
      />

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
        Phone Number
      </Text>
      <TextInput
        className="p-4 rounded-lg mb-4"
        style={{
          backgroundColor: theme.surface,
          color: theme.text,
          borderColor: theme.border,
          borderWidth: 1,
        }}
        placeholder="Enter your phone number"
        placeholderTextColor={theme.textSecondary}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <Text className="text-sm mb-1" style={{ color: theme.text }}>
        Password
      </Text>
      <View className="relative mb-4">
        <TextInput
          className="p-4 rounded-lg"
          style={{
            backgroundColor: theme.surface,
            color: theme.text,
            borderColor: theme.border,
            borderWidth: 1,
          }}
          placeholder="Create a password"
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

      <Text className="text-sm mb-1" style={{ color: theme.text }}>
        Confirm Password
      </Text>
      <View className="relative mb-4">
        <TextInput
          className="p-4 rounded-lg"
          style={{
            backgroundColor: theme.surface,
            color: theme.text,
            borderColor: theme.border,
            borderWidth: 1,
          }}
          placeholder="Confirm your password"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={!showConfirm}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity
          className="absolute right-4 top-4"
          onPress={() => setShowConfirm(!showConfirm)}
        >
          <Ionicons
            name={showConfirm ? "eye-off-outline" : "eye-outline"}
            size={24}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="flex-row items-center mb-6"
        onPress={() => setAgree(!agree)}
      >
        <Ionicons
          name={agree ? "checkbox" : "square-outline"}
          size={24}
          color={theme.primary}
        />
        <Text className="ml-2" style={{ color: theme.textSecondary }}>
          I agree to the Terms of Service and Privacy Policy
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="py-4 rounded-lg mb-4"
        style={{ backgroundColor: theme.primary }}
      >
        <Text className="text-white text-center font-semibold text-lg">
          Create Account
        </Text>
      </TouchableOpacity>

      <Text className="text-center mb-4" style={{ color: theme.textSecondary }}>
        or
      </Text>

      <View className="flex-row justify-center mb-8">
        <Text style={{ color: theme.textSecondary }}>
          Already have an account?{" "}
        </Text>
        <Link href="/login">
          <Text style={{ color: theme.primary, fontWeight: "600" }}>Sign In</Text>
        </Link>
      </View>
    </ScrollView>
  );
}