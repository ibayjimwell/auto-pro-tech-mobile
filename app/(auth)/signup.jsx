import { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform 
} from "react-native";
import { Link, router } from "expo-router";
// Using Expo Vector Icons for consistent Material look
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { z } from "zod";

// --- Validation Schema ---
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

  // --- State Management ---
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

  // --- Logic Handlers ---
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      style={{ backgroundColor: theme.background }}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className="px-8 pt-10"
      >
        {/* --- Header Section --- */}
        <View className="mb-10 items-center sm:items-start">
          <View 
            className="w-16 h-16 rounded-2xl items-center justify-center mb-6 shadow-lg shadow-primary/20"
            style={{ backgroundColor: theme.primary }}
          >
            <MaterialCommunityIcons name="account-plus-outline" color="white" size={32} />
          </View>
          <Text className="text-4xl font-black tracking-tight mb-2" style={{ color: theme.text }}>
            Join AutoCare
          </Text>
          <Text className="text-lg opacity-60 leading-6" style={{ color: theme.textSecondary }}>
            Create your account to start managing your vehicle service.
          </Text>
        </View>

        {/* --- Form Section --- */}
        <View className="space-y-4">
          
          {/* Full Name Field */}
          <View>
            <Text className="text-[11px] font-black uppercase tracking-widest mb-2 ml-1 opacity-70" style={{ color: theme.textSecondary }}>
              Full Name
            </Text>
            <View 
              className="flex-row items-center rounded-2xl px-4 h-15 border transition-all"
              style={{ backgroundColor: theme.surface, borderColor: errors.fullName ? "#EF4444" : theme.border, borderWidth: 1 }}
            >
              <Ionicons name="person-outline" size={18} color={theme.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                className="flex-1 text-base py-3"
                style={{ color: theme.text }}
                placeholder="John Doe"
                placeholderTextColor={theme.textSecondary + "70"}
                value={fullName}
                onChangeText={(val) => handleFieldChange("fullName", val)}
              />
            </View>
            {errors.fullName && <Text className="text-xs text-red-500 mt-1 ml-2 font-medium">{errors.fullName}</Text>}
          </View>

          {/* Email Field */}
          <View>
            <Text className="text-[11px] font-black uppercase tracking-widest mb-2 ml-1 opacity-70" style={{ color: theme.textSecondary }}>
              Email Address
            </Text>
            <View 
              className="flex-row items-center rounded-2xl px-4 h-15 border transition-all"
              style={{ backgroundColor: theme.surface, borderColor: errors.email ? "#EF4444" : theme.border, borderWidth: 1 }}
            >
              <Ionicons name="mail-outline" size={18} color={theme.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                className="flex-1 text-base py-3"
                style={{ color: theme.text }}
                placeholder="email@example.com"
                placeholderTextColor={theme.textSecondary + "70"}
                value={email}
                onChangeText={(val) => handleFieldChange("email", val)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {errors.email && <Text className="text-xs text-red-500 mt-1 ml-2 font-medium">{errors.email}</Text>}
          </View>

          {/* Phone Field */}
          <View>
            <Text className="text-[11px] font-black uppercase tracking-widest mb-2 ml-1 opacity-70" style={{ color: theme.textSecondary }}>
              Phone Number
            </Text>
            <View 
              className="flex-row items-center rounded-2xl px-4 h-15 border transition-all"
              style={{ backgroundColor: theme.surface, borderColor: errors.phone ? "#EF4444" : theme.border, borderWidth: 1 }}
            >
              <Ionicons name="call-outline" size={18} color={theme.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                className="flex-1 text-base py-3"
                style={{ color: theme.text }}
                placeholder="0912 345 6789"
                placeholderTextColor={theme.textSecondary + "70"}
                value={phone}
                onChangeText={(val) => handleFieldChange("phone", val)}
                keyboardType="phone-pad"
              />
            </View>
            {errors.phone && <Text className="text-xs text-red-500 mt-1 ml-2 font-medium">{errors.phone}</Text>}
          </View>

          {/* Password Field */}
          <View>
            <Text className="text-[11px] font-black uppercase tracking-widest mb-2 ml-1 opacity-70" style={{ color: theme.textSecondary }}>
              Security
            </Text>
            <View 
              className="flex-row items-center rounded-2xl px-4 h-15 border transition-all"
              style={{ backgroundColor: theme.surface, borderColor: errors.password ? "#EF4444" : theme.border, borderWidth: 1 }}
            >
              <Ionicons name="lock-closed-outline" size={18} color={theme.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                className="flex-1 text-base py-3"
                style={{ color: theme.text }}
                placeholder="Create password"
                placeholderTextColor={theme.textSecondary + "70"}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(val) => handleFieldChange("password", val)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            {errors.password && <Text className="text-xs text-red-500 mt-1 ml-2 font-medium">{errors.password}</Text>}
          </View>

          {/* Confirm Password */}
          <View>
            <View 
              className="flex-row items-center rounded-2xl px-4 h-15 border transition-all mt-2"
              style={{ backgroundColor: theme.surface, borderColor: errors.confirmPassword ? "#EF4444" : theme.border, borderWidth: 1 }}
            >
              <Ionicons name="checkmark-shield-outline" size={18} color={theme.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                className="flex-1 text-base py-3"
                style={{ color: theme.text }}
                placeholder="Repeat password"
                placeholderTextColor={theme.textSecondary + "70"}
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={(val) => handleFieldChange("confirmPassword", val)}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} className="p-1">
                <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text className="text-xs text-red-500 mt-1 ml-2 font-medium">{errors.confirmPassword}</Text>}
          </View>

          {/* Terms Agreement */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row items-start mt-6 mb-4 px-1"
            onPress={() => setAgree(!agree)}
          >
            <View 
              className="w-6 h-6 rounded-md items-center justify-center mr-3 border-2"
              style={{ 
                borderColor: agree ? theme.primary : theme.border,
                backgroundColor: agree ? theme.primary : 'transparent'
              }}
            >
              {agree && <Ionicons name="checkmark" size={16} color="white" />}
            </View>
            <Text className="flex-1 text-sm leading-5 font-medium opacity-80" style={{ color: theme.textSecondary }}>
              I agree to the <Text className="font-bold" style={{ color: theme.primary }}>Terms of Service</Text> and <Text className="font-bold" style={{ color: theme.primary }}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          {/* Submit Action */}
          <TouchableOpacity
            activeOpacity={0.8}
            className={`h-16 rounded-2xl items-center justify-center shadow-lg shadow-primary/30 mt-2 ${loading ? "opacity-70" : ""}`}
            style={{ backgroundColor: theme.primary }}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-bold text-lg uppercase tracking-widest">
                Create Account
              </Text>
            )}
          </TouchableOpacity>

        </View>

        {/* --- Footer Section --- */}
        <View className="mt-12 mb-10 items-center">
          <View className="flex-row items-center mb-6 w-full">
            <View className="h-[1px] flex-1 bg-gray-200 dark:bg-gray-800" />
            <Text className="mx-4 text-xs font-black opacity-30 uppercase tracking-[0.2em]" style={{ color: theme.textSecondary }}>
              Registered
            </Text>
            <View className="h-[1px] flex-1 bg-gray-200 dark:bg-gray-800" />
          </View>

          <Link href="/login" asChild>
            <View className="flex-row items-center ">
              <Text className="text-sm font-medium mr-1" style={{ color: theme.textSecondary }}>
                Have an account?
              </Text>
              <Text className="text-sm font-black" style={{ color: theme.primary }}>
                Sign In
              </Text>
            </View>
          </Link>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}