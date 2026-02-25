import React from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DashboardCard } from '@/components/dashboard-card';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';

function ProfileField({ label, value }: { label: string; value: string }) {
  const textColor = useThemeColor({}, 'text');
  return (
    <View style={pfStyles.field}>
      <ThemedText style={pfStyles.label}>{label}</ThemedText>
      <ThemedText style={[pfStyles.value, { borderColor: textColor + '10' }]}>{value}</ThemedText>
    </View>
  );
}

const ROLE_LABELS: Record<string, string> = {
  student: 'Student',
  employee: 'University Staff',
  therapist: 'Therapist',
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const textColor = useThemeColor({}, 'text');

  const initials = (user?.name ?? '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.scrollContentDesktop,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
            <View style={styles.avatarSection}>
              <View style={styles.avatar}>
                <ThemedText style={styles.avatarText}>{initials}</ThemedText>
              </View>
              <ThemedText style={styles.name}>{user?.name}</ThemedText>
              <View style={styles.roleBadge}>
                <ThemedText style={styles.roleBadgeText}>
                  {ROLE_LABELS[user?.role ?? 'student']}
                </ThemedText>
              </View>
            </View>

            <DashboardCard title="Account Information">
              <ProfileField label="Full Name" value={user?.name ?? ''} />
              <ProfileField label="Email" value={user?.email ?? ''} />
              <ProfileField label="Role" value={ROLE_LABELS[user?.role ?? 'student']} />
            </DashboardCard>

            <DashboardCard title="Preferences">
              <View style={styles.prefRow}>
                <ThemedText style={styles.prefLabel}>Notifications</ThemedText>
                <ThemedText style={[styles.prefValue, { color: '#10B981' }]}>Enabled</ThemedText>
              </View>
              <View style={[styles.separator, { backgroundColor: textColor + '10' }]} />
              <View style={styles.prefRow}>
                <ThemedText style={styles.prefLabel}>Theme</ThemedText>
                <ThemedText style={styles.prefValue}>System</ThemedText>
              </View>
              <View style={[styles.separator, { backgroundColor: textColor + '10' }]} />
              <View style={styles.prefRow}>
                <ThemedText style={styles.prefLabel}>Data Privacy</ThemedText>
                <ThemedText style={[styles.prefValue, { color: '#5B8DEF' }]}>Private</ThemedText>
              </View>
            </DashboardCard>

            <DashboardCard title="About Mind Track">
              <ThemedText style={styles.aboutText}>
                Mind Track helps Reykjavík University students and staff monitor wellbeing, reflect on habits, and access support resources in one private place.
              </ThemedText>
              <ThemedText style={styles.versionText}>Version 1.0.0</ThemedText>
            </DashboardCard>

            <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
              <ThemedText style={styles.logoutText}>Log Out</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const pfStyles = StyleSheet.create({
  field: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.45,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  scrollContentDesktop: {
    alignItems: 'center',
  },
  inner: {
    gap: 16,
    width: '100%',
  },
  innerDesktop: {
    maxWidth: 560,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#5B8DEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
  },
  roleBadge: {
    backgroundColor: '#5B8DEF18',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleBadgeText: {
    color: '#5B8DEF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Preferences
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  prefLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  prefValue: {
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.7,
  },
  separator: {
    height: 1,
  },

  // About
  aboutText: {
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.7,
  },
  versionText: {
    fontSize: 13,
    opacity: 0.4,
  },

  // Logout
  logoutButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
