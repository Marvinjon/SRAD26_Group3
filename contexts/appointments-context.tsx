import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppointmentType = 'Individual' | 'Workshop';
export type AppointmentStatus = 'Booked' | 'Completed' | 'Canceled';

export interface TherapistAppointment {
  id: string;
  studentName: string;
  date: string;
  time: string;
  type: AppointmentType;
  status: AppointmentStatus;
}

interface AppointmentsContextType {
  appointments: TherapistAppointment[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  setAppointments: (next: TherapistAppointment[]) => Promise<void>;
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined);

const APPOINTMENTS_KEY = 'mindtrack_appointments';

const DEFAULT_APPOINTMENTS: TherapistAppointment[] = [
  {
    id: 'apt-1',
    studentName: 'Anna Jonsdottir',
    date: 'Feb 27',
    time: '09:00',
    type: 'Individual',
    status: 'Booked',
  },
  {
    id: 'apt-2',
    studentName: 'Gudmundur Einarsson',
    date: 'Feb 27',
    time: '10:30',
    type: 'Individual',
    status: 'Booked',
  },
  {
    id: 'apt-3',
    studentName: 'Stress Management Group',
    date: 'Feb 27',
    time: '13:00',
    type: 'Workshop',
    status: 'Booked',
  },
  {
    id: 'apt-4',
    studentName: 'Katrin Olafsdottir',
    date: 'Feb 27',
    time: '15:00',
    type: 'Individual',
    status: 'Booked',
  },
];

export function AppointmentsProvider({ children }: { children: React.ReactNode }) {
  const [appointments, setAppointmentsState] = useState<TherapistAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setIsLoading(true);
    try {
      const stored = await AsyncStorage.getItem(APPOINTMENTS_KEY);
      if (stored) {
        setAppointmentsState(JSON.parse(stored));
      } else {
        await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(DEFAULT_APPOINTMENTS));
        setAppointmentsState(DEFAULT_APPOINTMENTS);
      }
    } catch {
      setAppointmentsState(DEFAULT_APPOINTMENTS);
    } finally {
      setIsLoading(false);
    }
  }

  async function setAppointments(next: TherapistAppointment[]) {
    await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(next));
    setAppointmentsState(next);
  }

  return (
    <AppointmentsContext.Provider
      value={{ appointments, isLoading, refresh, setAppointments }}
    >
      {children}
    </AppointmentsContext.Provider>
  );
}

export function useAppointments() {
  const context = useContext(AppointmentsContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentsProvider');
  }
  return context;
}
