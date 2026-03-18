import React, { createContext, useContext } from 'react';

export type AppointmentSlot = {
  id: string;
  therapistId: string;
  date: string;
  startTime: string;
  endTime: string;
  mode: string;
  location: string;
};

interface AvailableAppointmentsContextType {
  slots: AppointmentSlot[];
}

const AVAILABLE_APPOINTMENTS: AppointmentSlot[] = [
  {
    id: 'apt-t1-2026-03-02-0900',
    therapistId: 't1',
    date: '2026-03-31',
    startTime: '09:00',
    endTime: '09:45',
    mode: 'In person',
    location: 'RU Wellbeing Center, Room 214',
  },
  {
    id: 'apt-t1-2026-03-05-1330',
    therapistId: 't1',
    date: '2026-04-01',
    startTime: '13:30',
    endTime: '14:15',
    mode: 'Online',
    location: 'Secure video session',
  },
  {
    id: 'apt-t2-2026-03-03-1030',
    therapistId: 't2',
    date: '2026-04-10',
    startTime: '10:30',
    endTime: '11:15',
    mode: 'In person',
    location: 'RU Wellbeing Center, Room 112',
  },
  {
    id: 'apt-t2-2026-03-06-1500',
    therapistId: 't2',
    date: '2026-05-06',
    startTime: '15:00',
    endTime: '15:45',
    mode: 'Online',
    location: 'Secure video session',
  },
  {
    id: 'apt-t3-2026-03-04-0900',
    therapistId: 't3',
    date: '2026-05-04',
    startTime: '09:00',
    endTime: '09:45',
    mode: 'In person',
    location: 'RU Wellbeing Center, Room 301',
  },
  {
    id: 'apt-t3-2026-03-07-1130',
    therapistId: 't3',
    date: '2026-12-07',
    startTime: '11:30',
    endTime: '12:15',
    mode: 'Online',
    location: 'Secure video session',
  },
];

const AvailableAppointmentsContext = createContext<AvailableAppointmentsContextType | undefined>(undefined);

export function AvailableAppointmentsProvider({ children }: { children: React.ReactNode }) {
  return (
    <AvailableAppointmentsContext.Provider value={{ slots: AVAILABLE_APPOINTMENTS }}>
      {children}
    </AvailableAppointmentsContext.Provider>
  );
}

export function useAvailableAppointments() {
  const context = useContext(AvailableAppointmentsContext);
  if (!context) {
    throw new Error('useAvailableAppointments must be used within an AvailableAppointmentsProvider');
  }
  return context;
}
