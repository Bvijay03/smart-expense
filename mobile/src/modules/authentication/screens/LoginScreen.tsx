import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/modules/authentication/store/authStore";
import { getErrorMessage } from "@/shared/services/api";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { AuthStackParamList } from "@/shared/navigation/types";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean(),
});

type FormData = z.infer<typeof schema>;
type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { colors } = useThemeStore();
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password, data.rememberMe);
    } catch (err) {
      Alert.alert("Login failed", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Background Decorative Elements */}
      <View style={[styles.bgBlobTop, { backgroundColor: colors.primary + "1A" }]} />
      <View style={[styles.bgBlobBottom, { backgroundColor: colors.primary + "1A" }]} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        
        {/* Logo Header */}
        <View style={styles.header}>
          <View style={[styles.logoBox, { backgroundColor: colors.surface + "99", borderColor: "rgba(255,255,255,0.1)" }]}>
            <Ionicons name="wallet" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.primary }]}>Smart Expense</Text>
          <Text style={[styles.brandSub, { color: colors.textSecondary }]}>Intelligent Wealth Management</Text>
        </View>

        {/* Login Card */}
        <View style={[styles.card, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Welcome Back</Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>ACCESS YOUR DASHBOARD</Text>
          </View>

          <View style={styles.form}>
            {/* Email Input */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputGroup}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="mail" size={20} color={colors.textSecondary} />
                  </View>
                  <TextInput
                    style={[
                      styles.glassInput,
                      { color: colors.text, borderBottomColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.03)" }
                    ]}
                    placeholder="Email Address"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                  />
                  {errors.email && <Text style={[styles.errorText, { color: colors.error }]}>{errors.email.message}</Text>}
                </View>
              )}
            />

            {/* Password Input */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputGroup, { marginTop: spacing.md }]}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="lock-closed" size={20} color={colors.textSecondary} />
                  </View>
                  <TextInput
                    style={[
                      styles.glassInput,
                      { color: colors.text, borderBottomColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.03)", paddingRight: 48 }
                    ]}
                    placeholder="Password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showPassword}
                    value={value}
                    onChangeText={onChange}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  {errors.password && <Text style={[styles.errorText, { color: colors.error }]}>{errors.password.message}</Text>}
                </View>
              )}
            />

            {/* Options Row */}
            <View style={styles.optionsRow}>
              <Controller
                control={control}
                name="rememberMe"
                render={({ field: { onChange, value } }) => (
                  <TouchableOpacity style={styles.rememberBtn} onPress={() => onChange(!value)} activeOpacity={0.8}>
                    <View style={[
                      styles.checkbox,
                      value 
                        ? { backgroundColor: colors.primary, borderColor: colors.primary } 
                        : { backgroundColor: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)" }
                    ]}>
                      {value && <Ionicons name="checkmark" size={14} color={colors.onPrimary} />}
                    </View>
                    <Text style={[styles.rememberText, { color: colors.textSecondary }]}>Remember Me</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <View style={styles.submitContainer}>
              <TouchableOpacity 
                style={[styles.glowBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <>
                    <Text style={[styles.glowBtnText, { color: colors.onPrimary }]}>Login</Text>
                    <Ionicons name="arrow-forward" size={20} color={colors.onPrimary} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Switch to Sign Up */}
          <View style={[styles.footer, { borderTopColor: "rgba(255,255,255,0.1)" }]}>
            <Text style={{ color: colors.textSecondary }}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={{ color: colors.primary, fontWeight: "600" }}>Sign Up</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: "relative", overflow: "hidden" },
  
  bgBlobTop: { position: "absolute", top: "-10%", left: "-20%", width: 300, height: 300, borderRadius: 150, opacity: 0.7, zIndex: 0 },
  bgBlobBottom: { position: "absolute", bottom: "-10%", right: "-20%", width: 300, height: 300, borderRadius: 150, opacity: 0.7, zIndex: 0 },

  content: { flexGrow: 1, justifyContent: "center", padding: spacing.md, zIndex: 10 },

  header: { alignItems: "center", marginBottom: spacing.xl },
  logoBox: { width: 64, height: 64, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: spacing.md, shadowOffset: { width:0, height:8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  brandTitle: { fontSize: 32, fontFamily: "Hanken Grotesk", fontWeight: "700", letterSpacing: -0.5 },
  brandSub: { fontSize: 16, fontFamily: "Hanken Grotesk", marginTop: 4 },

  card: { borderRadius: 16, borderWidth: 1, padding: spacing.md, shadowOffset: { width:0, height:8 }, shadowOpacity: 0.4, shadowRadius: 32, elevation: 20 },
  cardHeader: { marginBottom: spacing.lg },
  cardTitle: { fontSize: 24, fontFamily: "Hanken Grotesk", fontWeight: "500", marginBottom: 4 },
  cardSub: { fontSize: 12, fontFamily: "JetBrains Mono", opacity: 0.8, letterSpacing: 1 },

  form: { paddingBottom: spacing.sm },
  inputGroup: { position: "relative" },
  inputIcon: { position: "absolute", left: 16, top: 14, zIndex: 10 },
  glassInput: { width: "100%", height: 48, borderRadius: 8, borderBottomWidth: 1, paddingLeft: 48, paddingRight: 16, fontSize: 16, fontFamily: "Hanken Grotesk" },
  eyeIcon: { position: "absolute", right: 16, top: 14, zIndex: 10 },
  errorText: { fontSize: 12, marginTop: 4 },

  optionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.md, paddingTop: spacing.xs },
  rememberBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  rememberText: { fontSize: 12, fontFamily: "JetBrains Mono" },
  forgotText: { fontSize: 12, fontFamily: "JetBrains Mono" },

  submitContainer: { marginTop: spacing.xl, paddingTop: spacing.sm },
  glowBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 8, shadowOffset: { width:0, height:0 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 5 },
  glowBtnText: { fontSize: 16, fontFamily: "Hanken Grotesk", fontWeight: "600" },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1 },
});
