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

const step1Schema = z.object({
  email: z.email("Please enter a valid email address"),
});

const step2Schema = z.object({
  securityAnswer: z.string().min(1, "Answer is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { getSecurityQuestion, resetPasswordWithSecurity } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { email: "" },
  });

  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { securityAnswer: "", newPassword: "" },
  });

  const onSubmitStep1 = async (data: Step1Data) => {
    setLoading(true);
    try {
      const question = await getSecurityQuestion(data.email);
      setEmail(data.email);
      setSecurityQuestion(question);
      setStep(2);
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onSubmitStep2 = async (data: Step2Data) => {
    setLoading(true);
    try {
      await resetPasswordWithSecurity(email, data.securityAnswer, data.newPassword);
      Alert.alert(
        "Success",
        "Your password has been successfully updated. You can now log in.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
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
        
        {step === 1 ? (
          <>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter your email address to answer your security question.
            </Text>
            <Controller
              control={form1.control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={form1.formState.errors.email?.message}
                />
              )}
            />
            <View style={styles.actions}>
              <Button title="Continue" loading={loading} onPress={form1.handleSubmit(onSubmitStep1)} />
              <Button 
                title="Back to Login" 
                variant="secondary"
                onPress={() => navigation.goBack()} 
                style={styles.backButton}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Answer your security question to set a new password.
            </Text>
            <Text style={[styles.questionLabel, { color: colors.primary }]}>
              Q: {securityQuestion}
            </Text>
            
            <Controller
              control={form2.control}
              name="securityAnswer"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Your Answer"
                  value={value}
                  onChangeText={onChange}
                  error={form2.formState.errors.securityAnswer?.message}
                />
              )}
            />
            <Controller
              control={form2.control}
              name="newPassword"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="New Password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  error={form2.formState.errors.newPassword?.message}
                />
              )}
            />
            <View style={styles.actions}>
              <Button title="Reset Password" loading={loading} onPress={form2.handleSubmit(onSubmitStep2)} />
              <Button 
                title="Back" 
                variant="secondary"
                onPress={() => setStep(1)} 
                style={styles.backButton}
              />
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", padding: spacing.lg },
  title: { fontSize: 28, fontWeight: "700", marginBottom: spacing.sm },
  subtitle: { fontSize: 16, marginBottom: spacing.xl, lineHeight: 22 },
  questionLabel: { fontSize: 18, fontWeight: "600", marginBottom: spacing.lg, fontStyle: "italic" },
  actions: { marginTop: spacing.md },
  backButton: { marginTop: spacing.md },
});
