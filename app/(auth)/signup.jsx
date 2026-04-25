import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { z } from "zod";

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function SignUpScreen() {
  const { theme } = useTheme();
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleFieldChange = (field, value) => {
    switch (field) {
      case "fullName": setFullName(value); break;
      case "email": setEmail(value); break;
      case "phone": setPhone(value); break;
      case "password": setPassword(value); break;
      case "confirmPassword": setConfirmPassword(value); break;
    }
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSignup = async () => {
    try {
      signupSchema.parse({ fullName, email, phone, password, confirmPassword });
      setErrors({});
    } catch (err) {
      const formattedErrors = {};
      err.issues.forEach((issue) => {
        formattedErrors[issue.path[0]] = issue.message;
      });
      setErrors(formattedErrors);
      return;
    }

    if (!agree) {
      alert("You must agree to the Terms of Service");
      return;
    }

    setLoading(true);
    const result = await register(fullName, email, phone, password);
    setLoading(false);
    if (result.success) {
      router.replace("/(tabs)");
    } else {
      alert(result.message || "Signup failed");
    }
  };

  return (
    <ScrollView
      className="flex-1 px-6 pt-12"
      style={{ backgroundColor: theme.background }}
    >
      {/* Header */}
      <Text className="text-3xl font-bold mb-2" style={{ color: theme.primary }}>
        AutoCare
      </Text>
      <Text className="text-base mb-8" style={{ color: theme.textSecondary }}>
        Create your account to get started
      </Text>

      {/* Full Name */}
      <Text className="text-sm mb-1" style={{ color: theme.text }}>
        Full Name
      </Text>
      <TextInput
        className="p-4 rounded-lg mb-1"
        style={{
          backgroundColor: theme.surface,
          color: theme.text,
          borderColor: errors.fullName ? "#EF4444" : theme.border,
          borderWidth: 1,
        }}
        placeholder="Enter your full name"
        placeholderTextColor={theme.textSecondary}
        value={fullName}
        onChangeText={(val) => handleFieldChange("fullName", val)}
      />
      {errors.fullName && <Text className="text-xs text-red-500 mb-3">{errors.fullName}</Text>}

      {/* Email */}
      <Text className="text-sm mb-1" style={{ color: theme.text }}>
        Email Address
      </Text>
      <TextInput
        className="p-4 rounded-lg mb-1"
        style={{
          backgroundColor: theme.surface,
          color: theme.text,
          borderColor: errors.email ? "#EF4444" : theme.border,
          borderWidth: 1,
        }}
        placeholder="Enter your email"
        placeholderTextColor={theme.textSecondary}
        value={email}
        onChangeText={(val) => handleFieldChange("email", val)}
        autoCapitalize="none"
      />
      {errors.email && <Text className="text-xs text-red-500 mb-3">{errors.email}</Text>}

      {/* Phone */}
      <Text className="text-sm mb-1" style={{ color: theme.text }}>
        Phone Number
      </Text>
      <TextInput
        className="p-4 rounded-lg mb-1"
        style={{
          backgroundColor: theme.surface,
          color: theme.text,
          borderColor: errors.phone ? "#EF4444" : theme.border,
          borderWidth: 1,
        }}
        placeholder="Enter your phone number"
        placeholderTextColor={theme.textSecondary}
        value={phone}
        onChangeText={(val) => handleFieldChange("phone", val)}
        keyboardType="phone-pad"
      />
      {errors.phone && <Text className="text-xs text-red-500 mb-3">{errors.phone}</Text>}

      {/* Password */}
      <Text className="text-sm mb-1" style={{ color: theme.text }}>
        Password
      </Text>
      <View className="relative mb-1">
        <TextInput
          className="p-4 rounded-lg"
          style={{
            backgroundColor: theme.surface,
            color: theme.text,
            borderColor: errors.password ? "#EF4444" : theme.border,
            borderWidth: 1,
          }}
          placeholder="Create a password"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={(val) => handleFieldChange("password", val)}
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
      {errors.password && <Text className="text-xs text-red-500 mb-3">{errors.password}</Text>}

      {/* Confirm Password */}
      <Text className="text-sm mb-1" style={{ color: theme.text }}>
        Confirm Password
      </Text>
      <View className="relative mb-1">
        <TextInput
          className="p-4 rounded-lg"
          style={{
            backgroundColor: theme.surface,
            color: theme.text,
            borderColor: errors.confirmPassword ? "#EF4444" : theme.border,
            borderWidth: 1,
          }}
          placeholder="Confirm your password"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={!showConfirm}
          value={confirmPassword}
          onChangeText={(val) => handleFieldChange("confirmPassword", val)}
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
      {errors.confirmPassword && (
        <Text className="text-xs text-red-500 mb-4">{errors.confirmPassword}</Text>
      )}

      {/* Terms agreement */}
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
        className={`py-4 rounded-lg mb-4 ${loading ? "opacity-70" : ""}`}
        style={{ backgroundColor: theme.primary }}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">
            Create Account
          </Text>
        )}
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