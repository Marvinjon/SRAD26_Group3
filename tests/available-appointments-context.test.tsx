import React from 'react';
import renderer, { act } from 'react-test-renderer';

import {
  AvailableAppointmentsProvider,
  useAvailableAppointments,
} from '@/contexts/available-appointments-context';

let receivedSlots: unknown = null;

function SlotsConsumer() {
  const { slots } = useAvailableAppointments();
  receivedSlots = slots;
  return null;
}

describe('AvailableAppointmentsProvider', () => {
  beforeEach(() => {
    receivedSlots = null;
  });

  it('provides appointment slots (expected case)', () => {
    act(() => {
      renderer.create(
        <AvailableAppointmentsProvider>
          <SlotsConsumer />
        </AvailableAppointmentsProvider>,
      );
    });

    expect(Array.isArray(receivedSlots)).toBe(true);
    expect((receivedSlots as unknown[]).length).toBeGreaterThan(0);
  });
});
