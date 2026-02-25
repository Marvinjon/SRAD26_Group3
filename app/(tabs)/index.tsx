import { DashboardCard, StatBadge } from '@/components/dashboard-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getToday(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// ─── Student / Employee Dashboard ────────────────────────────
function StudentDashboard({ name, onBookAppointment }: { name: string; onBookAppointment: () => void }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 700;

  return (
    <>
      <View style={styles.greetingSection}>
        <ThemedText style={styles.greeting}>
          {getGreeting()}, {name.split(' ')[0]}
        </ThemedText>
        <ThemedText style={styles.date}>{getToday()}</ThemedText>
      </View>

      <DashboardCard accent="#FFB020">
        <ThemedText style={styles.checkinPrompt}>How are you feeling today?</ThemedText>
        <View style={styles.moodRow}>
          {['😊', '🙂', '😐', '😔', '😢'].map((emoji, i) => (
            <View key={i} style={styles.moodOption}>
              <ThemedText style={styles.moodEmoji}>{emoji}</ThemedText>
            </View>
          ))}
        </View>
        <ThemedText style={styles.checkinHint}>Tap to log your mood</ThemedText>
      </DashboardCard>

      <View style={isWide ? styles.statsRowWide : styles.statsRow}>
        <StatBadge value="5" label="Day streak" color="#5B8DEF" />
        <StatBadge value="7.2h" label="Avg. sleep" color="#8B5CF6" />
        <StatBadge value="3" label="Check-ins" color="#10B981" />
      </View>

      <View style={isWide ? styles.twoColRow : undefined}>
        <DashboardCard title="Upcoming" accent="#5B8DEF" style={isWide ? styles.halfCard : undefined}>
          <View style={styles.appointmentItem}>
            <View style={styles.appointmentDot} />
            <View style={styles.appointmentInfo}>
              <ThemedText style={styles.appointmentTitle}>Counselling Session</ThemedText>
              <ThemedText style={styles.appointmentMeta}>Thu, Feb 27 at 14:00</ThemedText>
            </View>
          </View>
          <View style={styles.appointmentItem}>
            <View style={[styles.appointmentDot, { backgroundColor: '#8B5CF6' }]} />
            <View style={styles.appointmentInfo}>
              <ThemedText style={styles.appointmentTitle}>Stress Workshop</ThemedText>
              <ThemedText style={styles.appointmentMeta}>Mon, Mar 3 at 10:00</ThemedText>
            </View>
          </View>
        </DashboardCard>

        <DashboardCard title="Weekly Insight" accent="#10B981" style={isWide ? styles.halfCard : undefined}>
          <ThemedText style={styles.insightText}>
            Your mood tends to dip on days with less than 6 hours of sleep. Try winding down 30 minutes earlier tonight.
          </ThemedText>
          <View style={styles.insightBar}>
            {[0.6, 0.8, 0.5, 0.9, 0.7, 0.85, 0.75].map((h, i) => (
              <View key={i} style={styles.barCol}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: h * 40,
                      backgroundColor: h < 0.6 ? '#EF444480' : '#10B98180',
                    },
                  ]}
                />
                <ThemedText style={styles.barLabel}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                </ThemedText>
              </View>
            ))}
          </View>
        </DashboardCard>
      </View>

      <DashboardCard title="Resources For You">
        <View style={styles.resourceRow}>
          <View style={[styles.resourceChip, { backgroundColor: '#5B8DEF18' }]}>
            <ThemedText style={[styles.resourceChipText, { color: '#5B8DEF' }]}>Exam Stress</ThemedText>
          </View>
          <View style={[styles.resourceChip, { backgroundColor: '#8B5CF618' }]}>
            <ThemedText style={[styles.resourceChipText, { color: '#8B5CF6' }]}>Sleep Tips</ThemedText>
          </View>
          <View style={[styles.resourceChip, { backgroundColor: '#10B98118' }]}>
            <ThemedText style={[styles.resourceChipText, { color: '#10B981' }]}>Mindfulness</ThemedText>
          </View>
          <View style={[styles.resourceChip, { backgroundColor: '#F5920018' }]}>
            <ThemedText style={[styles.resourceChipText, { color: '#F59200' }]}>Homesickness</ThemedText>
          </View>
        </View>
      </DashboardCard>
    </>
  );
}

// ─── Therapist Dashboard ─────────────────────────────────────
function TherapistDashboard({ name }: { name: string }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 700;

  return (
    <>
      <View style={styles.greetingSection}>
        <ThemedText style={styles.greeting}>
          {getGreeting()}, {name.split(' ')[0]}
        </ThemedText>
        <ThemedText style={styles.date}>{getToday()}</ThemedText>
      </View>

      <View style={isWide ? styles.statsRowWide : styles.statsRow}>
        <StatBadge value="4" label="Today's sessions" color="#5B8DEF" />
        <StatBadge value="12" label="This week" color="#8B5CF6" />
        <StatBadge value="2" label="Workshops" color="#10B981" />
      </View>

      <DashboardCard title="Today's Schedule" accent="#5B8DEF">
        {[
          { time: '09:00', name: 'Anna Jónsdóttir', type: 'Individual' },
          { time: '10:30', name: 'Guðmundur Einarsson', type: 'Individual' },
          { time: '13:00', name: 'Stress Management Group', type: 'Workshop' },
          { time: '15:00', name: 'Katrín Ólafsdóttir', type: 'Individual' },
        ].map((session, i) => (
          <View key={i} style={styles.scheduleItem}>
            <ThemedText style={styles.scheduleTime}>{session.time}</ThemedText>
            <View style={styles.scheduleDivider} />
            <View style={styles.scheduleInfo}>
              <ThemedText style={styles.scheduleName}>{session.name}</ThemedText>
              <ThemedText style={styles.scheduleType}>{session.type}</ThemedText>
            </View>
          </View>
        ))}
      </DashboardCard>

      <View style={isWide ? styles.twoColRow : undefined}>
        <DashboardCard title="Upcoming Workshops" accent="#8B5CF6" style={isWide ? styles.halfCard : undefined}>
          <View style={styles.workshopItem}>
            <ThemedText style={styles.workshopTitle}>Exam Anxiety Coping</ThemedText>
            <ThemedText style={styles.workshopMeta}>Mar 5 · 12 registered</ThemedText>
          </View>
          <View style={styles.workshopItem}>
            <ThemedText style={styles.workshopTitle}>Mindful Study Habits</ThemedText>
            <ThemedText style={styles.workshopMeta}>Mar 12 · 8 registered</ThemedText>
          </View>
        </DashboardCard>

        <DashboardCard title="Recent Activity" accent="#10B981" style={isWide ? styles.halfCard : undefined}>
          <View style={styles.activityItem}>
            <ThemedText style={styles.activityDot}>●</ThemedText>
            <ThemedText style={styles.activityText}>Session completed with Aron B.</ThemedText>
          </View>
          <View style={styles.activityItem}>
            <ThemedText style={[styles.activityDot, { color: '#8B5CF6' }]}>●</ThemedText>
            <ThemedText style={styles.activityText}>Workshop reminder sent</ThemedText>
          </View>
          <View style={styles.activityItem}>
            <ThemedText style={[styles.activityDot, { color: '#F59200' }]}>●</ThemedText>
            <ThemedText style={styles.activityText}>New booking request</ThemedText>
          </View>
        </DashboardCard>
      </View>
    </>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const isTherapist = user?.role === 'therapist';

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
            {isTherapist ? (
              <TherapistDashboard name={user?.name ?? ''} />
            ) : (
              <StudentDashboard
                name={user?.name ?? ''}
                onBookAppointment={() => router.push('/(tabs)/therapists')}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

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
    maxWidth: 800,
  },

  // Greeting
  greetingSection: {
    marginBottom: 4,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
  },
  date: {
    fontSize: 15,
    opacity: 0.5,
    marginTop: 4,
  },

  // Mood check-in
  checkinPrompt: {
    fontSize: 18,
    fontWeight: '600',
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  moodOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 32,
  },
  checkinHint: {
    textAlign: 'center',
    fontSize: 13,
    opacity: 0.4,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statsRowWide: {
    flexDirection: 'row',
    gap: 12,
  },

  // Two column
  twoColRow: {
    flexDirection: 'row',
    gap: 16,
  },
  halfCard: {
    flex: 1,
  },

  // Appointments
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appointmentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5B8DEF',
  },
  appointmentInfo: {
    flex: 1,
    gap: 2,
  },
  appointmentTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  appointmentMeta: {
    fontSize: 13,
    opacity: 0.5,
  },

  // Insight
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.75,
  },
  insightBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 56,
    marginTop: 4,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  bar: {
    width: 18,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 11,
    opacity: 0.4,
  },

  // Resources
  resourceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  resourceChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resourceChipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Therapist schedule
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: '600',
    width: 50,
    color: '#5B8DEF',
  },
  scheduleDivider: {
    width: 2,
    height: 32,
    backgroundColor: '#5B8DEF30',
    borderRadius: 1,
  },
  scheduleInfo: {
    flex: 1,
    gap: 2,
  },
  scheduleName: {
    fontSize: 15,
    fontWeight: '500',
  },
  scheduleType: {
    fontSize: 12,
    opacity: 0.5,
  },

  // Workshops
  workshopItem: {
    gap: 2,
  },
  workshopTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  workshopMeta: {
    fontSize: 13,
    opacity: 0.5,
  },

  // Activity
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityDot: {
    fontSize: 10,
    color: '#10B981',
  },
  activityText: {
    fontSize: 14,
    opacity: 0.75,
  },
});
