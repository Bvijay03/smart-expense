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
          renderItem={({ item }) => {
            const net = item.userNetBalance ?? 0;
            const contribution = item.userContribution ?? 0;
            const isPositive = net > 0;
            const isNeutral = net === 0;
            const netColor = isNeutral
              ? colors.textSecondary
              : isPositive
                ? colors.success
                : colors.error;
            const netLabel = isNeutral
              ? "Settled up"
              : isPositive
                ? `You get ₹${net.toFixed(2)}`
                : `You owe ₹${Math.abs(net).toFixed(2)}`;
            const netIcon = isNeutral
              ? "checkmark-circle-outline"
              : isPositive
                ? "arrow-down-circle-outline"
                : "arrow-up-circle-outline";

            return (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("GroupDetail", {
                    groupId: item.id,
                    groupName: item.name,
                  })
                }
              >
                <Card style={styles.card}>
                  {/* Top row: name + member count */}
                  <View style={styles.cardTop}>
                    <View style={[styles.groupIcon, { backgroundColor: colors.primary + "18" }]}>
                      <Ionicons name="people" size={22} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={[styles.meta, { color: colors.textSecondary }]}>
                        {item.members?.length ?? 0} members · {item.expenseCount ?? 0} expenses
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </View>

                  {/* Divider */}
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  {/* Stats row */}
                  <View style={styles.statsRow}>
                    {/* Net balance */}
                    <View style={styles.statItem}>
                      <View style={styles.statLabelRow}>
                        <Ionicons name={netIcon} size={14} color={netColor} />
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          Balance
                        </Text>
                      </View>
                      <Text style={[styles.statValue, { color: netColor }]}>
                        {netLabel}
                      </Text>
                    </View>

                    {/* Vertical separator */}
                    <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

                    {/* Contribution */}
                    <View style={styles.statItem}>
                      <View style={styles.statLabelRow}>
                        <Ionicons name="wallet-outline" size={14} color={colors.primary} />
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          Contributed
                        </Text>
                      </View>
                      <Text style={[styles.statValue, { color: colors.primary }]}>
                        ₹{contribution.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  fab: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    marginTop: spacing.sm,
  },
  list: { paddingBottom: spacing.xl },

  // Card
  card: { paddingVertical: spacing.md },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  groupIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  name: { fontSize: 17, fontWeight: "700" },
  meta: { fontSize: 12, marginTop: 2 },

  // Dividers
  divider: { height: 1, marginBottom: spacing.sm },
  verticalDivider: { width: 1, marginHorizontal: spacing.sm },

  // Stats
  statsRow: { flexDirection: "row", alignItems: "center" },
  statItem: { flex: 1 },
  statLabelRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  statLabel: { fontSize: 11, fontWeight: "500" },
  statValue: { fontSize: 14, fontWeight: "700" },
});