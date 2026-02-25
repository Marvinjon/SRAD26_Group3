
export type Therapist = {
  id: string;
  name: string;
  specialty: string;
};

export const THERAPISTS: Therapist[] = [
  { id: "t1", name: "Dr. Anna Jónsdóttir", specialty: "Anxiety" },
  { id: "t2", name: "Dr. Björn Sigurðsson", specialty: "Stress" },
  { id: "t3", name: "Dr. Elín Karlsdóttir", specialty: "Depression" },
];
