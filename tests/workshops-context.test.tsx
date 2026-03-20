import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkshopsProvider, useWorkshops, type Workshop } from '@/contexts/workshops-context';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <WorkshopsProvider>{children}</WorkshopsProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage as any).__resetStore();
});

describe('WorkshopsContext – initial load', () => {
  it('loads default workshops when storage is empty', async () => {
    const { result } = renderHook(() => useWorkshops(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.workshops.length).toBeGreaterThanOrEqual(2);
    expect(result.current.workshops[0].title).toBe('Exam Anxiety Coping');
    expect(result.current.workshops[1].title).toBe('Mindful Study Habits');
  });

  it('loads workshops from storage when present', async () => {
    const stored: Workshop[] = [
      {
        id: 'custom-1',
        title: 'Custom Workshop',
        date: 'Apr 1',
        time: '14:00',
        hostEmail: 'host@ru.is',
        maxParticipants: 5,
        registered: [],
      },
    ];
    await AsyncStorage.setItem('mindtrack_workshops', JSON.stringify(stored));

    const { result } = renderHook(() => useWorkshops(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.workshops).toHaveLength(1);
    expect(result.current.workshops[0].title).toBe('Custom Workshop');
  });
});

describe('WorkshopsContext – createWorkshop', () => {
  it('creates a workshop with generated id and empty registered list', async () => {
    const { result } = renderHook(() => useWorkshops(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const initialCount = result.current.workshops.length;

    await act(async () => {
      await result.current.createWorkshop({
        title: 'New Workshop',
        description: 'A test workshop',
        date: 'Apr 10',
        time: '09:00',
        hostEmail: 'creator@ru.is',
        maxParticipants: 8,
      });
    });

    expect(result.current.workshops.length).toBe(initialCount + 1);

    const created = result.current.workshops.find((w) => w.title === 'New Workshop');
    expect(created).toBeDefined();
    expect(created!.id).toMatch(/^wks-/);
    expect(created!.registered).toEqual([]);
    expect(created!.maxParticipants).toBe(8);
    expect(created!.hostEmail).toBe('creator@ru.is');
  });

  it('adds new workshop at the beginning of the list', async () => {
    const { result } = renderHook(() => useWorkshops(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    await act(async () => {
      await result.current.createWorkshop({
        title: 'First Workshop',
        date: 'May 1',
        time: '10:00',
        hostEmail: 'host@ru.is',
        maxParticipants: 10,
      });
    });

    expect(result.current.workshops[0].title).toBe('First Workshop');
  });

  it('persists newly created workshop to AsyncStorage', async () => {
    const { result } = renderHook(() => useWorkshops(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    (AsyncStorage.setItem as jest.Mock).mockClear();

    await act(async () => {
      await result.current.createWorkshop({
        title: 'Persisted Workshop',
        date: 'Jun 1',
        time: '11:00',
        hostEmail: 'host@ru.is',
        maxParticipants: 15,
      });
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'mindtrack_workshops',
      expect.stringContaining('Persisted Workshop'),
    );
  });
});

describe('WorkshopsContext – toggleRegistration', () => {
  it('registers a user for a workshop', async () => {
    const { result } = renderHook(() => useWorkshops(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const workshopId = result.current.workshops[1].id; // Mindful Study Habits (empty)

    await act(async () => {
      await result.current.toggleRegistration(workshopId, 'newuser@ru.is');
    });

    const updated = result.current.workshops.find((w) => w.id === workshopId);
    expect(updated!.registered).toContain('newuser@ru.is');
  });

  it('unregisters a user who is already registered', async () => {
    const { result } = renderHook(() => useWorkshops(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const workshopId = result.current.workshops[0].id; // Exam Anxiety (has student@ru.is)

    expect(
      result.current.workshops.find((w) => w.id === workshopId)!.registered,
    ).toContain('student@ru.is');

    await act(async () => {
      await result.current.toggleRegistration(workshopId, 'student@ru.is');
    });

    const updated = result.current.workshops.find((w) => w.id === workshopId);
    expect(updated!.registered).not.toContain('student@ru.is');
  });

  it('does not register when workshop is at capacity', async () => {
    const fullWorkshop: Workshop[] = [
      {
        id: 'full-wks',
        title: 'Full Workshop',
        date: 'Apr 1',
        time: '10:00',
        hostEmail: 'host@ru.is',
        maxParticipants: 2,
        registered: ['user1@ru.is', 'user2@ru.is'],
      },
    ];
    await AsyncStorage.setItem('mindtrack_workshops', JSON.stringify(fullWorkshop));

    const { result } = renderHook(() => useWorkshops(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    await act(async () => {
      await result.current.toggleRegistration('full-wks', 'user3@ru.is');
    });

    const workshop = result.current.workshops.find((w) => w.id === 'full-wks');
    expect(workshop!.registered).toHaveLength(2);
    expect(workshop!.registered).not.toContain('user3@ru.is');
  });

  it('allows unregister even when workshop is at capacity', async () => {
    const fullWorkshop: Workshop[] = [
      {
        id: 'full-unreg',
        title: 'Full Then Leave',
        date: 'Apr 1',
        time: '10:00',
        hostEmail: 'host@ru.is',
        maxParticipants: 2,
        registered: ['user1@ru.is', 'user2@ru.is'],
      },
    ];
    await AsyncStorage.setItem('mindtrack_workshops', JSON.stringify(fullWorkshop));

    const { result } = renderHook(() => useWorkshops(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    await act(async () => {
      await result.current.toggleRegistration('full-unreg', 'user1@ru.is');
    });

    const workshop = result.current.workshops.find((w) => w.id === 'full-unreg');
    expect(workshop!.registered).toHaveLength(1);
    expect(workshop!.registered).not.toContain('user1@ru.is');
  });

  it('does nothing for a non-existent workshop id', async () => {
    const { result } = renderHook(() => useWorkshops(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const before = result.current.workshops.map((w) => ({ ...w }));

    await act(async () => {
      await result.current.toggleRegistration('non-existent-id', 'user@ru.is');
    });

    expect(result.current.workshops.map((w) => w.registered)).toEqual(
      before.map((w) => w.registered),
    );
  });

  it('does not allow double registration', async () => {
    const workshop: Workshop[] = [
      {
        id: 'double-reg',
        title: 'Double Check',
        date: 'Apr 1',
        time: '10:00',
        hostEmail: 'host@ru.is',
        maxParticipants: 10,
        registered: ['already@ru.is'],
      },
    ];
    await AsyncStorage.setItem('mindtrack_workshops', JSON.stringify(workshop));

    const { result } = renderHook(() => useWorkshops(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Toggle should REMOVE because user is already registered
    await act(async () => {
      await result.current.toggleRegistration('double-reg', 'already@ru.is');
    });

    const updated = result.current.workshops.find((w) => w.id === 'double-reg');
    expect(updated!.registered).not.toContain('already@ru.is');
  });
});

describe('WorkshopsContext – removeWorkshop', () => {
  it('removes a workshop by id', async () => {
    const { result } = renderHook(() => useWorkshops(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const initialCount = result.current.workshops.length;
    const idToRemove = result.current.workshops[0].id;

    await act(async () => {
      await result.current.removeWorkshop(idToRemove);
    });

    expect(result.current.workshops.length).toBe(initialCount - 1);
    expect(result.current.workshops.find((w) => w.id === idToRemove)).toBeUndefined();
  });

  it('does not crash when removing non-existent workshop', async () => {
    const { result } = renderHook(() => useWorkshops(), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const initialCount = result.current.workshops.length;

    await act(async () => {
      await result.current.removeWorkshop('does-not-exist');
    });

    expect(result.current.workshops.length).toBe(initialCount);
  });
});

describe('WorkshopsContext – useWorkshops outside provider', () => {
  it('throws when used outside WorkshopsProvider', () => {
    expect(() => {
      renderHook(() => useWorkshops());
    }).toThrow('useWorkshops must be used within a WorkshopsProvider');
  });
});
