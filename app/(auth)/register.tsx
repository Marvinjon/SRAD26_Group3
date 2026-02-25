import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  View,
  useWindowDimensions,
} from 'react-native';
import { Link } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth, type UserRole } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';

const DESKTOP_BREAKPOINT = 768;

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'employee', label: 'University Staff' },
  { value: 'therapist', label: 'Therapist' },
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();

  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');

  async function handleRegister() {
    setError('');

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, role);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.outerContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.cardWrapper, isDesktop && styles.cardWrapperDesktop]}>
            {isDesktop && (
              <View style={styles.sidePanel}>
                <View style={styles.sidePanelContent}>
                  <ThemedText style={styles.sideLogo}>Mind Track</ThemedText>
                  <ThemedText style={styles.sideHeading}>
                    Join the community
                  </ThemedText>
                  <ThemedText style={styles.sideDescription}>
                    Create your account to start tracking your wellbeing, reflecting on habits, and connecting with university support.
                  </ThemedText>
                  <View style={styles.sideFeatures}>
                    <ThemedText style={styles.sideFeature}>
                      ~ Private & secure by default
                    </ThemedText>
                    <ThemedText style={styles.sideFeature}>
                      ~ Personalized counsellor matching
                    </ThemedText>
                    <ThemedText style={styles.sideFeature}>
                      ~ Weekly wellbeing insights
                    </ThemedText>
                    <ThemedText style={styles.sideFeature}>
                      ~ For students, staff & therapists
                    </ThemedText>
                  </View>
                </View>
              </View>
            )}

            <View
              style={[
                styles.formCard,
                isDesktop && styles.formCardDesktop,
                {
                  backgroundColor: bgColor,
                  ...(isDesktop ? { borderColor: textColor + '10' } : {}),
                },
              ]}
            >
              {!isDesktop && (
                <View style={styles.header}>
                  <ThemedText style={styles.logo}>Mind Track</ThemedText>
                  <ThemedText style={styles.tagline}>
                    Create your account
                  </ThemedText>
                </View>
              )}

              <View style={styles.form}>
                <ThemedText style={styles.title}>Register</ThemedText>
                <ThemedText style={[styles.subtitle, { color: textColor + '80' }]}>
                  Use your university email to get started
                </ThemedText>

                {error ? (
                  <View style={styles.errorContainer}>
                    <ThemedText style={styles.errorText}>{error}</ThemedText>
                  </View>
                ) : null}

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>Full Name</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: textColor,
                        borderColor: textColor + '20',
                        backgroundColor: textColor + '06',
                      },
                    ]}
                    placeholder="Your full name"
                    placeholderTextColor={textColor + '40'}
                    value={name}
                    onChangeText={setName}
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>University Email</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: textColor,
                        borderColor: textColor + '20',
                        backgroundColor: textColor + '06',
                      },
                    ]}
                    placeholder="you@ru.is"
                    placeholderTextColor={textColor + '40'}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>I am a...</ThemedText>
                  <View style={styles.roleContainer}>
                    {ROLES.map((r) => (
                      <TouchableOpacity
                        key={r.value}
                        style={[
                          styles.roleButton,
                          { borderColor: textColor + '20', backgroundColor: textColor + '06' },
                          role === r.value && styles.roleButtonActive,
                        ]}
                        onPress={() => setRole(r.value)}
                        activeOpacity={0.7}
                      >
                        <ThemedText
                          style={[
                            styles.roleText,
                            role === r.value && styles.roleTextActive,
                          ]}
                        >
                          {r.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={isDesktop ? styles.passwordRow : undefined}>
                  <View style={[styles.inputGroup, isDesktop && styles.passwordField]}>
                    <ThemedText style={styles.label}>Password</ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: textColor,
                          borderColor: textColor + '20',
                          backgroundColor: textColor + '06',
                        },
                      ]}
                      placeholder="At least 6 characters"
                      placeholderTextColor={textColor + '40'}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>

                  <View style={[styles.inputGroup, isDesktop && styles.passwordField]}>
                    <ThemedText style={styles.label}>Confirm Password</ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: textColor,
                          borderColor: textColor + '20',
                          backgroundColor: textColor + '06',
                        },
                      ]}
                      placeholder="Re-enter your password"
                      placeholderTextColor={textColor + '40'}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ThemedText style={styles.buttonText}>Create Account</ThemedText>
                  )}
                </TouchableOpacity>

                <View style={styles.footer}>
                  <ThemedText style={styles.footerText}>
                    Already have an account?{' '}
                  </ThemedText>
                  <Link href="/(auth)/login">
                    <ThemedText style={styles.linkText}>Log In</ThemedText>
                  </Link>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  outerContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 440,
  },
  cardWrapperDesktop: {
    flexDirection: 'row',
    maxWidth: 960,
    minHeight: 580,
    borderRadius: 20,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }
      : {}),
  },

  // --- Side panel (desktop only) ---
  sidePanel: {
    width: 360,
    backgroundColor: '#5B8DEF',
    justifyContent: 'center',
    padding: 40,
  },
  sidePanelContent: {
    gap: 16,
  },
  sideLogo: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  sideHeading: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffffdd',
    marginTop: 4,
  },
  sideDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#ffffffbb',
    marginTop: 4,
  },
  sideFeatures: {
    marginTop: 16,
    gap: 10,
  },
  sideFeature: {
    fontSize: 14,
    color: '#ffffffcc',
  },

  // --- Form card ---
  formCard: {
    width: '100%',
    padding: 24,
  },
  formCardDesktop: {
    flex: 1,
    padding: 44,
    justifyContent: 'center',
    borderLeftWidth: 0,
  },

  // --- Mobile header ---
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: '#5B8DEF',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 6,
  },

  // --- Form ---
  form: {
    gap: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    marginTop: -6,
    marginBottom: 2,
  },
  errorContainer: {
    backgroundColor: '#FF4D4F15',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FF4D4F30',
  },
  errorText: {
    color: '#FF4D4F',
    fontSize: 14,
    textAlign: 'center',
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#5B8DEF',
    borderColor: '#5B8DEF',
  },
  roleText: {
    fontSize: 13,
    fontWeight: '500',
  },
  roleTextActive: {
    color: '#fff',
  },
  passwordRow: {
    flexDirection: 'row',
    gap: 12,
  },
  passwordField: {
    flex: 1,
  },
  button: {
    backgroundColor: '#5B8DEF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  footerText: {
    fontSize: 14,
    opacity: 0.7,
  },
  linkText: {
    fontSize: 14,
    color: '#5B8DEF',
    fontWeight: '600',
  },
});
