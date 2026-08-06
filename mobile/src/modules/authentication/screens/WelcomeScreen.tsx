import React, { useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { AuthStackParamList } from "@/shared/navigation/types";
import { spacing } from "@/shared/theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

export function WelcomeScreen({ navigation }: Props) {
  const { colors } = useThemeStore();
  
  // Pulse animation value for the logo glow
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Ambient Glows */}
      <View style={[styles.ambientGlowTop, { backgroundColor: colors.primary + "1A" }]} />
      <View style={[styles.ambientGlowBottom, { backgroundColor: colors.primary + "1A" }]} />

      <View style={styles.centerContent}>
        {/* Glowing Logo */}
        <Animated.View style={[
          styles.logoContainer, 
          { 
            backgroundColor: colors.surface + "4D", 
            borderColor: "rgba(255,255,255,0.1)",
            transform: [{ scale: pulseAnim }],
            shadowColor: colors.primary,
          }
        ]}>
          <Ionicons name="wallet" size={80} color={colors.primary} />
          {/* Inner Glow Ring simulation */}
          <View style={[styles.innerGlowRing, { borderColor: colors.primary + "4D" }]} />
        </Animated.View>

        {/* Brand Identity */}
        <View style={styles.brandContent}>
          <Text style={[styles.title, { color: colors.primary }]}>Smart Expense</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Intelligent Wealth Management</Text>
        </View>
      </View>

      {/* Action Area */}
      <View style={styles.actionArea}>
        <TouchableOpacity 
          style={styles.actionButtonContainer}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Login")}
        >
          {/* Outer glow effect */}
          <View style={[styles.buttonOuterGlow, { backgroundColor: colors.primary }]} />
          
          <View style={[styles.actionButton, { backgroundColor: colors.primary, borderColor: colors.primary + "33" }]}>
            <Text style={[styles.actionButtonText, { color: colors.onPrimary }]}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.onPrimary} style={styles.actionIcon} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.secureText, { color: colors.textSecondary }]}>SECURE & ENCRYPTED</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: "relative", overflow: "hidden", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.xl, paddingHorizontal: spacing.md },
  
  ambientGlowTop: { position: "absolute", top: "25%", left: -80, width: 384, height: 384, borderRadius: 192, opacity: 0.8 },
  ambientGlowBottom: { position: "absolute", bottom: "25%", right: -80, width: 384, height: 384, borderRadius: 192, opacity: 0.8 },

  centerContent: { flex: 1, alignItems: "center", justifyContent: "center", width: "100%", zIndex: 10 },
  
  logoContainer: { width: 160, height: 160, borderRadius: 80, borderWidth: 1, alignItems: "center", justifyContent: "center", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 10, position: "relative" },
  innerGlowRing: { position: "absolute", inset: 0, borderRadius: 80, borderWidth: 1 },
  
  brandContent: { alignItems: "center", marginTop: spacing.lg },
  title: { fontSize: 48, fontFamily: "Hanken Grotesk", fontWeight: "700", letterSpacing: -1, textAlign: "center" },
  subtitle: { fontSize: 16, fontFamily: "Hanken Grotesk", opacity: 0.8, marginTop: spacing.xs },

  actionArea: { width: "100%", alignItems: "center", marginTop: spacing.xl, zIndex: 10 },
  actionButtonContainer: { width: "100%", position: "relative" },
  buttonOuterGlow: { position: "absolute", inset: -4, borderRadius: 9999, opacity: 0.4 },
  actionButton: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 9999, borderWidth: 1 },
  actionButtonText: { fontSize: 20, fontFamily: "Hanken Grotesk", fontWeight: "600" },
  actionIcon: { marginLeft: spacing.xs },
  
  secureText: { fontSize: 12, fontFamily: "JetBrains Mono", opacity: 0.5, marginTop: spacing.md, letterSpacing: 1 },
});
