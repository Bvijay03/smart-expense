import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { useTheme } from "@/shared/hooks/useTheme";
import { borderRadius, spacing } from "@/shared/theme";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.cardShadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

import { Image } from "react-native";
import { useAuthStore } from "@/modules/authentication/store/authStore";
import { Ionicons } from "@expo/vector-icons";

export function ScreenHeader({
  title,
  subtitle,
  rightAction,
}: {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);

  return (
    <View style={[styles.header, styles.headerRow]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        {rightAction ? rightAction : null}
        {user?.avatarUrl ? (
          <Image 
            source={{ uri: user.avatarUrl }} 
            style={[styles.headerAvatar, { borderColor: colors.primary }]} 
          />
        ) : (
          <View style={[styles.headerAvatarPlaceholder, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <Ionicons name="person" size={20} color={colors.primary} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: spacing.sm,
  },
  header: { marginBottom: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: spacing.xs },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  headerAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
