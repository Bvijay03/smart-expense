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
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  securityQuestion: z.string().min(5, "Security question must be at least 5 characters"),
  securityAnswer: z.string().min(1, "Answer is required"),
});

type FormData = z.infer<typeof schema>;
type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { colors } = useThemeStore();
  const register = useAuthStore((s) => s.register);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", securityQuestion: "", securityAnswer: "" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await register(data.name, data.email, data.password, data.securityQuestion, data.securityAnswer);
    } catch (err) {
      Alert.alert("Registration failed", getErrorMessage(err));
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
        </View>

        {/* Register Card */}
        <View style={[styles.card, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>JOIN INTELLIGENT WEALTH MANAGEMENT</Text>
          </View>

          <View style={styles.form}>
            {/* Name Input */}
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputGroup}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="person" size={20} color={colors.textSecondary} />
                  </View>
                  <TextInput
                    style={[
                      styles.glassInput,
                      { color: colors.text, borderBottomColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.03)" }
                    ]}
                    placeholder="Full Name"
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    onChangeText={onChange}
                  />
                  {errors.name && <Text style={[styles.errorText, { color: colors.error }]}>{errors.name.message}</Text>}
                </View>
              )}
            />

            {/* Email Input */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputGroup, { marginTop: spacing.md }]}>
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

            {/* Security Question Input */}
            <Controller
              control={control}
              name="securityQuestion"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputGroup, { marginTop: spacing.md }]}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="help-circle" size={20} color={colors.textSecondary} />
                  </View>
                  <TextInput
                    style={[
                      styles.glassInput,
                      { color: colors.text, borderBottomColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.03)" }
                    ]}
                    placeholder="Security Question (e.g. First pet?)"
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    onChangeText={onChange}
                  />
                  {errors.securityQuestion && <Text style={[styles.errorText, { color: colors.error }]}>{errors.securityQuestion.message}</Text>}
                </View>
              )}
            />

            {/* Security Answer Input */}
            <Controller
              control={control}
              name="securityAnswer"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputGroup, { marginTop: spacing.md }]}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="key" size={20} color={colors.textSecondary} />
                  </View>
                  <TextInput
                    style={[
                      styles.glassInput,
                      { color: colors.text, borderBottomColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.03)" }
                    ]}
                    placeholder="Answer"
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    onChangeText={onChange}
                  />
                  {errors.securityAnswer && <Text style={[styles.errorText, { color: colors.error }]}>{errors.securityAnswer.message}</Text>}
                </View>
              )}
            />

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
                    <Text style={[styles.glowBtnText, { color: colors.onPrimary }]}>Sign Up</Text>
                    <Ionicons name="arrow-forward" size={20} color={colors.onPrimary} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Switch to Login */}
          <View style={[styles.footer, { borderTopColor: "rgba(255,255,255,0.1)" }]}>
            <Text style={{ color: colors.textSecondary }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={{ color: colors.primary, fontWeight: "600" }}>Log In</Text>
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
  logoBox: { width: 64, height: 64, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm, shadowOffset: { width:0, height:8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  brandTitle: { fontSize: 24, fontFamily: "Hanken Grotesk", fontWeight: "700", letterSpacing: -0.5 },

  card: { borderRadius: 16, borderWidth: 1, padding: spacing.md, shadowOffset: { width:0, height:8 }, shadowOpacity: 0.4, shadowRadius: 32, elevation: 20 },
  cardHeader: { marginBottom: spacing.md },
  cardTitle: { fontSize: 24, fontFamily: "Hanken Grotesk", fontWeight: "500", marginBottom: 4 },
  cardSub: { fontSize: 12, fontFamily: "JetBrains Mono", opacity: 0.8, letterSpacing: 1 },

  form: { paddingBottom: spacing.sm },
  inputGroup: { position: "relative" },
  inputIcon: { position: "absolute", left: 16, top: 14, zIndex: 10 },
  glassInput: { width: "100%", height: 48, borderRadius: 8, borderBottomWidth: 1, paddingLeft: 48, paddingRight: 16, fontSize: 16, fontFamily: "Hanken Grotesk" },
  eyeIcon: { position: "absolute", right: 16, top: 14, zIndex: 10 },
  errorText: { fontSize: 12, marginTop: 4 },

  submitContainer: { marginTop: spacing.xl, paddingTop: spacing.sm },
  glowBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 8, shadowOffset: { width:0, height:0 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 5 },
  glowBtnText: { fontSize: 16, fontFamily: "Hanken Grotesk", fontWeight: "600" },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1 },
});
