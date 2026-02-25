import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/auth-context';
import { TimeSlot, useAvailability } from '@/contexts/availability-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useMemo, useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

const BRAND = '#5B8DEF';
const GREEN = '#10B981';
const RED = '#EF4444';
const AMBER = '#F59E0B';

// ─── Generate time options (HH:MM) in 30-min increments ─────
function generateTimeOptions(): string[] {
  const times: string[] = [];
  for (let h = 7; h <= 20; h++) {
    for (const m of ['00', '30']) {
      if (h === 20 && m === '30') continue;
      times.push(`${String(h).padStart(2, '0')}:${m}`);
    }
  }
  return times;
}
const TIME_OPTIONS = generateTimeOptions();

// ─── Therapist: Add Slot Modal ──────────────────────────────
function AddSlotModal({
  visible,
  date,
  onClose,
  onAdd,
}: {
  visible: boolean;
  date: string;
  onClose: () => void;
  onAdd: (start: string, end: string) => void;
}) {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const bg = useThemeColor({}, 'background');
  const text = useThemeColor({}, 'text');

  const handleAdd = () => {
    if (startTime >= endTime) {
      Alert.alert('Invalid Time', 'End time must be after start time.');
      return;
    }
    onAdd(startTime, endTime);
    setStartTime('09:00');
    setEndTime('10:00');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: bg }]}>
          <ThemedText style={styles.modalTitle}>Add Availability</ThemedText>
          <ThemedText style={styles.modalDate}>{date}</ThemedText>

          <ThemedText style={styles.pickLabel}>Start Time</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timePicker}>
            {TIME_OPTIONS.map((t) => (
              <TouchableOpacity
                key={`s-${t}`}
                onPress={() => setStartTime(t)}
                style={[styles.timeChip, startTime === t && styles.timeChipActive]}>
                <ThemedText style={[styles.timeChipText, startTime === t && styles.timeChipTextActive]}>
                  {t}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ThemedText style={styles.pickLabel}>End Time</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timePicker}>
            {TIME_OPTIONS.map((t) => (
              <TouchableOpacity
                key={`e-${t}`}
                onPress={() => setEndTime(t)}
                style={[styles.timeChip, endTime === t && styles.timeChipActive]}>
                <ThemedText style={[styles.timeChipText, endTime === t && styles.timeChipTextActive]}>
                  {t}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <ThemedText style={styles.addBtnText}>Add Slot</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Slot Card ───────────────────────────────────────────────
function SlotCard({
  slot,
  isTherapist,
  isOwnSlot,
  currentUserEmail,
  currentUserName,
  onDelete,
  onBook,
  onCancel,
}: {
  slot: TimeSlot;
  isTherapist: boolean;
  isOwnSlot: boolean;
  currentUserEmail: string;
  currentUserName: string;
  onDelete: () => void;
  onBook: () => void;
  onCancel: () => void;
}) {
  const isBooked = !!slot.bookedBy;
  const isBookedByMe = slot.bookedBy === currentUserEmail;

  return (
    <View style={[styles.slotCard, isBooked ? styles.slotBooked : styles.slotOpen]}>
      <View style={styles.slotInfo}>
        <ThemedText style={styles.slotTime}>
          {slot.startTime} – {slot.endTime}
        </ThemedText>
        {!isTherapist && (
          <ThemedText style={styles.slotTherapist}>{slot.therapistName}</ThemedText>
        )}
        {isBooked && isTherapist && (
          <ThemedText style={styles.slotBookedBy}>Booked by {slot.bookedByName}</ThemedText>
        )}
        {isBooked && !isTherapist && isBookedByMe && (
          <ThemedText style={styles.slotBookedBy}>Your booking</ThemedText>
        )}
        {isBooked && !isTherapist && !isBookedByMe && (
          <ThemedText style={styles.slotBookedBy}>Unavailable</ThemedText>
        )}
        {!isBooked && (
          <ThemedText style={[styles.slotStatus, { color: GREEN }]}>Available</ThemedText>
        )}
      </View>

      <View style={styles.slotActions}>
        {/* Therapist can delete unbooked slots */}
        {isTherapist && isOwnSlot && !isBooked && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: RED }]} onPress={onDelete}>
            <ThemedText style={styles.actionBtnText}>Remove</ThemedText>
          </TouchableOpacity>
        )}
        {/* Therapist can see booked slots — cancel on behalf */}
        {isTherapist && isOwnSlot && isBooked && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: AMBER }]} onPress={onCancel}>
            <ThemedText style={styles.actionBtnText}>Cancel</ThemedText>
          </TouchableOpacity>
        )}
        {/* Student can book open slots */}
        {!isTherapist && !isBooked && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: GREEN }]} onPress={onBook}>
            <ThemedText style={styles.actionBtnText}>Book</ThemedText>
          </TouchableOpacity>
        )}
        {/* Student can cancel own booking */}
        {!isTherapist && isBookedByMe && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: RED }]} onPress={onCancel}>
            <ThemedText style={styles.actionBtnText}>Cancel</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── Main Calendar Screen ────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
export default function CalendarScreen() {
  const { user } = useAuth();
  const {
    addSlot,
    removeSlot,
    bookSlot,
    cancelBooking,
    getSlotsForDate,
    getMarkedDates,
    getBookedSlots,
  } = useAvailability();

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const isTherapist = user?.role === 'therapist';
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');

  // Calendar marks
  const markedDates = useMemo(() => {
    const marks = isTherapist
      ? getMarkedDates(user?.email)
      : getMarkedDates(); // students see all therapists
    if (selectedDate) {
      return {
        ...marks,
        [selectedDate]: {
          ...(marks[selectedDate] || {}),
          selected: true,
          selectedColor: BRAND,
          marked: marks[selectedDate]?.marked ?? false,
          dotColor: marks[selectedDate]?.dotColor ?? BRAND,
        },
      };
    }
    return marks;
  }, [selectedDate, getMarkedDates, isTherapist, user?.email]);

  // Slots for the selected day
  const daySlots = useMemo(() => {
    if (!selectedDate) return [];
    const all = getSlotsForDate(selectedDate);
    if (isTherapist) {
      return all.filter((s) => s.therapistEmail === user?.email);
    }
    // Students see all open slots + their own bookings for the day
    return all.filter((s) => !s.bookedBy || s.bookedBy === user?.email);
  }, [selectedDate, getSlotsForDate, isTherapist, user?.email]);

  // My upcoming bookings (student only)
  const myBookings = useMemo(() => {
    if (isTherapist || !user) return [];
    return getBookedSlots(user.email).filter((s) => s.date >= new Date().toISOString().slice(0, 10));
  }, [isTherapist, user, getBookedSlots]);

  const handleAddSlot = async (start: string, end: string) => {
    if (!user) return;
    await addSlot({
      date: selectedDate,
      startTime: start,
      endTime: end,
      therapistEmail: user.email,
      therapistName: user.name,
    });
    setShowAddModal(false);
  };

  const confirmAction = (title: string, message: string, action: () => Promise<void>) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n${message}`)) action();
    } else {
      Alert.alert(title, message, [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: action },
      ]);
    }
  };

  // ─── Render ────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={[styles.container, isWide && styles.containerWide]}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>
            {isTherapist ? 'Manage Availability' : 'Book Appointment'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {isTherapist
              ? 'Select a date and add your available time slots'
              : 'Browse therapist availability and book a session'}
          </ThemedText>
        </View>

        {/* Calendar + Slots layout (side-by-side on wide screens) */}
        <View style={isWide ? styles.wideRow : undefined}>
          {/* Calendar */}
          <View style={[styles.calendarWrap, isWide && styles.calendarWrapWide]}>
            <Calendar
              onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
              markedDates={markedDates}
              minDate={new Date().toISOString().slice(0, 10)}
              theme={{
                backgroundColor: bgColor,
                calendarBackground: bgColor,
                textSectionTitleColor: textColor,
                dayTextColor: textColor,
                todayTextColor: BRAND,
                selectedDayBackgroundColor: BRAND,
                selectedDayTextColor: '#fff',
                monthTextColor: textColor,
                arrowColor: BRAND,
                textDisabledColor: '#999',
                dotColor: GREEN,
                selectedDotColor: '#fff',
              }}
            />
          </View>

          {/* Slot list */}
          <View style={[styles.slotSection, isWide && styles.slotSectionWide]}>
            {selectedDate ? (
              <>
                <View style={styles.slotHeader}>
                  <ThemedText style={styles.slotHeaderText}>
                    {selectedDate}
                  </ThemedText>
                  {isTherapist && (
                    <TouchableOpacity
                      style={styles.addSlotBtn}
                      onPress={() => setShowAddModal(true)}>
                      <ThemedText style={styles.addSlotBtnText}>+ Add Slot</ThemedText>
                    </TouchableOpacity>
                  )}
                </View>

                {daySlots.length === 0 ? (
                  <View style={styles.emptyState}>
                    <ThemedText style={styles.emptyText}>
                      {isTherapist
                        ? 'No slots added for this date yet.'
                        : 'No available slots for this date.'}
                    </ThemedText>
                  </View>
                ) : (
                  daySlots.map((slot) => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      isTherapist={isTherapist}
                      isOwnSlot={slot.therapistEmail === user?.email}
                      currentUserEmail={user?.email ?? ''}
                      currentUserName={user?.name ?? ''}
                      onDelete={() =>
                        confirmAction('Remove Slot', `Remove ${slot.startTime}–${slot.endTime}?`, () =>
                          removeSlot(slot.id),
                        )
                      }
                      onBook={() =>
                        confirmAction(
                          'Book Appointment',
                          `Book with ${slot.therapistName} at ${slot.startTime}–${slot.endTime}?`,
                          () => bookSlot(slot.id, user!.email, user!.name),
                        )
                      }
                      onCancel={() =>
                        confirmAction('Cancel', 'Cancel this booking?', () =>
                          cancelBooking(slot.id),
                        )
                      }
                    />
                  ))
                )}
              </>
            ) : (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyText}>
                  Select a date to {isTherapist ? 'manage availability' : 'view available slots'}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Student: My Upcoming Bookings */}
        {!isTherapist && myBookings.length > 0 && (
          <View style={styles.bookingsSection}>
            <ThemedText style={styles.bookingsTitle}>My Upcoming Bookings</ThemedText>
            {myBookings.map((slot) => (
              <View key={slot.id} style={[styles.slotCard, styles.slotBooked]}>
                <View style={styles.slotInfo}>
                  <ThemedText style={styles.slotTime}>
                    {slot.date} · {slot.startTime} – {slot.endTime}
                  </ThemedText>
                  <ThemedText style={styles.slotTherapist}>{slot.therapistName}</ThemedText>
                </View>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: RED }]}
                  onPress={() =>
                    confirmAction('Cancel Booking', 'Cancel this booking?', () =>
                      cancelBooking(slot.id),
                    )
                  }>
                  <ThemedText style={styles.actionBtnText}>Cancel</ThemedText>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: GREEN }]} />
            <ThemedText style={styles.legendLabel}>Available</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: AMBER }]} />
            <ThemedText style={styles.legendLabel}>Fully booked</ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Add Slot Modal (therapist only) */}
      <AddSlotModal
        visible={showAddModal}
        date={selectedDate}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddSlot}
      />
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── Styles ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 16, paddingBottom: 40 },
  containerWide: { maxWidth: 960, alignSelf: 'center', width: '100%' },

  header: { marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, opacity: 0.6 },

  wideRow: { flexDirection: 'row', gap: 20 },
  calendarWrap: { marginBottom: 16 },
  calendarWrapWide: { flex: 1 },

  slotSection: { marginBottom: 24 },
  slotSectionWide: { flex: 1 },

  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  slotHeaderText: { fontSize: 18, fontWeight: '600' },

  addSlotBtn: {
    backgroundColor: BRAND,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addSlotBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  slotOpen: { borderColor: GREEN, backgroundColor: 'rgba(16,185,129,0.06)' },
  slotBooked: { borderColor: AMBER, backgroundColor: 'rgba(245,158,11,0.06)' },

  slotInfo: { flex: 1, marginRight: 10 },
  slotTime: { fontSize: 16, fontWeight: '600' },
  slotTherapist: { fontSize: 13, opacity: 0.7, marginTop: 2 },
  slotBookedBy: { fontSize: 13, color: AMBER, marginTop: 2 },
  slotStatus: { fontSize: 13, marginTop: 2 },

  slotActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: { opacity: 0.5, fontSize: 14, textAlign: 'center' },

  bookingsSection: { marginTop: 8, marginBottom: 24 },
  bookingsTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },

  legend: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    paddingTop: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, opacity: 0.6 },

  // ─── Modal ──────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  modalDate: { fontSize: 14, opacity: 0.6, marginBottom: 20 },

  pickLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  timePicker: { maxHeight: 44, marginBottom: 4 },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(91,141,239,0.1)',
    marginRight: 8,
  },
  timeChipActive: { backgroundColor: BRAND },
  timeChipText: { fontSize: 14 },
  timeChipTextActive: { color: '#fff', fontWeight: '600' },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  cancelBtnText: { fontWeight: '600' },
  addBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: BRAND,
  },
  addBtnText: { color: '#fff', fontWeight: '700' },
});
