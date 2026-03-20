import { THERAPISTS, type Therapist } from '@/constants/therapists_list';

describe('THERAPISTS constant', () => {
  it('contains exactly 3 therapists', () => {
    expect(THERAPISTS).toHaveLength(3);
  });

  it('each therapist has a non-empty id, name, and specialty', () => {
    THERAPISTS.forEach((therapist: Therapist) => {
      expect(therapist.id).toBeTruthy();
      expect(therapist.id.length).toBeGreaterThan(0);
      expect(therapist.name).toBeTruthy();
      expect(therapist.name.length).toBeGreaterThan(0);
      expect(therapist.specialty).toBeTruthy();
      expect(therapist.specialty.length).toBeGreaterThan(0);
    });
  });

  it('all therapist ids are unique', () => {
    const ids = THERAPISTS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all therapist names are unique', () => {
    const names = THERAPISTS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('contains expected specialties', () => {
    const specialties = THERAPISTS.map((t) => t.specialty);
    expect(specialties).toContain('Anxiety');
    expect(specialties).toContain('Stress');
    expect(specialties).toContain('Depression');
  });

  it('therapist ids follow the expected pattern (t + number)', () => {
    THERAPISTS.forEach((therapist) => {
      expect(therapist.id).toMatch(/^t\d+$/);
    });
  });

  it('therapist names start with Dr.', () => {
    THERAPISTS.forEach((therapist) => {
      expect(therapist.name).toMatch(/^Dr\./);
    });
  });
});

describe('THERAPISTS – lookup operations', () => {
  it('can find a therapist by id', () => {
    const found = THERAPISTS.find((t) => t.id === 't1');
    expect(found).toBeDefined();
    expect(found!.name).toBe('Dr. Anna Jónsdóttir');
  });

  it('returns undefined for non-existent therapist id', () => {
    const found = THERAPISTS.find((t) => t.id === 't999');
    expect(found).toBeUndefined();
  });

  it('can filter therapists by specialty', () => {
    const anxietyTherapists = THERAPISTS.filter((t) => t.specialty === 'Anxiety');
    expect(anxietyTherapists).toHaveLength(1);
    expect(anxietyTherapists[0].id).toBe('t1');
  });
});
