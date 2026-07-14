import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
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
  email: z.email("Please enter a valid email address"),
});

type FormData = z.infer<typeof schema>;

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await forgotPassword(data.email);
      Alert.alert(
        "Email Sent",
        "If an account with that email exists, we've sent you instructions to reset your password.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
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
        <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>

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

        <View style={styles.actions}>
          <Button title="Send Reset Link" loading={loading} onPress={handleSubmit(onSubmit)} />
          <Button 
            title="Back to Login" 
            variant="outline"
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", padding: spacing.lg },
  title: { fontSize: 28, fontWeight: "700", marginBottom: spacing.sm },
  subtitle: { fontSize: 16, marginBottom: spacing.xl, lineHeight: 22 },
  actions: { marginTop: spacing.md },
  backButton: { marginTop: spacing.md },
});
