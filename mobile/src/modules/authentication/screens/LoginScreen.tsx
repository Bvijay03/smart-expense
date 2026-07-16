import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Switch,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/modules/authentication/store/authStore";
import { Input } from "@/shared/components/Input";
import { Button } from "@/shared/components/Button";
import { getErrorMessage } from "@/shared/services/api";
import { useTheme } from "@/shared/hooks/useTheme";
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
  const { colors } = useTheme();
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);
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
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.brand, { color: colors.primary }]}>
          Smart Expense
        </Text>
        <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Email"
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Password"
              value={value}
              onChangeText={onChange}
              secureTextEntry
              error={errors.password?.message}
            />
          )}
        />

        <View style={styles.optionsContainer}>
          <View style={styles.rememberMeContainer}>
            <Controller
              control={control}
              name="rememberMe"
              render={({ field: { onChange, value } }) => (
                <>
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    style={{ transform: [{ scale: 0.8 }] }}
                  />
                  <Text style={[styles.rememberMeText, { color: colors.textSecondary }]}>
                    Remember me
                  </Text>
                </>
              )}
            />
          </View>
          
          <Text
            style={[styles.forgotPasswordText, { color: colors.primary }]}
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            Forgot Password?
          </Text>
        </View>

        <Button title="Sign In" loading={loading} onPress={handleSubmit(onSubmit)} />

        <View style={styles.footer}>
          <Text style={{ color: colors.textSecondary }}>
            Don't have an account?{" "}
          </Text>
          <Text
            style={{ color: colors.primary, fontWeight: "600" }}
            onPress={() => navigation.navigate("Register")}
          >
            Register
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", padding: spacing.lg },
  brand: { fontSize: 14, fontWeight: "700", marginBottom: spacing.sm },
  title: { fontSize: 28, fontWeight: "700", marginBottom: spacing.lg },
  optionsContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xl },
  rememberMeContainer: { flexDirection: "row", alignItems: "center", marginLeft: -8 },
  rememberMeText: { marginLeft: spacing.xs, fontSize: 14 },
  forgotPasswordText: { fontSize: 14, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
});
