import {
  ActivityIndicator,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "@/shared/hooks/useTheme";

interface LoadingStateProps {
  style?: ViewStyle;
}

export function LoadingState({ style }: LoadingStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});
