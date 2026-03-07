import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { THERAPISTS } from '@/constants/therapists_list';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';

interface AppointmentSlot {
  id: string;
  therapistId: string;
  date: string;
  startTime: string;
  endTime: string;
  mode: string;
  location: string;
}

type BookingMap = Record<string, string>;

const BOOKINGS_KEY = 'mindtrack_booked_appointments';
const ALL_APPOINTMENTS = (require('@/data/available-appointments.json') as AppointmentSlot[])
  .slice()
  .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T12:00:00`));
}

export default function TherapistsScreen() {
  const { user, selectTherapist } = useAuth();
  const [bookings, setBookings] = useState<BookingMap>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const textColor = useThemeColor({}, 'text');
  const canBookAppointments = user?.role === 'student' || user?.role === 'employee';

  useEffect(() => {
    let active = true;

    async function loadBookings() {
      try {
        const raw = await AsyncStorage.getItem(BOOKINGS_KEY);
        if (active) {
          setBookings(raw ? JSON.parse(raw) : {});
        }
      } catch {
        if (active) {
          setError('Could not load appointments. Please try again.');
        }
      }
    }

    loadBookings();

    return () => {
      active = false;
    };
  }, []);

  const selectedTherapist = THERAPISTS.find((therapist) => therapist.id === user?.selectedTherapistId);

  const selectedTherapistAppointments = useMemo(
    () =>
      selectedTherapist
        ? ALL_APPOINTMENTS.filter((slot) => slot.therapistId === selectedTherapist.id)
        : [],
    [selectedTherapist],
  );

  const myAppointments = useMemo(
    () => ALL_APPOINTMENTS.filter((slot) => bookings[slot.id] === user?.email),
    [bookings, user?.email],
  );

  async function handleSelectTherapist(therapistId: string) {
    setError('');
    setNotice('');

    try {
      await selectTherapist(therapistId);
    } catch {
      setError('Could not select therapist. Please try again.');
    }
  }

  async function handleBookAppointment(slotId: string) {
    if (!user) {
      return;
    }

    setError('');
    setNotice('');

    if (!canBookAppointments) {
      setError('Only students and university staff can book appointments.');
      return;
    }

    if (bookings[slotId]) {
      setError('This appointment is no longer available.');
      return;
    }

    const previousBookings = bookings;
    const nextBookings: BookingMap = {
      ...previousBookings,
      [slotId]: user.email,
    };

    setBookings(nextBookings);

    try {
      await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(nextBookings));
      setNotice('Appointment booked successfully.');
    } catch {
      setBookings(previousBookings);
      setError('Could not save booking. Please try again.');
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.title}>Therapist Support</ThemedText>
        <ThemedText style={[styles.subtitle, { color: textColor + 'A6' }]}> 
          Select a therapist and book an available appointment.
        </ThemedText>

        {!canBookAppointments ? (
          <View style={[styles.infoBanner, { borderColor: textColor + '26' }]}>
            <ThemedText style={styles.infoText}>
              Booking is available for students and university staff.
            </ThemedText>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        ) : null}

        {notice ? (
          <View style={styles.noticeContainer}>
            <ThemedText style={styles.noticeText}>{notice}</ThemedText>
          </View>
        ) : null}

        <ThemedText style={styles.sectionTitle}>Choose therapist</ThemedText>
        {THERAPISTS.map((therapist) => {
          const isSelected = therapist.id === selectedTherapist?.id;

          return (
            <View key={therapist.id} style={[styles.card, { borderColor: textColor + '20' }]}>
              <View style={styles.therapistHeader}>
                <View style={styles.therapistDetails}>
                  <ThemedText style={styles.therapistName}>{therapist.name}</ThemedText>
                  <ThemedText style={[styles.therapistSpecialty, { color: textColor + '99' }]}>
                    Specialty: {therapist.specialty}
                  </ThemedText>
                </View>
                {isSelected ? (
                  <View style={styles.selectedBadge}>
                    <ThemedText style={styles.selectedBadgeText}>Selected</ThemedText>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.secondaryButton, isSelected && styles.secondaryButtonDisabled]}
                onPress={() => handleSelectTherapist(therapist.id)}
                disabled={isSelected}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.secondaryButtonText}>
                  {isSelected ? 'Selected therapist' : 'Select therapist'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          );
        })}

        <ThemedText style={styles.sectionTitle}>Available appointments</ThemedText>

        {!selectedTherapist ? (
          <View style={[styles.card, { borderColor: textColor + '20' }]}>
            <ThemedText style={[styles.emptyText, { color: textColor + '99' }]}> 
              Select a therapist to see open appointment slots.
            </ThemedText>
          </View>
        ) : (
          selectedTherapistAppointments.map((slot) => {
            const bookedBy = bookings[slot.id];
            const bookedByCurrentUser = bookedBy === user?.email;
            const bookedBySomeoneElse = Boolean(bookedBy) && !bookedByCurrentUser;
            const canBookSlot = canBookAppointments && !bookedBy;

            return (
              <View key={slot.id} style={[styles.card, { borderColor: textColor + '20' }]}>
                <View style={styles.appointmentHeader}>
                  <ThemedText style={styles.appointmentDate}>{formatDate(slot.date)}</ThemedText>
                  {bookedByCurrentUser ? (
                    <View style={styles.selectedBadge}>
                      <ThemedText style={styles.selectedBadgeText}>Booked by you</ThemedText>
                    </View>
                  ) : null}
                  {bookedBySomeoneElse ? (
                    <View style={styles.unavailableBadge}>
                      <ThemedText style={styles.unavailableBadgeText}>Unavailable</ThemedText>
                    </View>
                  ) : null}
                </View>

                <ThemedText style={styles.appointmentMeta}>{slot.startTime} - {slot.endTime}</ThemedText>
                <ThemedText style={[styles.appointmentMeta, { color: textColor + '99' }]}>
                  {slot.mode} • {slot.location}
                </ThemedText>

                <TouchableOpacity
                  style={[styles.primaryButton, !canBookSlot && styles.primaryButtonDisabled]}
                  onPress={() => handleBookAppointment(slot.id)}
                  disabled={!canBookSlot}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.primaryButtonText}>
                    {bookedByCurrentUser
                      ? 'Already booked'
                      : bookedBySomeoneElse
                        ? 'Booked'
                        : canBookAppointments
                          ? 'Book appointment'
                          : 'Students/staff only'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        <ThemedText style={styles.sectionTitle}>My booked appointments</ThemedText>
        {myAppointments.length === 0 ? (
          <View style={[styles.card, { borderColor: textColor + '20' }]}>
            <ThemedText style={[styles.emptyText, { color: textColor + '99' }]}> 
              You do not have any booked appointments yet.
            </ThemedText>
          </View>
        ) : (
          myAppointments.map((slot) => {
            const therapist = THERAPISTS.find((item) => item.id === slot.therapistId);

            return (
              <View key={`my-${slot.id}`} style={[styles.card, { borderColor: textColor + '20' }]}>
                <ThemedText style={styles.appointmentDate}>{formatDate(slot.date)}</ThemedText>
                <ThemedText style={styles.appointmentMeta}>{slot.startTime} - {slot.endTime}</ThemedText>
                <ThemedText style={styles.appointmentMeta}>{therapist?.name ?? 'Therapist'}</ThemedText>
                <ThemedText style={[styles.appointmentMeta, { color: textColor + '99' }]}>
                  {slot.mode} • {slot.location}
                </ThemedText>
              </View>
            );
          })
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#5B8DEF',
  },
  subtitle: {
    marginBottom: 6,
  },
  infoBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#5B8DEF14',
  },
  infoText: {
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#ffeaea',
    borderWidth: 1,
    borderColor: '#ffb8b8',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: '#a30000',
    fontWeight: '600',
  },
  noticeContainer: {
    backgroundColor: '#ebfff1',
    borderWidth: 1,
    borderColor: '#9fddb2',
    borderRadius: 12,
    padding: 12,
  },
  noticeText: {
    color: '#0c6c30',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 6,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  therapistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  therapistDetails: {
    flex: 1,
    gap: 2,
  },
  therapistName: {
    fontSize: 17,
    fontWeight: '700',
  },
  therapistSpecialty: {
    fontSize: 14,
  },
  selectedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#5B8DEF',
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  unavailableBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#a3a3a3',
  },
  unavailableBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  appointmentMeta: {
    fontSize: 14,
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: '#5B8DEF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#9ca9c8',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#5B8DEF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonDisabled: {
    borderColor: '#9ca9c8',
  },
  secondaryButtonText: {
    color: '#5B8DEF',
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
  },
});
