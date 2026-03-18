import { DashboardCard, QuickAction, StatBadge } from '@/components/dashboard-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth, type User } from '@/contexts/auth-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppointments } from '@/contexts/appointments-context';
import { useWorkshops, type Workshop } from '@/contexts/workshops-context';
import { useThemeColor } from '@/hooks/use-theme-color';

const MOOD_STORAGE_KEY = 'mindtrack_mood_log';

type MoodLog = Record<string, number>;

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

interface CreateWorkshopData {
  title: string;
  description: string;
  date: string;
  time: string;
  maxParticipants: number;
}

function CreateWorkshopModal({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (workshop: CreateWorkshopData) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('10');
  const bg = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const reset = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setMaxParticipants('10');
  };

  const handleCreate = () => {
    if (!title.trim() || !date.trim() || !time.trim()) {
      Alert.alert('Missing information', 'Please fill in a title, date, and time.');
      return;
    }

    const max = Number(maxParticipants);
    if (Number.isNaN(max) || max < 1) {
      Alert.alert('Invalid capacity', 'Please enter a valid number of participants.');
      return;
    }

    onCreate({
      title: title.trim(),
      description: description.trim(),
      date: date.trim(),
      time: time.trim(),
      maxParticipants: max,
    });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: bg }]}> 
          <ThemedText style={styles.modalTitle}>Create workshop</ThemedText>

          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Title"
            placeholderTextColor={textColor + '80'}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Description (optional)"
            placeholderTextColor={textColor + '80'}
            value={description}
            onChangeText={setDescription}
          />
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Date (e.g. Mar 5)"
            placeholderTextColor={textColor + '80'}
            value={date}
            onChangeText={setDate}
          />
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Time (e.g. 10:00)"
            placeholderTextColor={textColor + '80'}
            value={time}
            onChangeText={setTime}
          />
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Max participants"
            placeholderTextColor={textColor + '80'}
            keyboardType="number-pad"
            value={maxParticipants}
            onChangeText={setMaxParticipants}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { reset(); onClose(); }}>
              <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={handleCreate}>
              <ThemedText style={styles.addBtnText}>Create</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function WorkshopDetailModal({
  visible,
  workshop,
  user,
  onClose,
  onToggleRegistration,
}: {
  visible: boolean;
  workshop: Workshop | null;
  user: User | null;
  onClose: () => void;
  onToggleRegistration: (workshopId: string, userEmail: string) => void;
}) {
  const bg = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  if (!workshop) {
    return null;
  }

  const isRegistered = user ? workshop.registered.includes(user.email) : false;
  const isFull = workshop.registered.length >= workshop.maxParticipants;
  const canJoin = Boolean(user) && !isRegistered && !isFull;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: bg }]}> 
          <ThemedText style={styles.modalTitle}>{workshop.title}</ThemedText>
          <ThemedText style={[styles.modalDescription, { color: textColor + 'cc' }]}>
            {workshop.description || 'No additional details provided.'}
          </ThemedText>
          <ThemedText style={[styles.modalMeta, { color: textColor + '99' }]}>Host: {workshop.hostEmail}</ThemedText>
          <ThemedText style={[styles.modalMeta, { color: textColor + '99' }]}>Date: {workshop.date} • {workshop.time}</ThemedText>

          <View style={styles.modalInfoRow}>
            <View style={styles.modalInfoBox}>
              <ThemedText style={styles.modalInfoLabel}>Registered</ThemedText>
              <ThemedText style={styles.modalInfoValue}>
                {workshop.registered.length}/{workshop.maxParticipants}
              </ThemedText>
            </View>
            <View style={styles.modalInfoBox}>
              <ThemedText style={styles.modalInfoLabel}>Status</ThemedText>
              <ThemedText style={styles.modalInfoValue}>
                {isRegistered ? 'Joined' : isFull ? 'Full' : 'Open'}
              </ThemedText>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.addBtn,
              isRegistered && styles.joinBtnSelected,
              !user || (!canJoin && !isRegistered) ? styles.actionBtnDisabled : undefined,
            ]}
            onPress={() => user && onToggleRegistration(workshop.id, user.email)}
            disabled={!user || (!canJoin && !isRegistered)}
          >
            <ThemedText style={[styles.addBtnText, (isRegistered || (!canJoin && !isRegistered)) && { color: '#fff' }]}> 
              {user ? (isRegistered ? 'Leave workshop' : isFull ? 'Workshop full' : 'Join workshop') : 'Login to join'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.cancelBtn, { marginTop: 10 }]} onPress={onClose}>
            <ThemedText style={styles.cancelBtnText}>Close</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Student / Employee Dashboard ────────────────────────────
function StudentDashboard({ name }: { name: string }) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 700;
  const textColor = useThemeColor({}, 'text');
  const { workshops, toggleRegistration } = useWorkshops();
  const [moodLog, setMoodLog] = useState<MoodLog>({});
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);

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

  const selectedWorkshop = workshops.find((w) => w.id === selectedWorkshopId) ?? null;
  const closeWorkshopModal = () => setSelectedWorkshopId(null);

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
        <DashboardCard title="Upcoming workshops" accent="#5B8DEF" style={isWide ? styles.halfCard : undefined}>
          {workshops.length === 0 ? (
            <ThemedText style={styles.scheduleEmpty}>No workshops scheduled yet.</ThemedText>
          ) : (
            workshops.map((workshop) => {
              const isRegistered = user ? workshop.registered.includes(user.email) : false;
              const isFull = workshop.registered.length >= workshop.maxParticipants;
              const canJoin = Boolean(user) && !isRegistered && !isFull;

              return (
                <TouchableOpacity
                  key={workshop.id}
                  style={styles.workshopItem}
                  onPress={() => setSelectedWorkshopId(workshop.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.appointmentItem}>
                    <View style={[styles.appointmentDot, { backgroundColor: '#8B5CF6' }]} />
                    <View style={styles.appointmentInfo}>
                      <ThemedText style={styles.appointmentTitle}>{workshop.title}</ThemedText>
                      <ThemedText style={styles.appointmentMeta}>
                        {workshop.date} at {workshop.time} • {workshop.registered.length}/{workshop.maxParticipants} registered
                      </ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.joinBtn,
                      isRegistered && styles.joinBtnSelected,
                      !canJoin && !isRegistered && styles.joinBtnDisabled,
                    ]}
                    onPress={() => user && toggleRegistration(workshop.id, user.email)}
                    disabled={!user || (!canJoin && !isRegistered)}
                  >
                    <ThemedText style={[styles.joinBtnText, (isRegistered || (!canJoin && !isRegistered)) && { color: '#fff' }]}>
                      {isRegistered ? 'Joined' : isFull ? 'Full' : 'Join'}
                    </ThemedText>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
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

      <WorkshopDetailModal
        visible={!!selectedWorkshop}
        workshop={selectedWorkshop}
        user={user}
        onClose={closeWorkshopModal}
        onToggleRegistration={(workshopId, userEmail) => {
          toggleRegistration(workshopId, userEmail);
          // keep modal open after toggling
        }}
      />
    </>
  );
}

// ─── Therapist Dashboard ─────────────────────────────────────
function TherapistDashboard({ name }: { name: string }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 700;
  const { user } = useAuth();
  const { appointments, isLoading } = useAppointments();
  const { workshops, createWorkshop, removeWorkshop, toggleRegistration } = useWorkshops();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);

  const myWorkshops = workshops.filter((w) => w.hostEmail === user?.email);
  const selectedWorkshop = workshops.find((w) => w.id === selectedWorkshopId) ?? null;
  const closeWorkshopModal = () => setSelectedWorkshopId(null);

  const handleCreateWorkshop = async (data: CreateWorkshopData) => {
    if (!user) return;
    await createWorkshop({ ...data, hostEmail: user.email });
  };

  const handleCancelWorkshop = (workshopId: string) => {
    Alert.alert('Cancel workshop', 'Remove this workshop from the schedule?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', onPress: () => removeWorkshop(workshopId) },
    ]);
  };

  return (
    <>
      <View style={styles.greetingSection}>
        <ThemedText style={styles.greeting}>
          {getGreeting()}, {name.split(' ')[0]}
        </ThemedText>
        <ThemedText style={styles.date}>{getToday()}</ThemedText>
      </View>

      <View style={isWide ? styles.statsRowWide : styles.statsRow}>
        <StatBadge value={`${appointments.length}`} label="Today's sessions" color="#5B8DEF" />
        <StatBadge value={`${appointments.length}`} label="This week" color="#8B5CF6" />
        <StatBadge
          value={`${workshops.filter((w) => w.hostEmail === user?.email).length}`}
          label="Workshops"
          color="#10B981"
        />
      </View>

      <DashboardCard title="Quick Actions">
        <View style={styles.actionsGrid}>
          <QuickAction icon="📅" label="Manage Availability" color="#5B8DEF" />
          <QuickAction
            icon="🎓"
            label="Create Workshop"
            color="#8B5CF6"
            onPress={() => setShowCreateModal(true)}
          />
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
          {myWorkshops.length === 0 ? (
            <ThemedText style={styles.scheduleEmpty}>No workshops scheduled yet.</ThemedText>
          ) : (
            myWorkshops.map((workshop) => (
              <TouchableOpacity
                key={workshop.id}
                style={styles.workshopItem}
                activeOpacity={0.8}
                onPress={() => setSelectedWorkshopId(workshop.id)}
              >
                <ThemedText style={styles.workshopTitle}>{workshop.title}</ThemedText>
                <ThemedText style={styles.workshopMeta}>
                  {workshop.date} · {workshop.registered.length}/{workshop.maxParticipants} registered
                </ThemedText>
                <TouchableOpacity
                  style={[styles.cancelBtn, { alignSelf: 'flex-start', marginTop: 8 }]}
                  onPress={() => handleCancelWorkshop(workshop.id)}
                >
                  <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </DashboardCard>

        <WorkshopDetailModal
          visible={!!selectedWorkshop}
          workshop={selectedWorkshop}
          user={user}
          onClose={closeWorkshopModal}
          onToggleRegistration={(workshopId, userEmail) => {
            toggleRegistration(workshopId, userEmail);
          }}
        />

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

      <CreateWorkshopModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateWorkshop}
      />
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

  // Workshop list
  joinBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#5B8DEF',
    alignSelf: 'flex-start',
  },
  joinBtnSelected: {
    backgroundColor: '#10B981',
  },
  joinBtnDisabled: {
    backgroundColor: '#9ca9c8',
  },

  // Create workshop modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  cancelBtnText: {
    fontWeight: '600',
  },
  addBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#5B8DEF',
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
