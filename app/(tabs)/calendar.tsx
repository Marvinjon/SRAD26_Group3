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

// ─── Add Slot Modal ─────────────────────────────────────────
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

// ─── Slot Card (therapist-only, simple) ─────────────────────
function SlotCard({
  slot,
  onDelete,
}: {
  slot: TimeSlot;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.slotCard, styles.slotOpen]}>
      <View style={styles.slotInfo}>
        <ThemedText style={styles.slotTime}>
          {slot.startTime} – {slot.endTime}
        </ThemedText>
        <ThemedText style={[styles.slotStatus, { color: GREEN }]}>Available</ThemedText>
      </View>
      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: RED }]} onPress={onDelete}>
        <ThemedText style={styles.actionBtnText}>Remove</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── Main Calendar Screen (Therapist Only) ───────────────────
// ═══════════════════════════════════════════════════════════════
export default function CalendarScreen() {
  const { user } = useAuth();
  const { addSlot, removeSlot, getSlotsForDate, getMarkedDates } = useAvailability();

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');

  // Calendar marks — show dots on dates that have slots
  const markedDates = useMemo(() => {
    if (!user) return {};
    const marks = getMarkedDates(user.email);
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
  }, [selectedDate, getMarkedDates, user]);

  // Slots for the selected day (own slots only)
  const daySlots = useMemo(() => {
    if (!selectedDate || !user) return [];
    return getSlotsForDate(selectedDate, user.email);
  }, [selectedDate, getSlotsForDate, user]);

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

  const confirmRemove = (slot: TimeSlot) => {
    const msg = `Remove ${slot.startTime}–${slot.endTime}?`;
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) removeSlot(slot.id);
    } else {
      Alert.alert('Remove Slot', msg, [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => removeSlot(slot.id) },
      ]);
    }
  };

  // ─── Render ────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={[styles.container, isWide && styles.containerWide]}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Manage Availability</ThemedText>
          <ThemedText style={styles.subtitle}>
            Select a date and add your available time slots
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
                  <ThemedText style={styles.slotHeaderText}>{selectedDate}</ThemedText>
                  <TouchableOpacity
                    style={styles.addSlotBtn}
                    onPress={() => setShowAddModal(true)}>
                    <ThemedText style={styles.addSlotBtnText}>+ Add Slot</ThemedText>
                  </TouchableOpacity>
                </View>

                {daySlots.length === 0 ? (
                  <View style={styles.emptyState}>
                    <ThemedText style={styles.emptyText}>
                      No slots added for this date yet.
                    </ThemedText>
                  </View>
                ) : (
                  daySlots.map((slot) => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      onDelete={() => confirmRemove(slot)}
                    />
                  ))
                )}
              </>
            ) : (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyText}>
                  Select a date to manage availability
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: GREEN }]} />
            <ThemedText style={styles.legendLabel}>Has availability</ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Add Slot Modal */}
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

  slotInfo: { flex: 1, marginRight: 10 },
  slotTime: { fontSize: 16, fontWeight: '600' },
  slotStatus: { fontSize: 13, marginTop: 2 },

  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: { opacity: 0.5, fontSize: 14, textAlign: 'center' },

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
