import React from 'react';
import renderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppointmentsProvider, useAppointments } from '@/contexts/appointments-context';

let ctx: ReturnType<typeof useAppointments> | null = null;

function AppointmentsConsumer() {
  ctx = useAppointments();
  return null;
}

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('AppointmentsProvider', () => {
  beforeEach(async () => {
    ctx = null;
    await AsyncStorage.clear();
  });

  it('loads default appointments on refresh (expected case)', async () => {
    await act(async () => {
      renderer.create(
        <AppointmentsProvider>
          <AppointmentsConsumer />
        </AppointmentsProvider>,
      );
      await flushPromises();
    });

    expect(ctx?.appointments.length).toBeGreaterThan(0);
  });

  it('regression: setAppointments persists changes across refresh', async () => {
    await act(async () => {
      renderer.create(
        <AppointmentsProvider>
          <AppointmentsConsumer />
        </AppointmentsProvider>,
      );
      await flushPromises();
    });

    const updatedAppointments =
      ctx?.appointments.map((appointment, index) =>
        index === 0 ? { ...appointment, status: 'Completed' as const } : appointment,
      ) ?? [];

    await act(async () => {
      await ctx?.setAppointments(updatedAppointments);
      await flushPromises();
    });

    expect(ctx?.appointments[0]?.status).toBe('Completed');

    await act(async () => {
      await ctx?.refresh();
      await flushPromises();
    });

    expect(ctx?.appointments[0]?.status).toBe('Completed');
    expect(ctx?.appointments).toEqual(updatedAppointments);
  });
});
