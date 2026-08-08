import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "@/shared/hooks/useTheme";
import { friendsService } from "@/shared/services/modules";
import { GlassCard } from "@/shared/components/GlassCard";
import { spacing } from "@/shared/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function FriendsScreen() {
  const { colors, isDark } = useThemeStore();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const { data: requestsRes, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: () => friendsService.getRequests().then(r => r.data.data),
  });

  const { data: friendsRes, isLoading: isLoadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: () => friendsService.getFriends().then(r => r.data.data),
  });

  const sendRequest = useMutation({
    mutationFn: (email: string) => friendsService.sendRequest(email),
    onSuccess: () => {
      Alert.alert("Success", "Friend request sent!");
      setSearch("");
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.response?.data?.error?.message || "Failed to send request");
    },
  });

  const acceptRequest = useMutation({
    mutationFn: (id: string) => friendsService.acceptRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const rejectRequest = useMutation({
    mutationFn: (id: string) => friendsService.rejectRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  const requests = requestsRes || [];
  const friends = friendsRes || [];

  const filteredFriends = friends.filter((f: any) =>
    f.friend.name.toLowerCase().includes(search.toLowerCase()) ||
    f.friend.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Friends</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="person-add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search friends by name or email"
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => {
              if (search.includes("@")) {
                sendRequest.mutate(search);
              }
            }}
          />
        </View>

        {/* Friend Requests */}
        {requests.length > 0 && (
          <GlassCard style={styles.requestsCard} intensity={20}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Friend Requests</Text>
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.badgeText, { color: "#000" }]}>{requests.length} New</Text>
              </View>
            </View>

            {requests.map((req: any) => (
              <View key={req.id} style={[styles.requestItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.requestInfo}>
                  {req.user.avatarUrl ? (
                    <Image source={{ uri: req.user.avatarUrl }} style={[styles.avatar, { borderColor: colors.border }]} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { borderColor: colors.border }]}>
                      <Ionicons name="person" size={20} color={colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.requestText}>
                    <Text style={[styles.friendName, { color: colors.text }]}>{req.user.name}</Text>
                    <Text style={[styles.friendEmail, { color: colors.textSecondary }]}>{req.user.email}</Text>
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: 'rgba(0,245,255,0.2)' }]}
                    onPress={() => acceptRequest.mutate(req.id)}
                  >
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: 'rgba(255,180,171,0.2)' }]}
                    onPress={() => rejectRequest.mutate(req.id)}
                  >
                    <Ionicons name="close" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </GlassCard>
        )}

        {/* Friends List */}
        <View style={styles.friendsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.sm, paddingHorizontal: 4 }]}>
            Your Friends
          </Text>

          {isLoadingFriends ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          ) : filteredFriends.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No friends found.</Text>
          ) : (
            filteredFriends.map((f: any) => {
              const owesYou = f.balance > 0;
              const youOwe = f.balance < 0;
              const settled = f.balance === 0;

              return (
                <GlassCard key={f.id} intensity={15} style={styles.friendCard}>
                  <View style={styles.friendInfo}>
                    {f.friend.avatarUrl ? (
                      <Image
                        source={{ uri: f.friend.avatarUrl }}
                        style={[
                          styles.avatarLarge,
                          { borderColor: colors.border },
                          settled && { opacity: 0.7 }
                        ]}
                      />
                    ) : (
                      <View style={[styles.avatarLargePlaceholder, { borderColor: colors.border }, settled && { opacity: 0.7 }]}>
                        <Ionicons name="person" size={24} color={colors.textSecondary} />
                      </View>
                    )}
                    <View style={styles.friendDetails}>
                      <Text style={[styles.friendName, { color: colors.text }]}>{f.friend.name}</Text>
                      {owesYou && <Text style={[styles.balanceText, styles.neonGreen]}>Owes you ${f.balance.toFixed(2)}</Text>}
                      {youOwe && <Text style={[styles.balanceText, styles.neonPink]}>You owe ${Math.abs(f.balance).toFixed(2)}</Text>}
                      {settled && <Text style={[styles.balanceText, { color: colors.textSecondary }]}>Settled up</Text>}
                    </View>
                  </View>

                  {!settled ? (
                    <TouchableOpacity style={[
                      styles.settleBtn,
                      youOwe ? [styles.settleBtnPrimary, { backgroundColor: colors.primary }] : [styles.settleBtnSecondary, { borderColor: colors.success }]
                    ]}>
                      <Text style={[
                        styles.settleBtnText,
                        youOwe ? { color: "#000" } : { color: colors.success }
                      ]}>SETTLE</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.moreBtn}>
                      <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </GlassCard>
              );
            })
          )}
        </View>

        {/* Invite Banner */}
        <View style={[styles.inviteBanner, { borderColor: 'rgba(0,245,255,0.3)', backgroundColor: 'rgba(0,245,255,0.1)' }]}>
          <View style={styles.inviteContent}>
            <Text style={[styles.inviteTitle, { color: colors.primary }]}>Invite New Friends</Text>
            <Text style={[styles.inviteDesc, { color: colors.textSecondary }]}>
              Splitting bills is easier with friends. Invite them to Smart Expense.
            </Text>
          </View>
          <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="share-social" size={24} color="#000" />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.12)",
  },
  headerTitle: {
    fontFamily: 'Hanken Grotesk',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerIcon: {
    position: 'absolute',
    right: spacing.md,
    padding: 8,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderBottomWidth: 2, // As per stitch glass-input
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Hanken Grotesk',
  },
  requestsCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Hanken Grotesk',
    fontSize: 20,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: 'JetBrains Mono',
    fontSize: 12,
    fontWeight: '600',
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  requestText: {
    marginLeft: spacing.sm,
  },
  friendName: {
    fontFamily: 'Hanken Grotesk',
    fontSize: 16,
    fontWeight: '500',
  },
  friendEmail: {
    fontFamily: 'JetBrains Mono',
    fontSize: 12,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendsSection: {
    marginTop: spacing.lg,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
  },
  avatarLargePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  friendDetails: {
    marginLeft: spacing.md,
  },
  balanceText: {
    fontFamily: 'JetBrains Mono',
    fontSize: 12,
    marginTop: 4,
  },
  neonGreen: {
    color: '#79ff5b',
    textShadowColor: 'rgba(121, 255, 91, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  neonPink: {
    color: '#ffb4ab',
    textShadowColor: 'rgba(255, 180, 171, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  settleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  settleBtnPrimary: {
    shadowColor: '#00f5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  settleBtnSecondary: {
    borderWidth: 1,
    backgroundColor: 'rgba(47, 248, 1, 0.1)',
  },
  settleBtnText: {
    fontFamily: 'JetBrains Mono',
    fontSize: 12,
    fontWeight: '600',
  },
  moreBtn: {
    padding: 8,
    opacity: 0.5,
  },
  inviteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inviteContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  inviteTitle: {
    fontFamily: 'Hanken Grotesk',
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 4,
  },
  inviteDesc: {
    fontFamily: 'Hanken Grotesk',
    fontSize: 14,
    lineHeight: 20,
  },
  shareBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00f5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  emptyText: {
    fontFamily: 'Hanken Grotesk',
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.xl,
  }
});
