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
}

interface AvailabilityContextType {
  slots: TimeSlot[];
  isLoading: boolean;
  addSlot: (slot: Omit<TimeSlot, 'id'>) => Promise<void>;
  removeSlot: (slotId: string) => Promise<void>;
  getSlotsForDate: (date: string, therapistEmail: string) => TimeSlot[];
  getMarkedDates: (therapistEmail: string) => Record<string, { marked: boolean; dotColor: string }>;
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
    async (slot: Omit<TimeSlot, 'id'>) => {
      const newSlot: TimeSlot = {
        ...slot,
        id: `${slot.date}_${slot.startTime}_${Date.now()}`,
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

  // ─── Queries ───────────────────────────────────────────────
  const getSlotsForDate = useCallback(
    (date: string, therapistEmail: string) =>
      slots.filter((s) => s.date === date && s.therapistEmail === therapistEmail),
    [slots],
  );

  const getMarkedDates = useCallback(
    (therapistEmail: string) => {
      const filtered = slots.filter((s) => s.therapistEmail === therapistEmail);
      const map: Record<string, { marked: boolean; dotColor: string }> = {};
      for (const s of filtered) {
        if (!map[s.date]) {
          map[s.date] = { marked: true, dotColor: '#10B981' };
        }
      }
      return map;
    },
    [slots],
  );

  return (
    <AvailabilityContext.Provider
      value={{
        slots,
        isLoading,
        addSlot,
        removeSlot,
        getSlotsForDate,
        getMarkedDates,
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
