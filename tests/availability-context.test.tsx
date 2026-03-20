import React from 'react';
import renderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AvailabilityProvider, useAvailability } from '@/contexts/availability-context';

let ctx: ReturnType<typeof useAvailability> | null = null;

function AvailabilityConsumer() {
  ctx = useAvailability();
  return null;
}

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('AvailabilityProvider', () => {
  beforeEach(async () => {
    ctx = null;
    await AsyncStorage.clear();
  });

  it('adds and removes slots (expected + boundary)', async () => {
    await act(async () => {
      renderer.create(
        <AvailabilityProvider>
          <AvailabilityConsumer />
        </AvailabilityProvider>,
      );
      await flushPromises();
    });

    await act(async () => {
      await ctx?.addSlot({
        date: '2026-03-10',
        startTime: '09:00',
        endTime: '09:30',
        therapistEmail: 'therapist@ru.is',
        therapistName: 'Dr. Test',
      });
      await flushPromises();
    });

    const slots = ctx?.getSlotsForDate('2026-03-10', 'therapist@ru.is') ?? [];
    expect(slots.length).toBe(1);

    const marked = ctx?.getMarkedDates('therapist@ru.is') ?? {};
    expect(marked['2026-03-10']).toBeDefined();

    await act(async () => {
      await ctx?.removeSlot(slots[0].id);
      await flushPromises();
    });

    const after = ctx?.getSlotsForDate('2026-03-10', 'therapist@ru.is') ?? [];
    expect(after.length).toBe(0);
  });
});
