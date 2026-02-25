import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────
export interface TimeSlot {
  id: string;
  date: string;            // YYYY-MM-DD
  startTime: string;       // HH:MM
  endTime: string;         // HH:MM
  therapistEmail: string;
  therapistName: string;
  bookedBy: string | null; // student email or null
  bookedByName: string | null;
}

interface AvailabilityContextType {
  slots: TimeSlot[];
  isLoading: boolean;
  addSlot: (slot: Omit<TimeSlot, 'id' | 'bookedBy' | 'bookedByName'>) => Promise<void>;
  removeSlot: (slotId: string) => Promise<void>;
  bookSlot: (slotId: string, studentEmail: string, studentName: string) => Promise<void>;
  cancelBooking: (slotId: string) => Promise<void>;
  getSlotsForDate: (date: string) => TimeSlot[];
  getMarkedDates: (therapistEmail?: string) => Record<string, { marked: boolean; dotColor: string }>;
  getBookedSlots: (studentEmail: string) => TimeSlot[];
}

const STORAGE_KEY = 'mindtrack_availability';

const AvailabilityContext = createContext<AvailabilityContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────
export function AvailabilityProvider({ children }: { children: React.ReactNode }) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setSlots(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load availability', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Persist helper
  const persist = async (next: TimeSlot[]) => {
    setSlots(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  // ─── CRUD ──────────────────────────────────────────────────
  const addSlot = useCallback(
    async (slot: Omit<TimeSlot, 'id' | 'bookedBy' | 'bookedByName'>) => {
      const newSlot: TimeSlot = {
        ...slot,
        id: `${slot.date}_${slot.startTime}_${Date.now()}`,
        bookedBy: null,
        bookedByName: null,
      };
      const next = [...slots, newSlot].sort(
        (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
      );
      await persist(next);
    },
    [slots],
  );

  const removeSlot = useCallback(
    async (slotId: string) => {
      await persist(slots.filter((s) => s.id !== slotId));
    },
    [slots],
  );

  const bookSlot = useCallback(
    async (slotId: string, studentEmail: string, studentName: string) => {
      const next = slots.map((s) =>
        s.id === slotId ? { ...s, bookedBy: studentEmail, bookedByName: studentName } : s,
      );
      await persist(next);
    },
    [slots],
  );

  const cancelBooking = useCallback(
    async (slotId: string) => {
      const next = slots.map((s) =>
        s.id === slotId ? { ...s, bookedBy: null, bookedByName: null } : s,
      );
      await persist(next);
    },
    [slots],
  );

  // ─── Queries ───────────────────────────────────────────────
  const getSlotsForDate = useCallback(
    (date: string) => slots.filter((s) => s.date === date),
    [slots],
  );

  const getMarkedDates = useCallback(
    (therapistEmail?: string) => {
      const filtered = therapistEmail
        ? slots.filter((s) => s.therapistEmail === therapistEmail)
        : slots;

      const map: Record<string, { marked: boolean; dotColor: string }> = {};
      for (const s of filtered) {
        const hasOpen = !s.bookedBy;
        if (!map[s.date]) {
          map[s.date] = { marked: true, dotColor: hasOpen ? '#10B981' : '#F59E0B' };
        } else if (hasOpen) {
          // If at least one open slot, show green
          map[s.date].dotColor = '#10B981';
        }
      }
      return map;
    },
    [slots],
  );

  const getBookedSlots = useCallback(
    (studentEmail: string) => slots.filter((s) => s.bookedBy === studentEmail),
    [slots],
  );

  return (
    <AvailabilityContext.Provider
      value={{
        slots,
        isLoading,
        addSlot,
        removeSlot,
        bookSlot,
        cancelBooking,
        getSlotsForDate,
        getMarkedDates,
        getBookedSlots,
      }}>
      {children}
    </AvailabilityContext.Provider>
  );
}

export function useAvailability() {
  const ctx = useContext(AvailabilityContext);
  if (!ctx) throw new Error('useAvailability must be used within AvailabilityProvider');
  return ctx;
}
