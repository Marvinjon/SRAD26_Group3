import { DashboardCard, QuickAction, StatBadge } from '@/components/dashboard-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppointments } from '@/contexts/appointments-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { THERAPISTS } from '@/constants/therapists_list';
import { useAvailableAppointments } from '@/contexts/available-appointments-context';
import { useWorkshops } from '@/contexts/workshops-context';

const MOOD_STORAGE_KEY = 'mindtrack_mood_log';
const BOOKINGS_KEY = 'mindtrack_booked_appointments';

type MoodLog = Record<string, number>;
type BookingMap = Record<string, string>;

function formatDateKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const MOOD_OPTIONS = [
  { value: 5, emoji: '😊', label: 'Great' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 2, emoji: '😔', label: 'Low' },
  { value: 1, emoji: '😢', label: 'Rough' },
];

function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T12:00:00`));
}

function isUpcoming(date: string, time: string): boolean {
  const now = new Date();
  const start = new Date(`${date}T${time}:00`);
  return start.getTime() >= now.getTime();
}

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
function StudentDashboard({ name }: { name: string }) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 700;
  const textColor = useThemeColor({}, 'text');
  const { slots } = useAvailableAppointments();
  const { workshops } = useWorkshops();
  const [moodLog, setMoodLog] = useState<MoodLog>({});
  const [bookings, setBookings] = useState<BookingMap>({});

  useEffect(() => {
    let mounted = true;

    async function loadMoodLog() {
      try {
        const stored = await AsyncStorage.getItem(MOOD_STORAGE_KEY);
        if (stored && mounted) {
          setMoodLog(JSON.parse(stored));
        }
      } catch {
        // ignore storage errors
      }
    }

    loadMoodLog();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadBookings() {
      try {
        const stored = await AsyncStorage.getItem(BOOKINGS_KEY);
        if (stored && mounted) {
          setBookings(JSON.parse(stored));
        }
      } catch {
        // ignore storage errors
      }
    }

    loadBookings();

    return () => {
      mounted = false;
    };
  }, []);

  const todayKey = formatDateKey(new Date());
  const todayMood = moodLog[todayKey];

  const { streak, avgMood, checkins7d } = useMemo(() => {
    const today = new Date();
    const last7Keys: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      last7Keys.push(formatDateKey(d));
    }

    const moodValues = last7Keys
      .map((key) => moodLog[key])
      .filter((value): value is number => typeof value === 'number');

    const checkins = moodValues.length;
    const avg = checkins === 0 ? null : moodValues.reduce((sum, v) => sum + v, 0) / checkins;

    let streakCount = 0;
    for (const key of last7Keys) {
      if (typeof moodLog[key] === 'number') {
        streakCount += 1;
      } else {
        break;
      }
    }

    return {
      streak: streakCount,
      avgMood: avg,
      checkins7d: checkins,
    };
  }, [moodLog]);

  const sortedAppointments = useMemo(
    () =>
      slots
        .slice()
        .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`)),
    [slots],
  );

  const sortedWorkshops = useMemo(
    () =>
      workshops
        .slice()
        .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`)),
    [workshops],
  );

  const upcomingAppointments = useMemo(() => {
    if (!user?.email) return [];

    return sortedAppointments
      .filter((slot) => bookings[slot.id] === user.email)
      .filter((slot) => isUpcoming(slot.date, slot.startTime))
      .map((slot) => {
        const therapist = THERAPISTS.find((item) => item.id === slot.therapistId);
        return {
          id: slot.id,
          title: therapist ? `Session with ${therapist.name}` : 'Counselling Session',
          meta: `${formatShortDate(slot.date)} · ${slot.startTime} - ${slot.endTime}`,
          detail: `${slot.mode} · ${slot.location}`,
        };
      });
  }, [bookings, user?.email, sortedAppointments]);

  const upcomingWorkshops = useMemo(
    () =>
      sortedWorkshops.filter((workshop) => isUpcoming(workshop.date, workshop.startTime)).map(
        (workshop) => ({
          id: workshop.id,
          title: workshop.title,
          meta: `${formatShortDate(workshop.date)} · ${workshop.startTime}`,
          detail: workshop.location,
        }),
      ),
    [sortedWorkshops],
  );

  async function handleMoodSelect(value: number) {
    const next: MoodLog = {
      ...moodLog,
      [todayKey]: value,
    };

    setMoodLog(next);

    try {
      await AsyncStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }

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
          {MOOD_OPTIONS.map((option) => {
            const isSelected = option.value === todayMood;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.moodOption,
                  { backgroundColor: textColor + '08' },
                  isSelected && styles.moodOptionSelected,
                ]}
                onPress={() => handleMoodSelect(option.value)}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.moodEmoji}>{option.emoji}</ThemedText>
                <ThemedText
                  style={[
                    styles.moodLabel,
                    { color: textColor + '99' },
                    isSelected && styles.moodLabelSelected,
                  ]}
                >
                  {option.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
        <ThemedText style={styles.checkinHint}>
          {todayMood ? 'Mood logged for today' : 'Tap to log your mood'}
        </ThemedText>
      </DashboardCard>

      <View style={isWide ? styles.statsRowWide : styles.statsRow}>
        <StatBadge value={`${streak}`} label="Day streak" color="#5B8DEF" />
        <StatBadge
          value={avgMood ? avgMood.toFixed(1) : '—'}
          label="Avg. mood (7d)"
          color="#8B5CF6"
        />
        <StatBadge value={`${checkins7d}`} label="Check-ins (7d)" color="#10B981" />
      </View>

      <View style={isWide ? styles.twoColRow : undefined}>
        <DashboardCard title="Upcoming" accent="#5B8DEF" style={isWide ? styles.halfCard : undefined}>
          <ThemedText style={styles.upcomingSectionTitle}>Appointments</ThemedText>
          {upcomingAppointments.length === 0 ? (
            <ThemedText style={styles.upcomingEmpty}>No upcoming appointments yet.</ThemedText>
          ) : (
            upcomingAppointments.map((item) => (
              <View key={item.id} style={styles.upcomingItem}>
                <View style={styles.appointmentDot} />
                <View style={styles.appointmentInfo}>
                  <ThemedText style={styles.appointmentTitle}>{item.title}</ThemedText>
                  <ThemedText style={styles.appointmentMeta}>{item.meta}</ThemedText>
                  <ThemedText style={styles.appointmentMeta}>{item.detail}</ThemedText>
                </View>
              </View>
            ))
          )}

          <View style={[styles.upcomingDivider, { backgroundColor: textColor + '10' }]} />

          <ThemedText style={styles.upcomingSectionTitle}>Workshops</ThemedText>
          {upcomingWorkshops.length === 0 ? (
            <ThemedText style={styles.upcomingEmpty}>No upcoming workshops yet.</ThemedText>
          ) : (
            upcomingWorkshops.map((item) => (
              <View key={item.id} style={styles.upcomingItem}>
                <View style={[styles.appointmentDot, { backgroundColor: '#8B5CF6' }]} />
                <View style={styles.appointmentInfo}>
                  <ThemedText style={styles.appointmentTitle}>{item.title}</ThemedText>
                  <ThemedText style={styles.appointmentMeta}>{item.meta}</ThemedText>
                  <ThemedText style={styles.appointmentMeta}>{item.detail}</ThemedText>
                </View>
              </View>
            ))
          )}
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
  const { appointments, isLoading } = useAppointments();

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

      <DashboardCard title="Quick Actions">
        <View style={styles.actionsGrid}>
          <QuickAction icon="📅" label="Manage Availability" color="#5B8DEF" />
          <QuickAction icon="🎓" label="Create Workshop" color="#8B5CF6" />
          <QuickAction icon="📢" label="Send Notification" color="#F59200" />
          <QuickAction icon="👤" label="View Clients" color="#10B981" />
        </View>
      </DashboardCard>

      <DashboardCard title="Booked Appointments" accent="#5B8DEF">
        {isLoading ? (
          <ThemedText style={styles.scheduleEmpty}>Loading appointments...</ThemedText>
        ) : appointments.length === 0 ? (
          <ThemedText style={styles.scheduleEmpty}>No booked appointments yet.</ThemedText>
        ) : (
          appointments.map((appointment) => (
            <View key={appointment.id} style={styles.scheduleItem}>
              <ThemedText style={styles.scheduleTime}>{appointment.time}</ThemedText>
              <View style={styles.scheduleDivider} />
              <View style={styles.scheduleInfo}>
                <ThemedText style={styles.scheduleName}>{appointment.studentName}</ThemedText>
                <ThemedText style={styles.scheduleType}>
                  {appointment.date} - {appointment.type} - {appointment.status}
                </ThemedText>
              </View>
            </View>
          ))
        )}
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
              <StudentDashboard name={user?.name ?? ''} />
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
    width: 64,
    height: 70,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  moodEmoji: {
    fontSize: 32,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  moodLabelSelected: {
    color: '#5B8DEF',
  },
  moodOptionSelected: {
    borderWidth: 1,
    borderColor: '#5B8DEF',
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
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  appointmentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5B8DEF',
    marginTop: 6,
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
  upcomingSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.55,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  upcomingDivider: {
    height: 1,
    marginVertical: 8,
  },
  upcomingEmpty: {
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
  scheduleEmpty: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
    paddingVertical: 8,
  },

  // Quick actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
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
