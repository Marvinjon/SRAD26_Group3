import React, { createContext, useContext } from 'react';

export type Workshop = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  location: string;
};

interface WorkshopsContextType {
  workshops: Workshop[];
}

const WORKSHOPS: Workshop[] = [
  {
    id: 'ws-2026-03-05-1000',
    title: 'Exam Anxiety Coping',
    date: '2026-03-05',
    startTime: '10:00',
    location: 'RU Wellbeing Center, Room 214',
  },
  {
    id: 'ws-2026-03-12-1400',
    title: 'Mindful Study Habits',
    date: '2026-03-12',
    startTime: '14:00',
    location: 'RU Wellbeing Center, Room 112',
  },
  {
    id: 'ws-2026-03-19-1200',
    title: 'Sleep Reset Workshop',
    date: '2026-03-19',
    startTime: '12:00',
    location: 'Online',
  },
];

const WorkshopsContext = createContext<WorkshopsContextType | undefined>(undefined);

export function WorkshopsProvider({ children }: { children: React.ReactNode }) {
  return (
    <WorkshopsContext.Provider value={{ workshops: WORKSHOPS }}>
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
