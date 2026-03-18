import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Workshop {
  id: string;
  title: string;
  description?: string;
  date: string; // e.g. "Mar 5"
  time: string; // e.g. "10:00"
  hostEmail: string;
  maxParticipants: number;
  registered: string[]; // list of user emails
}

interface WorkshopsContextType {
  workshops: Workshop[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  createWorkshop: (workshop: Omit<Workshop, 'id' | 'registered'>) => Promise<void>;
  toggleRegistration: (workshopId: string, userEmail: string) => Promise<void>;
  removeWorkshop: (workshopId: string) => Promise<void>;
}

const WorkshopsContext = createContext<WorkshopsContextType | undefined>(undefined);

const WORKSHOPS_KEY = 'mindtrack_workshops';

const DEFAULT_WORKSHOPS: Workshop[] = [
  {
    id: 'wks-1',
    title: 'Exam Anxiety Coping',
    description: 'Learn practical strategies to manage exam stress with peers.',
    date: 'Mar 5',
    time: '12:00',
    hostEmail: 'therapist@ru.is',
    maxParticipants: 12,
    registered: ['student@ru.is', 'employee@ru.is'],
  },
  {
    id: 'wks-2',
    title: 'Mindful Study Habits',
    description: 'Build a sustainable study routine using mindfulness techniques.',
    date: 'Mar 12',
    time: '10:00',
    hostEmail: 'therapist@ru.is',
    maxParticipants: 10,
    registered: [],
  },
];

export function WorkshopsProvider({ children }: { children: React.ReactNode }) {
  const [workshops, setWorkshopsState] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setIsLoading(true);
    try {
      const stored = await AsyncStorage.getItem(WORKSHOPS_KEY);
      if (stored) {
        setWorkshopsState(JSON.parse(stored));
      } else {
        await AsyncStorage.setItem(WORKSHOPS_KEY, JSON.stringify(DEFAULT_WORKSHOPS));
        setWorkshopsState(DEFAULT_WORKSHOPS);
      }
    } catch {
      setWorkshopsState(DEFAULT_WORKSHOPS);
    } finally {
      setIsLoading(false);
    }
  }

  async function persist(next: Workshop[]) {
    await AsyncStorage.setItem(WORKSHOPS_KEY, JSON.stringify(next));
    setWorkshopsState(next);
  }

  async function createWorkshop(workshop: Omit<Workshop, 'id' | 'registered'>) {
    const next: Workshop = {
      ...workshop,
      id: `wks-${Date.now()}`,
      registered: [],
    };

    await persist([next, ...workshops]);
  }

  async function toggleRegistration(workshopId: string, userEmail: string) {
    const next = workshops.map((workshop) => {
      if (workshop.id !== workshopId) return workshop;

      const alreadyRegistered = workshop.registered.includes(userEmail);
      const isFull = workshop.registered.length >= workshop.maxParticipants;

      if (alreadyRegistered) {
        return { ...workshop, registered: workshop.registered.filter((e) => e !== userEmail) };
      }

      if (isFull) {
        return workshop;
      }

      return { ...workshop, registered: [...workshop.registered, userEmail] };
    });

    await persist(next);
  }

  async function removeWorkshop(workshopId: string) {
    await persist(workshops.filter((w) => w.id !== workshopId));
  }

  return (
    <WorkshopsContext.Provider
      value={{ workshops, isLoading, refresh, createWorkshop, toggleRegistration, removeWorkshop }}
    >
      {children}
    </WorkshopsContext.Provider>
  );
}

export function useWorkshops() {
  const context = useContext(WorkshopsContext);
  if (!context) {
    throw new Error('useWorkshops must be used within a WorkshopsProvider');
  }
  return context;
}
