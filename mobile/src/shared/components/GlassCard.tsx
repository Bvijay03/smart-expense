import { Animated, StyleSheet, TouchableWithoutFeedback, View, ViewProps } from "react-native";
import { useTheme } from "@/shared/hooks/useTheme";
import { borderRadius, spacing } from "@/shared/theme";
import { useRef } from "react";

interface GlassCardProps extends ViewProps {
  intensity?: number;
  tint?: "light" | "dark" | "default";
  pressable?: boolean;
  onPress?: () => void;
}

export function GlassCard({
  children,
  style,
  intensity = 20,
  tint = "dark",
  pressable,
  onPress,
  ...props
}: GlassCardProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  const isPressable = pressable || !!onPress;

  const animatedStyle = {
    transform: [{ scale }],
  };

  const content = (
    <Animated.View
      style={[
        styles.container,
        {
          borderColor: colors.border,
          shadowColor: colors.cardShadow,
          backgroundColor: `rgba(255, 255, 255, ${intensity / 400})`,
        },
        animatedStyle,
        style,
      ]}
      {...props}
    >
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );

  if (isPressable) {
    return (
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        {content}
      </TouchableWithoutFeedback>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
    marginVertical: spacing.sm,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  blur: {
    borderRadius: borderRadius.md,
  },
  content: {
    padding: spacing.md,
    backgroundColor: "transparent",
  },
});
