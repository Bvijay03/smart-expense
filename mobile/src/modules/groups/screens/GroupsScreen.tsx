import { useQuery } from "@tanstack/react-query";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { groupService } from "@/shared/services/modules";
import { Card, ScreenHeader } from "@/shared/components/Card";
import { LoadingState } from "@/shared/components/LoadingState";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorState } from "@/shared/components/ErrorState";
import { useTheme } from "@/shared/hooks/useTheme";
import { spacing } from "@/shared/theme";
import { RootStackParamList } from "@/shared/navigation/types";

export function GroupsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["groups"],
    queryFn: () => groupService.list().then((r) => r.data.data),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load groups" onRetry={refetch} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <ScreenHeader title="Groups" subtitle="Shared expenses with friends" />
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("CreateGroup")}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {!data?.length ? (
        <EmptyState
          title="No groups yet"
          message="Create a group to split bills"
          icon="people-outline"
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("GroupDetail", {
                  groupId: item.id,
                  groupName: item.name,
                })
              }
            >
              <Card>
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                <Text style={{ color: colors.textSecondary }}>
                  {item.members?.length ?? 0} members · {item.expenseCount ?? 0} expenses
                </Text>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  list: { paddingBottom: spacing.xl },
  name: { fontSize: 17, fontWeight: "600", marginBottom: 4 },
});
