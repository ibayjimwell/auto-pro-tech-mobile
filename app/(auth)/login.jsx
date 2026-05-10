import { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from "react-native";
import { Link, router } from "expo-router";
// Using Expo Vector Icons as requested
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { z } from "zod";

// --- Validation Schema ---
const loginSchema = z.object({
  emailOrPhone: z.string().min(1, "Email or phone number is required"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginScreen() {
  const { theme } = useTheme();
  const { login } = useAuth();
  
  // --- State Management ---
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState("");

  // --- Logic Handlers ---
  const handleFieldChange = (field, value) => {
    if (field === "emailOrPhone") setEmailOrPhone(value);
    else setPassword(value);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
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
    // KeyboardAvoidingView ensures inputs remain visible when the keyboard is active
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      style={{ backgroundColor: theme.background }}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-8 py-10">
          
          {/* --- Brand Header Section --- */}
          <View className="mb-12 items-center sm:items-start">
            <View 
              className="w-20 h-20 rounded-3xl items-center justify-center mb-6 shadow-lg shadow-primary/20"
              style={{ backgroundColor: theme.primary }}
            >
              <MaterialCommunityIcons name="car-wrench" color="white" size={40} />
            </View>
            <Text className="text-4xl font-black tracking-tight mb-2 text-center sm:text-left" style={{ color: theme.text }}>
              AutoCare
            </Text>
            <Text className="text-lg leading-6 opacity-60 text-center sm:text-left" style={{ color: theme.textSecondary }}>
              Your trusted automotive repair partner.
            </Text>
          </View>

          {/* --- Form Container --- */}
          <View className="space-y-5">
            
            {/* Email / Phone Field */}
            <View>
              <Text className="text-[12px] font-bold uppercase tracking-widest mb-2 ml-1" style={{ color: theme.textSecondary }}>
                Email or Phone
              </Text>
              <View 
                className="flex-row items-center rounded-2xl px-4 h-16 border transition-all"
                style={{ 
                  backgroundColor: theme.surface, 
                  borderColor: errors.emailOrPhone ? "#EF4444" : theme.border 
                }}
              >
                <Ionicons name="mail-outline" size={20} color={theme.textSecondary} style={{ marginRight: 12 }} />
                <TextInput
                  className="flex-1 text-base font-medium"
                  style={{ color: theme.text }}
                  placeholder="Enter your credentials"
                  placeholderTextColor={theme.textSecondary + "80"}
                  value={emailOrPhone}
                  onChangeText={(val) => handleFieldChange("emailOrPhone", val)}
                  autoCapitalize="none"
                />
              </View>
              {errors.emailOrPhone && (
                <Text className="text-xs text-red-500 mt-1 ml-2 font-medium">{errors.emailOrPhone}</Text>
              )}
            </View>

            {/* Password Field */}
            <View>
              <Text className="text-[12px] font-bold uppercase tracking-widest mb-2 ml-1" style={{ color: theme.textSecondary }}>
                Password
              </Text>
              <View 
                className="flex-row items-center rounded-2xl px-4 h-16 border transition-all"
                style={{ 
                  backgroundColor: theme.surface, 
                  borderColor: errors.password ? "#EF4444" : theme.border 
                }}
              >
                <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} style={{ marginRight: 12 }} />
                <TextInput
                  className="flex-1 text-base font-medium"
                  style={{ color: theme.text }}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.textSecondary + "80"}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(val) => handleFieldChange("password", val)}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowPassword(!showPassword)}
                  className="p-2"
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text className="text-xs text-red-500 mt-1 ml-2 font-medium">{errors.password}</Text>
              )}
            </View>

            {/* Login Error Feedback */}
            {loginError && (
              <View className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800/30 flex-row items-center">
                <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                <Text className="text-xs text-red-600 dark:text-red-400 font-semibold">{loginError}</Text>
              </View>
            )}

            {/* Forgot Password */}
            <TouchableOpacity className="self-end py-1">
              <Text className="font-bold text-sm" style={{ color: theme.primary }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              className={`h-16 rounded-2xl items-center justify-center shadow-lg transition-all ${loading ? "opacity-70" : ""}`}
              style={{ 
                backgroundColor: theme.primary,
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4
              }}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <View className="flex-row items-center">
                  <Text className="text-white text-center font-bold text-lg mr-2">Sign In</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </View>
              )}
            </TouchableOpacity>

          </View>

          {/* --- Footer Section --- */}
          <View className="mt-12 items-center">
            <View className="flex-row items-center mb-6">
              <View className="h-[1px] flex-1 bg-gray-200 dark:bg-gray-800" />
              <Text className="mx-4 text-xs font-bold uppercase tracking-widest" style={{ color: theme.textSecondary }}>
                New to the platform?
              </Text>
              <View className="h-[1px] flex-1 bg-gray-200 dark:bg-gray-800" />
            </View>

            <Link href="/signup" asChild>
              <TouchableOpacity className="flex-row items-center py-2">
                <Text className="text-base font-medium mr-1" style={{ color: theme.textSecondary }}>
                  Don't have an account?
                </Text>
                <Text className="text-base font-black" style={{ color: theme.primary }}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </Link>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}