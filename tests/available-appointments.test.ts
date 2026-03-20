import React from 'react';
import { renderHook } from '@testing-library/react-native';
import {
  AvailableAppointmentsProvider,
  useAvailableAppointments,
  type AppointmentSlot,
} from '@/contexts/available-appointments-context';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AvailableAppointmentsProvider, null, children);

describe('AvailableAppointmentsContext – slot data integrity', () => {
  it('provides a non-empty list of appointment slots', () => {
    const { result } = renderHook(() => useAvailableAppointments(), { wrapper });
    expect(result.current.slots.length).toBeGreaterThan(0);
  });

  it('provides exactly 6 predefined slots', () => {
    const { result } = renderHook(() => useAvailableAppointments(), { wrapper });
    expect(result.current.slots).toHaveLength(6);
  });

  it('all slot ids are unique', () => {
    const { result } = renderHook(() => useAvailableAppointments(), { wrapper });
    const ids = result.current.slots.map((s: AppointmentSlot) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all slots have required fields populated', () => {
    const { result } = renderHook(() => useAvailableAppointments(), { wrapper });
    result.current.slots.forEach((slot: AppointmentSlot) => {
      expect(slot.id).toBeTruthy();
      expect(slot.therapistId).toBeTruthy();
      expect(slot.date).toBeTruthy();
      expect(slot.startTime).toBeTruthy();
      expect(slot.endTime).toBeTruthy();
      expect(slot.mode).toBeTruthy();
      expect(slot.location).toBeTruthy();
    });
  });

  it('all slot dates follow YYYY-MM-DD format', () => {
    const { result } = renderHook(() => useAvailableAppointments(), { wrapper });
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    result.current.slots.forEach((slot: AppointmentSlot) => {
      expect(slot.date).toMatch(dateRegex);
    });
  });

  it('all slot times follow HH:MM format', () => {
    const { result } = renderHook(() => useAvailableAppointments(), { wrapper });
    const timeRegex = /^\d{2}:\d{2}$/;

    result.current.slots.forEach((slot: AppointmentSlot) => {
      expect(slot.startTime).toMatch(timeRegex);
      expect(slot.endTime).toMatch(timeRegex);
    });
  });

  it('endTime is always after startTime for each slot', () => {
    const { result } = renderHook(() => useAvailableAppointments(), { wrapper });

    result.current.slots.forEach((slot: AppointmentSlot) => {
      expect(slot.endTime.localeCompare(slot.startTime)).toBeGreaterThan(0);
    });
  });

  it('mode is either "In person" or "Online"', () => {
    const { result } = renderHook(() => useAvailableAppointments(), { wrapper });

    result.current.slots.forEach((slot: AppointmentSlot) => {
      expect(['In person', 'Online']).toContain(slot.mode);
    });
  });

  it('therapist ids reference valid therapist ids (t1, t2, t3)', () => {
    const { result } = renderHook(() => useAvailableAppointments(), { wrapper });
    const validIds = ['t1', 't2', 't3'];

    result.current.slots.forEach((slot: AppointmentSlot) => {
      expect(validIds).toContain(slot.therapistId);
    });
  });

  it('each therapist has at least one slot', () => {
    const { result } = renderHook(() => useAvailableAppointments(), { wrapper });

    const therapistIds = new Set(result.current.slots.map((s: AppointmentSlot) => s.therapistId));
    expect(therapistIds.has('t1')).toBe(true);
    expect(therapistIds.has('t2')).toBe(true);
    expect(therapistIds.has('t3')).toBe(true);
  });

  it('each therapist has exactly 2 slots', () => {
    const { result } = renderHook(() => useAvailableAppointments(), { wrapper });

    const countByTherapist: Record<string, number> = {};
    result.current.slots.forEach((s: AppointmentSlot) => {
      countByTherapist[s.therapistId] = (countByTherapist[s.therapistId] || 0) + 1;
    });

    expect(countByTherapist['t1']).toBe(2);
    expect(countByTherapist['t2']).toBe(2);
    expect(countByTherapist['t3']).toBe(2);
  });

  it('slots include both in-person and online appointments', () => {
    const { result } = renderHook(() => useAvailableAppointments(), { wrapper });
    const modes = new Set(result.current.slots.map((s: AppointmentSlot) => s.mode));

    expect(modes.has('In person')).toBe(true);
    expect(modes.has('Online')).toBe(true);
  });

  it('in-person slots reference a physical room location', () => {
    const { result } = renderHook(() => useAvailableAppointments(), { wrapper });

    result.current.slots
      .filter((s: AppointmentSlot) => s.mode === 'In person')
      .forEach((slot: AppointmentSlot) => {
        expect(slot.location).toMatch(/Room \d+/);
      });
  });
});

describe('AvailableAppointmentsContext – filtering operations', () => {
  it('can filter slots by therapist id', () => {
    const { result } = renderHook(() => useAvailableAppointments(), { wrapper });

    const t1Slots = result.current.slots.filter(
      (s: AppointmentSlot) => s.therapistId === 't1',
    );
    expect(t1Slots.length).toBeGreaterThan(0);
    t1Slots.forEach((s: AppointmentSlot) => {
      expect(s.therapistId).toBe('t1');
    });
  });

  it('can sort slots chronologically', () => {
    const { result } = renderHook(() => useAvailableAppointments(), { wrapper });

    const sorted = [...result.current.slots].sort(
      (a: AppointmentSlot, b: AppointmentSlot) =>
        `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`),
    );

    for (let i = 1; i < sorted.length; i++) {
      const prev = `${sorted[i - 1].date}T${sorted[i - 1].startTime}`;
      const curr = `${sorted[i].date}T${sorted[i].startTime}`;
      expect(curr >= prev).toBe(true);
    }
  });
});

describe('AvailableAppointmentsContext – useAvailableAppointments outside provider', () => {
  it('throws when used outside AvailableAppointmentsProvider', () => {
    expect(() => {
      renderHook(() => useAvailableAppointments());
    }).toThrow('useAvailableAppointments must be used within an AvailableAppointmentsProvider');
  });
});
