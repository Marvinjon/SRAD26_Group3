import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AvailabilityProvider, useAvailability, type TimeSlot } from '@/contexts/availability-context';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AvailabilityProvider>{children}</AvailabilityProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage as any).__resetStore();
});

describe('AvailabilityContext – addSlot', () => {
  it('adds a new time slot with generated id', async () => {
    const { result } = renderHook(() => useAvailability(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    await act(async () => {
      await result.current.addSlot({
        date: '2026-04-01',
        startTime: '09:00',
        endTime: '10:00',
        therapistEmail: 'doc@ru.is',
        therapistName: 'Dr. Test',
      });
    });

    expect(result.current.slots).toHaveLength(1);
    expect(result.current.slots[0].date).toBe('2026-04-01');
    expect(result.current.slots[0].startTime).toBe('09:00');
    expect(result.current.slots[0].endTime).toBe('10:00');
    expect(result.current.slots[0].therapistEmail).toBe('doc@ru.is');
    expect(result.current.slots[0].id).toBeTruthy();
  });

  it('generates unique ids for each slot', async () => {
    const { result } = renderHook(() => useAvailability(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    await act(async () => {
      await result.current.addSlot({
        date: '2026-04-01',
        startTime: '09:00',
        endTime: '10:00',
        therapistEmail: 'doc@ru.is',
        therapistName: 'Dr. Test',
      });
    });

    await act(async () => {
      await result.current.addSlot({
        date: '2026-04-01',
        startTime: '11:00',
        endTime: '12:00',
        therapistEmail: 'doc@ru.is',
        therapistName: 'Dr. Test',
      });
    });

    expect(result.current.slots).toHaveLength(2);
    expect(result.current.slots[0].id).not.toBe(result.current.slots[1].id);
  });

  it('sorts slots by date then start time after adding', async () => {
    const { result } = renderHook(() => useAvailability(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    await act(async () => {
      await result.current.addSlot({
        date: '2026-04-03',
        startTime: '14:00',
        endTime: '15:00',
        therapistEmail: 'doc@ru.is',
        therapistName: 'Dr. Test',
      });
    });

    await act(async () => {
      await result.current.addSlot({
        date: '2026-04-01',
        startTime: '09:00',
        endTime: '10:00',
        therapistEmail: 'doc@ru.is',
        therapistName: 'Dr. Test',
      });
    });

    await act(async () => {
      await result.current.addSlot({
        date: '2026-04-01',
        startTime: '11:00',
        endTime: '12:00',
        therapistEmail: 'doc@ru.is',
        therapistName: 'Dr. Test',
      });
    });

    expect(result.current.slots[0].date).toBe('2026-04-01');
    expect(result.current.slots[0].startTime).toBe('09:00');
    expect(result.current.slots[1].date).toBe('2026-04-01');
    expect(result.current.slots[1].startTime).toBe('11:00');
    expect(result.current.slots[2].date).toBe('2026-04-03');
    expect(result.current.slots[2].startTime).toBe('14:00');
  });

  it('persists added slot to AsyncStorage', async () => {
    const { result } = renderHook(() => useAvailability(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    await act(async () => {
      await result.current.addSlot({
        date: '2026-05-01',
        startTime: '08:00',
        endTime: '09:00',
        therapistEmail: 'persist@ru.is',
        therapistName: 'Dr. Persist',
      });
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'mindtrack_availability',
      expect.stringContaining('2026-05-01'),
    );
  });
});

describe('AvailabilityContext – removeSlot', () => {
  it('removes a slot by id', async () => {
    const initial: TimeSlot[] = [
      {
        id: 'slot-1',
        date: '2026-04-01',
        startTime: '09:00',
        endTime: '10:00',
        therapistEmail: 'doc@ru.is',
        therapistName: 'Dr. Test',
      },
      {
        id: 'slot-2',
        date: '2026-04-02',
        startTime: '10:00',
        endTime: '11:00',
        therapistEmail: 'doc@ru.is',
        therapistName: 'Dr. Test',
      },
    ];
    await AsyncStorage.setItem('mindtrack_availability', JSON.stringify(initial));

    const { result } = renderHook(() => useAvailability(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.slots).toHaveLength(2);

    await act(async () => {
      await result.current.removeSlot('slot-1');
    });

    expect(result.current.slots).toHaveLength(1);
    expect(result.current.slots[0].id).toBe('slot-2');
  });

  it('does nothing when removing non-existent slot id', async () => {
    const initial: TimeSlot[] = [
      {
        id: 'only-slot',
        date: '2026-04-01',
        startTime: '09:00',
        endTime: '10:00',
        therapistEmail: 'doc@ru.is',
        therapistName: 'Dr. Test',
      },
    ];
    await AsyncStorage.setItem('mindtrack_availability', JSON.stringify(initial));

    const { result } = renderHook(() => useAvailability(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    await act(async () => {
      await result.current.removeSlot('non-existent');
    });

    expect(result.current.slots).toHaveLength(1);
  });
});

describe('AvailabilityContext – getSlotsForDate', () => {
  it('returns only slots matching date and therapist email', async () => {
    const slots: TimeSlot[] = [
      { id: 's1', date: '2026-04-01', startTime: '09:00', endTime: '10:00', therapistEmail: 'a@ru.is', therapistName: 'A' },
      { id: 's2', date: '2026-04-01', startTime: '11:00', endTime: '12:00', therapistEmail: 'b@ru.is', therapistName: 'B' },
      { id: 's3', date: '2026-04-02', startTime: '09:00', endTime: '10:00', therapistEmail: 'a@ru.is', therapistName: 'A' },
      { id: 's4', date: '2026-04-01', startTime: '14:00', endTime: '15:00', therapistEmail: 'a@ru.is', therapistName: 'A' },
    ];
    await AsyncStorage.setItem('mindtrack_availability', JSON.stringify(slots));

    const { result } = renderHook(() => useAvailability(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const filtered = result.current.getSlotsForDate('2026-04-01', 'a@ru.is');
    expect(filtered).toHaveLength(2);
    expect(filtered.every((s) => s.date === '2026-04-01' && s.therapistEmail === 'a@ru.is')).toBe(true);
  });

  it('returns empty array when no slots match', async () => {
    const { result } = renderHook(() => useAvailability(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const filtered = result.current.getSlotsForDate('2099-01-01', 'nobody@ru.is');
    expect(filtered).toEqual([]);
  });
});

describe('AvailabilityContext – getMarkedDates', () => {
  it('returns marked dates only for the specified therapist', async () => {
    const slots: TimeSlot[] = [
      { id: 's1', date: '2026-04-01', startTime: '09:00', endTime: '10:00', therapistEmail: 'a@ru.is', therapistName: 'A' },
      { id: 's2', date: '2026-04-01', startTime: '11:00', endTime: '12:00', therapistEmail: 'a@ru.is', therapistName: 'A' },
      { id: 's3', date: '2026-04-02', startTime: '09:00', endTime: '10:00', therapistEmail: 'b@ru.is', therapistName: 'B' },
      { id: 's4', date: '2026-04-03', startTime: '09:00', endTime: '10:00', therapistEmail: 'a@ru.is', therapistName: 'A' },
    ];
    await AsyncStorage.setItem('mindtrack_availability', JSON.stringify(slots));

    const { result } = renderHook(() => useAvailability(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const marked = result.current.getMarkedDates('a@ru.is');

    expect(Object.keys(marked)).toHaveLength(2);
    expect(marked['2026-04-01']).toEqual({ marked: true, dotColor: '#10B981' });
    expect(marked['2026-04-03']).toEqual({ marked: true, dotColor: '#10B981' });
    expect(marked['2026-04-02']).toBeUndefined();
  });

  it('returns empty object when therapist has no slots', async () => {
    const { result } = renderHook(() => useAvailability(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const marked = result.current.getMarkedDates('ghost@ru.is');
    expect(marked).toEqual({});
  });

  it('deduplicates dates with multiple slots on the same day', async () => {
    const slots: TimeSlot[] = [
      { id: 's1', date: '2026-05-10', startTime: '09:00', endTime: '10:00', therapistEmail: 'dup@ru.is', therapistName: 'Dup' },
      { id: 's2', date: '2026-05-10', startTime: '11:00', endTime: '12:00', therapistEmail: 'dup@ru.is', therapistName: 'Dup' },
      { id: 's3', date: '2026-05-10', startTime: '14:00', endTime: '15:00', therapistEmail: 'dup@ru.is', therapistName: 'Dup' },
    ];
    await AsyncStorage.setItem('mindtrack_availability', JSON.stringify(slots));

    const { result } = renderHook(() => useAvailability(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const marked = result.current.getMarkedDates('dup@ru.is');
    expect(Object.keys(marked)).toHaveLength(1);
    expect(marked['2026-05-10'].marked).toBe(true);
  });
});

describe('AvailabilityContext – useAvailability outside provider', () => {
  it('throws when used outside AvailabilityProvider', () => {
    expect(() => {
      renderHook(() => useAvailability());
    }).toThrow('useAvailability must be used within AvailabilityProvider');
  });
});
