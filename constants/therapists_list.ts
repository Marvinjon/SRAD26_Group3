
export type Therapist = {
  id: string;
  name: string;
  specialty: string;
};

export const THERAPISTS: Therapist[] = [
  { id: 't1', name: 'Dr. Anna Jónsdóttir', specialty: 'Anxiety' },
  { id: 't2', name: 'Dr. Björn Sigurðsson', specialty: 'Stress' },
  { id: 't3', name: 'Dr. Elín Karlsdóttir', specialty: 'Depression' },
];

export type PaidTherapist = {
  name: string;
  specialty: string;
  price: string;
};

export const PAID_THERAPISTS: PaidTherapist[] = [
  { name: 'Dr. Katrín Olsen', specialty: 'Burnout and stress', price: 'ISK 17,500/session' },
  { name: 'Dr. Aron Þórsson', specialty: 'Anxiety and panic support', price: 'ISK 18,000/session' },
  { name: 'Dr. Sara Guðmundsdóttir', specialty: 'Depression and grief', price: 'ISK 19,000/session' },
];
