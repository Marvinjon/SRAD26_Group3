import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppointmentsProvider,
  useAppointments,
  type TherapistAppointment,
} from '@/contexts/appointments-context';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppointmentsProvider>{children}</AppointmentsProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage as any).__resetStore();
});

describe('AppointmentsContext – initial load', () => {
  it('loads default appointments when storage is empty', async () => {
    const { result } = renderHook(() => useAppointments(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.appointments.length).toBe(4);
    expect(result.current.appointments[0].id).toBe('apt-1');
    expect(result.current.appointments[0].studentName).toBe('Anna Jonsdottir');
  });

  it('loads appointments from storage when present', async () => {
    const custom: TherapistAppointment[] = [
      {
        id: 'custom-apt',
        studentName: 'Custom Student',
        date: 'Mar 15',
        time: '14:00',
        type: 'Individual',
        status: 'Booked',
      },
    ];
    await AsyncStorage.setItem('mindtrack_appointments', JSON.stringify(custom));

    const { result } = renderHook(() => useAppointments(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.appointments).toHaveLength(1);
    expect(result.current.appointments[0].studentName).toBe('Custom Student');
  });

  it('default appointments have correct types and statuses', async () => {
    const { result } = renderHook(() => useAppointments(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const types = result.current.appointments.map((a) => a.type);
    const statuses = result.current.appointments.map((a) => a.status);

    expect(types).toContain('Individual');
    expect(types).toContain('Workshop');
    statuses.forEach((s) => {
      expect(['Booked', 'Completed', 'Canceled']).toContain(s);
    });
  });

  it('default appointment ids are unique', async () => {
    const { result } = renderHook(() => useAppointments(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const ids = result.current.appointments.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('AppointmentsContext – setAppointments', () => {
  it('replaces all appointments and persists to storage', async () => {
    const { result } = renderHook(() => useAppointments(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const replacement: TherapistAppointment[] = [
      {
        id: 'new-1',
        studentName: 'New Student',
        date: 'Apr 1',
        time: '10:00',
        type: 'Individual',
        status: 'Booked',
      },
    ];

    (AsyncStorage.setItem as jest.Mock).mockClear();

    await act(async () => {
      await result.current.setAppointments(replacement);
    });

    expect(result.current.appointments).toHaveLength(1);
    expect(result.current.appointments[0].studentName).toBe('New Student');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'mindtrack_appointments',
      JSON.stringify(replacement),
    );
  });

  it('can set appointments to an empty array', async () => {
    const { result } = renderHook(() => useAppointments(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    await act(async () => {
      await result.current.setAppointments([]);
    });

    expect(result.current.appointments).toEqual([]);
  });

  it('can update appointment status (e.g. mark as Canceled)', async () => {
    const { result } = renderHook(() => useAppointments(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const updated = result.current.appointments.map((a) =>
      a.id === 'apt-1' ? { ...a, status: 'Canceled' as const } : a,
    );

    await act(async () => {
      await result.current.setAppointments(updated);
    });

    const canceled = result.current.appointments.find((a) => a.id === 'apt-1');
    expect(canceled?.status).toBe('Canceled');
  });
});

describe('AppointmentsContext – refresh', () => {
  it('reloads appointments from storage', async () => {
    const { result } = renderHook(() => useAppointments(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Manually write different data to storage
    const newData: TherapistAppointment[] = [
      {
        id: 'refreshed-1',
        studentName: 'Refreshed',
        date: 'May 1',
        time: '12:00',
        type: 'Workshop',
        status: 'Completed',
      },
    ];
    await AsyncStorage.setItem('mindtrack_appointments', JSON.stringify(newData));

    await act(async () => {
      await result.current.refresh();
    });

    // Wait for state update
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.appointments).toHaveLength(1);
    expect(result.current.appointments[0].id).toBe('refreshed-1');
  });
});

describe('AppointmentsContext – useAppointments outside provider', () => {
  it('throws when used outside AppointmentsProvider', () => {
    expect(() => {
      renderHook(() => useAppointments());
    }).toThrow('useAppointments must be used within an AppointmentsProvider');
  });
});
