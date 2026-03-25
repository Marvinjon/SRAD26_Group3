import React from 'react';
import renderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { WorkshopsProvider, useWorkshops } from '@/contexts/workshops-context';

let ctx: ReturnType<typeof useWorkshops> | null = null;

function WorkshopsConsumer() {
  ctx = useWorkshops();
  return null;
}

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('WorkshopsProvider', () => {
  beforeEach(async () => {
    ctx = null;
    await AsyncStorage.clear();
  });

  it('loads default workshops (expected case)', async () => {
    await act(async () => {
      renderer.create(
        <WorkshopsProvider>
          <WorkshopsConsumer />
        </WorkshopsProvider>,
      );
      await flushPromises();
    });

    expect(ctx?.workshops.length).toBeGreaterThan(0);
  });

  it('creates and removes a workshop (boundary: remove existing)', async () => {
    await act(async () => {
      renderer.create(
        <WorkshopsProvider>
          <WorkshopsConsumer />
        </WorkshopsProvider>,
      );
      await flushPromises();
    });

    const initialCount = ctx?.workshops.length ?? 0;
    await act(async () => {
      await ctx?.createWorkshop({
        title: 'Test Workshop',
        description: 'Testing create',
        date: 'Mar 20',
        time: '10:00',
        hostEmail: 'therapist@ru.is',
        maxParticipants: 5,
      });
      await flushPromises();
    });

    expect(ctx?.workshops.length).toBe(initialCount + 1);

    const createdId = ctx?.workshops[0]?.id as string;
    await act(async () => {
      await ctx?.removeWorkshop(createdId);
      await flushPromises();
    });

    expect(ctx?.workshops.find((w) => w.id === createdId)).toBeUndefined();
  });

  it('prevents registration when workshop is full (boundary/invalid)', async () => {
    await act(async () => {
      renderer.create(
        <WorkshopsProvider>
          <WorkshopsConsumer />
        </WorkshopsProvider>,
      );
      await flushPromises();
    });

    await act(async () => {
      await ctx?.createWorkshop({
        title: 'Capacity Test',
        description: 'Only one spot',
        date: 'Mar 21',
        time: '11:00',
        hostEmail: 'therapist@ru.is',
        maxParticipants: 1,
      });
      await flushPromises();
    });

    const workshopId = ctx?.workshops[0]?.id as string;

    await act(async () => {
      await ctx?.toggleRegistration(workshopId, 'student1@ru.is');
      await flushPromises();
    });

    const afterFirst = ctx?.workshops.find((w) => w.id === workshopId);
    expect(afterFirst?.registered.length).toBe(1);

    await act(async () => {
      await ctx?.toggleRegistration(workshopId, 'student2@ru.is');
      await flushPromises();
    });

    const afterSecond = ctx?.workshops.find((w) => w.id === workshopId);
    expect(afterSecond?.registered).toEqual(['student1@ru.is']);
  });

  it('regression: toggling registration twice lets a user leave again', async () => {
    await act(async () => {
      renderer.create(
        <WorkshopsProvider>
          <WorkshopsConsumer />
        </WorkshopsProvider>,
      );
      await flushPromises();
    });

    const workshopId = ctx?.workshops.find((workshop) => workshop.id === 'wks-2')?.id as string;
    const attendee = 'repeat-user@ru.is';

    await act(async () => {
      await ctx?.toggleRegistration(workshopId, attendee);
      await flushPromises();
    });

    expect(ctx?.workshops.find((workshop) => workshop.id === workshopId)?.registered).toContain(attendee);

    await act(async () => {
      await ctx?.toggleRegistration(workshopId, attendee);
      await flushPromises();
    });

    expect(ctx?.workshops.find((workshop) => workshop.id === workshopId)?.registered).not.toContain(attendee);
  });
});
