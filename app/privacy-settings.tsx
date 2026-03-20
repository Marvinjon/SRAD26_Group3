import { DashboardCard } from '@/components/dashboard-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND = '#5B8DEF';
const DANGER = '#EF4444';
const SUCCESS = '#10B981';
const PRIVACY_KEY = 'mindtrack_privacy_settings';

type PrivacySettings = {
  hideName: boolean;
  hideEmail: boolean;
  hideStudentId: boolean;
  anonNotes: boolean;
  limitSharing: boolean;
};

const DEFAULT_SETTINGS: PrivacySettings = {
  hideName: false,
  hideEmail: false,
  hideStudentId: false,
  anonNotes: false,
  limitSharing: false,
};

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');

  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem(PRIVACY_KEY).then((raw) => {
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    });
  }, []);

  const toggle = (key: keyof PrivacySettings) => {
    setSaved(false);
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    await AsyncStorage.setItem(PRIVACY_KEY, JSON.stringify(settings));
    setSaved(true);
  };

  const handleDeleteRequest = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Request data deletion? An admin will review and contact you.')) {
        Alert.alert('Request submitted', 'An admin will contact you shortly.');
      }
    } else {
      Alert.alert(
        'Request data deletion?',
        'This will notify an admin. Your records will be reviewed before removal.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            style: 'destructive',
            onPress: () =>
              Alert.alert('Request submitted', 'An admin will contact you shortly.'),
          },
        ]
      );
    }
  };

  const ToggleRow = ({
    label,
    subtitle,
    settingKey,
  }: {
    label: string;
    subtitle: string;
    settingKey: keyof PrivacySettings;
  }) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <ThemedText style={styles.toggleLabel}>{label}</ThemedText>
        <ThemedText style={styles.toggleSub}>{subtitle}</ThemedText>
      </View>
      <Switch
        value={settings[settingKey]}
        onValueChange={() => toggle(settingKey)}
        trackColor={{ false: textColor + '20', true: BRAND }}
        thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
      />
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: textColor + '10' }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={[styles.backText, { color: BRAND }]}>← Back</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Privacy settings</ThemedText>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>
            <ThemedText style={styles.intro}>
              Control how your personal information is shared within Mind Track.
              Your mental health data is always kept private and confidential.
            </ThemedText>

            <DashboardCard title="Profile visibility">
              <ToggleRow
                label="Hide my full name"
                subtitle="Show initials only to therapists"
                settingKey="hideName"
              />
              <View style={[styles.sep, { backgroundColor: textColor + '10' }]} />
              <ToggleRow
                label="Hide email address"
                subtitle="Don't display email on my profile"
                settingKey="hideEmail"
              />
              <View style={[styles.sep, { backgroundColor: textColor + '10' }]} />
              <ToggleRow
                label="Hide student ID"
                subtitle="Mask ID number in session records"
                settingKey="hideStudentId"
              />
            </DashboardCard>

            <DashboardCard title="Session & notes">
              <ToggleRow
                label="Anonymise session notes"
                subtitle="Remove identifying info from therapist notes"
                settingKey="anonNotes"
              />
              <View style={[styles.sep, { backgroundColor: textColor + '10' }]} />
              <ToggleRow
                label="Limit data sharing"
                subtitle="Only my assigned therapist can view my data"
                settingKey="limitSharing"
              />
            </DashboardCard>

            <DashboardCard title="My data">
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() =>
                  Alert.alert('Coming soon', 'Data export will be available in a future update.')
                }
              >
                <View>
                  <ThemedText style={styles.actionLabel}>Download my data</ThemedText>
                  <ThemedText style={styles.actionSub}>Export a copy of your records</ThemedText>
                </View>
                <ThemedText style={{ color: BRAND, fontSize: 20 }}>›</ThemedText>
              </TouchableOpacity>
              <View style={[styles.sep, { backgroundColor: textColor + '10' }]} />
              <TouchableOpacity style={styles.actionRow} onPress={handleDeleteRequest}>
                <View>
                  <ThemedText style={[styles.actionLabel, { color: DANGER }]}>
                    Request data deletion
                  </ThemedText>
                  <ThemedText style={styles.actionSub}>Ask admin to remove your records</ThemedText>
                </View>
                <ThemedText style={{ color: DANGER, fontSize: 20 }}>›</ThemedText>
              </TouchableOpacity>
            </DashboardCard>

            {saved ? (
              <View style={styles.successBox}>
                <ThemedText style={styles.successText}>Privacy settings saved</ThemedText>
              </View>
            ) : null}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <ThemedText style={styles.saveBtnText}>Save settings</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  inner: { gap: 16 },
  intro: { fontSize: 14, lineHeight: 20, opacity: 0.65 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  toggleText: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 15, fontWeight: '500' },
  toggleSub: { fontSize: 12, opacity: 0.55, marginTop: 2 },
  sep: { height: 1, marginVertical: 6 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  actionLabel: { fontSize: 15, fontWeight: '500' },
  actionSub: { fontSize: 12, opacity: 0.55, marginTop: 2 },
  saveBtn: {
    backgroundColor: BRAND,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successBox: {
    backgroundColor: '#10B98115',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#10B98130',
    alignItems: 'center',
  },
  successText: { color: SUCCESS, fontSize: 13, fontWeight: '700' },
});