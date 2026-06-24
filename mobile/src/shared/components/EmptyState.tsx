import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/shared/hooks/useTheme";
import { borderRadius, spacing } from "@/shared/theme";

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export function EmptyState({
  title,
  message,
  icon = "folder-open-outline",
  style,
}: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon} size={48} color={colors.textSecondary} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: spacing.md,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: "center",
    lineHeight: 20,
  },
});
