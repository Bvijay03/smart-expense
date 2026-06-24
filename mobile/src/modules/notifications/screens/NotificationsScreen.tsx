import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { notificationService } from "@/shared/services/modules";
import { Card, ScreenHeader } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { LoadingState } from "@/shared/components/LoadingState";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorState } from "@/shared/components/ErrorState";
import { useTheme } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";

export function NotificationsScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.list().then((r) => r.data.data),
  });

  const markAllRead = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (isLoading) return <LoadingState />;
  if (isError) {
    return <ErrorState message="Failed to load notifications" onRetry={refetch} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ScreenHeader title="Notifications" />
        {data?.some((n) => !n.read) ? (
          <Button
            title="Mark all read"
            variant="secondary"
            onPress={() => markAllRead.mutate()}
          />
        ) : null}
      </View>

      {!data?.length ? (
        <EmptyState title="No notifications" icon="notifications-outline" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card
              style={{
                opacity: item.read ? 0.7 : 1,
                borderLeftWidth: 4,
                borderLeftColor: item.read ? colors.border : colors.primary,
              }}
            >
              <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
              <Text style={{ color: colors.textSecondary }}>{item.body}</Text>
              <Text style={[styles.date, { color: colors.textSecondary }]}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  header: { marginBottom: spacing.sm },
  list: { paddingBottom: spacing.xl },
  title: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  date: { fontSize: 12, marginTop: spacing.xs },
});
