import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  useWindowDimensions,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DashboardCard } from '@/components/dashboard-card';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';

function ProfileField({ label, value }: { label: string; value: string }) {
  const textColor = useThemeColor({}, 'text');
  return (
    <View style={pfStyles.field}>
      <ThemedText style={pfStyles.label}>{label}</ThemedText>
      <ThemedText style={[pfStyles.value, { borderColor: textColor + '10' }]}>{value}</ThemedText>
    </View>
  );
}

const ROLE_LABELS: Record<string, string> = {
  student: 'Student',
  employee: 'University Staff',
  therapist: 'Therapist',
};

type TherapistProfile = {
  displayName: string;
  title: string;
  specialties: string[];
  languages: string[];
  location: string;
  bio: string;
  contact: string;
  updatedAt: number;
};

const THERAPIST_PROFILES_KEY = 'mindtrack_therapist_profiles';

function emptyTherapistProfile(displayName: string): TherapistProfile {
  return {
    displayName,
    title: '',
    specialties: [],
    languages: [],
    location: '',
    bio: '',
    contact: '',
    updatedAt: Date.now(),
  };
}

async function loadTherapistProfiles(): Promise<Record<string, TherapistProfile>> {
  const raw = await AsyncStorage.getItem(THERAPIST_PROFILES_KEY);
  return raw ? JSON.parse(raw) : {};
}

async function saveTherapistProfile(email: string, profile: TherapistProfile): Promise<void> {
  const all = await loadTherapistProfiles();
  all[email] = profile;
  await AsyncStorage.setItem(THERAPIST_PROFILES_KEY, JSON.stringify(all));
}

function parseCsvList(input: string): string[] {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatList(list: string[]): string {
  return list.join(', ');
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');

  const isTherapist = user?.role === 'therapist';

  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  const [therapistProfile, setTherapistProfile] = useState<TherapistProfile | null>(null);

  // Editable fields (therapist only)
  const [title, setTitle] = useState('');
  const [specialtiesText, setSpecialtiesText] = useState('');
  const [languagesText, setLanguagesText] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
  const [bio, setBio] = useState('');

  const [directory, setDirectory] = useState<{ email: string; profile: TherapistProfile }[]>([]);

  const initials = (user?.name ?? '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      setProfileSaved(false);
      setProfileError('');
      setLoadingProfiles(true);
      try {
        const all = await loadTherapistProfiles();
        if (!isMounted) return;

        // Directory for students/staff (and therapists too, for preview)
        const list = Object.entries(all)
          .map(([email, profile]) => ({ email, profile }))
          .sort((a, b) => (b.profile.updatedAt ?? 0) - (a.profile.updatedAt ?? 0));
        setDirectory(list);

        if (isTherapist && user?.email) {
          const existing = all[user.email];
          const base = existing ?? emptyTherapistProfile(user.name ?? '');
          setTherapistProfile(base);

          setTitle(base.title ?? '');
          setSpecialtiesText(formatList(base.specialties ?? []));
          setLanguagesText(formatList(base.languages ?? []));
          setLocation(base.location ?? '');
          setContact(base.contact ?? '');
          setBio(base.bio ?? '');
        }
      } catch (e: any) {
        if (!isMounted) return;
        setProfileError(e?.message ?? 'Failed to load therapist profiles');
      } finally {
        if (!isMounted) return;
        setLoadingProfiles(false);
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, [isTherapist, user?.email, user?.name]);

  const publicPreview: TherapistProfile | null = useMemo(() => {
    if (!isTherapist || !user?.email) return null;
    const base = therapistProfile ?? emptyTherapistProfile(user?.name ?? '');
    return {
      ...base,
      displayName: user?.name ?? base.displayName,
      title,
      specialties: parseCsvList(specialtiesText),
      languages: parseCsvList(languagesText),
      location,
      contact,
      bio,
      updatedAt: base.updatedAt ?? Date.now(),
    };
  }, [
    isTherapist,
    therapistProfile,
    user?.email,
    user?.name,
    title,
    specialtiesText,
    languagesText,
    location,
    contact,
    bio,
  ]);

  async function handleSaveTherapistProfile() {
    if (!user?.email || !user?.name) return;

    setProfileSaved(false);
    setProfileError('');
    setSavingProfile(true);
    try {
      const next: TherapistProfile = {
        displayName: user.name,
        title: title.trim(),
        specialties: parseCsvList(specialtiesText),
        languages: parseCsvList(languagesText),
        location: location.trim(),
        contact: contact.trim(),
        bio: bio.trim(),
        updatedAt: Date.now(),
      };

      if (!next.title || !next.bio) {
        throw new Error('Please fill in at least Title and Bio');
      }

      await saveTherapistProfile(user.email, next);
      setTherapistProfile(next);
      setProfileSaved(true);

      // Refresh directory so students see updates immediately (locally)
      const all = await loadTherapistProfiles();
      const list = Object.entries(all)
        .map(([email, profile]) => ({ email, profile }))
        .sort((a, b) => (b.profile.updatedAt ?? 0) - (a.profile.updatedAt ?? 0));
      setDirectory(list);
    } catch (e: any) {
      setProfileError(e?.message ?? 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.scrollContentDesktop,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
            <View style={styles.avatarSection}>
              <View style={styles.avatar}>
                <ThemedText style={styles.avatarText}>{initials}</ThemedText>
              </View>
              <ThemedText style={styles.name}>{user?.name}</ThemedText>
              <View style={styles.roleBadge}>
                <ThemedText style={styles.roleBadgeText}>
                  {ROLE_LABELS[user?.role ?? 'student']}
                </ThemedText>
              </View>
            </View>

            <DashboardCard title="Account Information">
              <ProfileField label="Full Name" value={user?.name ?? ''} />
              <ProfileField label="Email" value={user?.email ?? ''} />
              <ProfileField label="Role" value={ROLE_LABELS[user?.role ?? 'student']} />
            </DashboardCard>

            {isTherapist ? (
              <DashboardCard title="Therapist Public Profile" accent="#8B5CF6">
                <ThemedText style={styles.helperText}>
                  This information is visible to students before they book an appointment.
                </ThemedText>

                {profileError ? (
                  <View style={styles.errorBox}>
                    <ThemedText style={styles.errorText}>{profileError}</ThemedText>
                  </View>
                ) : null}

                {profileSaved ? (
                  <View style={styles.successBox}>
                    <ThemedText style={styles.successText}>Profile saved</ThemedText>
                  </View>
                ) : null}

                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Title</ThemedText>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Counsellor, Clinical Psychologist"
                    placeholderTextColor={textColor + '40'}
                    style={[
                      styles.input,
                      { color: textColor, borderColor: textColor + '20', backgroundColor: textColor + '06' },
                    ]}
                  />
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Specialties</ThemedText>
                  <TextInput
                    value={specialtiesText}
                    onChangeText={setSpecialtiesText}
                    placeholder="e.g. exam stress, anxiety, sleep"
                    placeholderTextColor={textColor + '40'}
                    style={[
                      styles.input,
                      { color: textColor, borderColor: textColor + '20', backgroundColor: textColor + '06' },
                    ]}
                  />
                  <ThemedText style={styles.fieldHint}>Comma-separated</ThemedText>
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Languages</ThemedText>
                  <TextInput
                    value={languagesText}
                    onChangeText={setLanguagesText}
                    placeholder="e.g. Icelandic, English"
                    placeholderTextColor={textColor + '40'}
                    style={[
                      styles.input,
                      { color: textColor, borderColor: textColor + '20', backgroundColor: textColor + '06' },
                    ]}
                  />
                  <ThemedText style={styles.fieldHint}>Comma-separated</ThemedText>
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Location</ThemedText>
                  <TextInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder="e.g. RU – Menntavegur 1"
                    placeholderTextColor={textColor + '40'}
                    style={[
                      styles.input,
                      { color: textColor, borderColor: textColor + '20', backgroundColor: textColor + '06' },
                    ]}
                  />
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Contact (optional)</ThemedText>
                  <TextInput
                    value={contact}
                    onChangeText={setContact}
                    placeholder="e.g. reception phone or email alias"
                    placeholderTextColor={textColor + '40'}
                    style={[
                      styles.input,
                      { color: textColor, borderColor: textColor + '20', backgroundColor: textColor + '06' },
                    ]}
                  />
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Bio</ThemedText>
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    placeholder="A short introduction students will see..."
                    placeholderTextColor={textColor + '40'}
                    multiline
                    style={[
                      styles.textarea,
                      { color: textColor, borderColor: textColor + '20', backgroundColor: textColor + '06' },
                    ]}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, savingProfile && styles.primaryButtonDisabled]}
                  onPress={handleSaveTherapistProfile}
                  activeOpacity={0.8}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ThemedText style={styles.primaryButtonText}>Save Profile</ThemedText>
                  )}
                </TouchableOpacity>

                <DashboardCard title="Public Preview" style={{ backgroundColor: bgColor }} accent="#5B8DEF">
                  <ThemedText style={styles.previewName}>{publicPreview?.displayName}</ThemedText>
                  <ThemedText style={styles.previewTitle}>{publicPreview?.title}</ThemedText>

                  {publicPreview?.specialties?.length ? (
                    <View style={styles.chipRow}>
                      {publicPreview.specialties.slice(0, 6).map((s) => (
                        <View key={s} style={[styles.chip, { backgroundColor: '#8B5CF618' }]}>
                          <ThemedText style={[styles.chipText, { color: '#8B5CF6' }]}>{s}</ThemedText>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {publicPreview?.bio ? <ThemedText style={styles.previewBio}>{publicPreview.bio}</ThemedText> : null}

                  <View style={styles.previewMetaRow}>
                    <ThemedText style={styles.previewMeta}>
                      Languages: {publicPreview?.languages?.length ? formatList(publicPreview.languages) : '—'}
                    </ThemedText>
                    <ThemedText style={styles.previewMeta}>
                      Location: {publicPreview?.location ? publicPreview.location : '—'}
                    </ThemedText>
                  </View>
                </DashboardCard>
              </DashboardCard>
            ) : (
              <DashboardCard title="Therapists" accent="#8B5CF6">
                <ThemedText style={styles.helperText}>
                  Browse therapist profiles before booking an appointment.
                </ThemedText>

                {loadingProfiles ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#5B8DEF" />
                    <ThemedText style={styles.loadingText}>Loading profiles…</ThemedText>
                  </View>
                ) : directory.length ? (
                  <View style={styles.directoryList}>
                    {directory.slice(0, 6).map(({ email, profile }) => (
                      <View key={email} style={[styles.directoryItem, { borderColor: textColor + '10' }]}>
                        <View style={styles.directoryHeader}>
                          <ThemedText style={styles.directoryName}>{profile.displayName}</ThemedText>
                          <View style={[styles.rolePill, { backgroundColor: '#8B5CF618' }]}>
                            <ThemedText style={[styles.rolePillText, { color: '#8B5CF6' }]}>Therapist</ThemedText>
                          </View>
                        </View>
                        <ThemedText style={styles.directoryTitle}>{profile.title}</ThemedText>
                        {profile.specialties?.length ? (
                          <ThemedText style={styles.directoryMeta}>
                            Specialties: {profile.specialties.slice(0, 4).join(', ')}
                          </ThemedText>
                        ) : null}
                        {profile.languages?.length ? (
                          <ThemedText style={styles.directoryMeta}>
                            Languages: {profile.languages.join(', ')}
                          </ThemedText>
                        ) : null}
                        {profile.bio ? (
                          <ThemedText style={styles.directoryBio} numberOfLines={3}>
                            {profile.bio}
                          </ThemedText>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : (
                  <ThemedText style={styles.emptyText}>
                    No therapist profiles yet. Log in as a therapist and create one.
                  </ThemedText>
                )}
              </DashboardCard>
            )}

            <DashboardCard title="Preferences">
              <View style={styles.prefRow}>
                <ThemedText style={styles.prefLabel}>Notifications</ThemedText>
                <ThemedText style={[styles.prefValue, { color: '#10B981' }]}>Enabled</ThemedText>
              </View>
              <View style={[styles.separator, { backgroundColor: textColor + '10' }]} />
              <View style={styles.prefRow}>
                <ThemedText style={styles.prefLabel}>Theme</ThemedText>
                <ThemedText style={styles.prefValue}>System</ThemedText>
              </View>
              <View style={[styles.separator, { backgroundColor: textColor + '10' }]} />
              <View style={styles.prefRow}>
                <ThemedText style={styles.prefLabel}>Data Privacy</ThemedText>
                <ThemedText style={[styles.prefValue, { color: '#5B8DEF' }]}>Private</ThemedText>
              </View>
            </DashboardCard>

            <DashboardCard title="About Mind Track">
              <ThemedText style={styles.aboutText}>
                Mind Track helps Reykjavík University students and staff monitor wellbeing, reflect on habits, and access support resources in one private place.
              </ThemedText>
              <ThemedText style={styles.versionText}>Version 1.0.0</ThemedText>
            </DashboardCard>

            <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
              <ThemedText style={styles.logoutText}>Log Out</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const pfStyles = StyleSheet.create({
  field: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.45,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  scrollContentDesktop: {
    alignItems: 'center',
  },
  inner: {
    gap: 16,
    width: '100%',
  },
  innerDesktop: {
    maxWidth: 560,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#5B8DEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
  },
  roleBadge: {
    backgroundColor: '#5B8DEF18',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleBadgeText: {
    color: '#5B8DEF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Preferences
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  prefLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  prefValue: {
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.7,
  },
  separator: {
    height: 1,
  },

  // About
  aboutText: {
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.7,
  },
  versionText: {
    fontSize: 13,
    opacity: 0.4,
  },

  // Logout
  logoutButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },

  // Therapist profile editor
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.65,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.7,
  },
  fieldHint: {
    fontSize: 12,
    opacity: 0.45,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#5B8DEF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#EF444415',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EF444430',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: '#10B98115',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#10B98130',
  },
  successText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  previewName: {
    fontSize: 18,
    fontWeight: '800',
  },
  previewTitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: -6,
  },
  previewBio: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.75,
  },
  previewMetaRow: {
    gap: 6,
  },
  previewMeta: {
    fontSize: 13,
    opacity: 0.55,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Directory (students/staff)
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    opacity: 0.6,
  },
  directoryList: {
    gap: 12,
  },
  directoryItem: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  directoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  directoryName: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  directoryTitle: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: -4,
  },
  directoryMeta: {
    fontSize: 12,
    opacity: 0.55,
  },
  directoryBio: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.75,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    opacity: 0.6,
  },
});
