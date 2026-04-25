import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { z } from "zod";

const loginSchema = z.object({
  emailOrPhone: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginScreen() {
  const { theme } = useTheme();
  const { login } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState(""); // inline error for wrong credentials

  const handleFieldChange = (field, value) => {
    if (field === "emailOrPhone") setEmailOrPhone(value);
    else setPassword(value);
    // Clear field-specific error if exists
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    // Clear global login error when user types
    if (loginError) setLoginError("");
  };

  const handleLogin = async () => {
      setLoginError("");
      try {
        loginSchema.parse({ emailOrPhone, password });
        setErrors({});
      } catch (err) {
        const formattedErrors = {};
        err.issues.forEach((issue) => {
          formattedErrors[issue.path[0]] = issue.message;
        });
        setErrors(formattedErrors);
        return;
      }

      setLoading(true);
      const result = await login(emailOrPhone, password);
      setLoading(false);

      if (result.success) {
        router.replace("/(tabs)");
      } else {
        setLoginError(result.message || "Login failed. Please try again.");
      }
  };

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

      {/* Email / Phone Field */}
      <Text className="text-sm mb-1" style={{ color: theme.text }}>
        Email or Phone Number
      </Text>
      <TextInput
        className="p-4 rounded-lg mb-1"
        style={{
          backgroundColor: theme.surface,
          color: theme.text,
          borderColor: errors.emailOrPhone ? "#EF4444" : theme.border,
          borderWidth: 1,
        }}
        placeholder="Enter email or phone"
        placeholderTextColor={theme.textSecondary}
        value={emailOrPhone}
        onChangeText={(val) => handleFieldChange("emailOrPhone", val)}
        autoCapitalize="none"
      />
      {errors.emailOrPhone && (
        <Text className="text-xs text-red-500 mb-3">{errors.emailOrPhone}</Text>
      )}

      {/* Password Field */}
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
          placeholder="Enter your password"
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
      {errors.password && (
        <Text className="text-xs text-red-500 mb-2">{errors.password}</Text>
      )}

      {/* Inline login error (e.g., Invalid credentials) */}
      {loginError ? (
        <Text className="text-xs text-red-500 mb-4">{loginError}</Text>
      ) : (
        /* spacer to keep layout consistent */
        <View className="mb-4" />
      )}

      <TouchableOpacity className="self-end mb-6">
        <Text style={{ color: theme.primary }}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className={`py-4 rounded-lg mb-4 ${loading ? "opacity-70" : ""}`}
        style={{ backgroundColor: theme.primary }}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-semibold text-lg">Sign In</Text>
        )}
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
    </View>
  );
}