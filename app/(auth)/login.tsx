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
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';

const DESKTOP_BREAKPOINT = 768;

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();

  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
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
                    Your wellbeing companion
                  </ThemedText>
                  <ThemedText style={styles.sideDescription}>
                    Track your mood, reflect on habits, and access university support resources — all in one private space.
                  </ThemedText>
                  <View style={styles.sideFeatures}>
                    <ThemedText style={styles.sideFeature}>
                      ~ Daily mood check-ins
                    </ThemedText>
                    <ThemedText style={styles.sideFeature}>
                      ~ Habit tracking & reflection
                    </ThemedText>
                    <ThemedText style={styles.sideFeature}>
                      ~ University support directory
                    </ThemedText>
                    <ThemedText style={styles.sideFeature}>
                      ~ Book counsellor appointments
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
                  ...(isDesktop
                    ? { borderColor: textColor + '10' }
                    : {}),
                },
              ]}
            >
              {!isDesktop && (
                <View style={styles.header}>
                  <ThemedText style={styles.logo}>Mind Track</ThemedText>
                  <ThemedText style={styles.tagline}>
                    Your wellbeing companion at RU
                  </ThemedText>
                </View>
              )}

              <View style={styles.form}>
                <ThemedText style={styles.title}>Welcome back</ThemedText>
                <ThemedText style={[styles.subtitle, { color: textColor + '80' }]}>
                  Sign in to your account
                </ThemedText>

                {error ? (
                  <View style={styles.errorContainer}>
                    <ThemedText style={styles.errorText}>{error}</ThemedText>
                  </View>
                ) : null}

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>Email</ThemedText>
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
                    placeholder="Enter your password"
                    placeholderTextColor={textColor + '40'}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ThemedText style={styles.buttonText}>Log In</ThemedText>
                  )}
                </TouchableOpacity>

                <View style={styles.footer}>
                  <ThemedText style={styles.footerText}>
                    Don't have an account?{' '}
                  </ThemedText>
                  <Link href="/(auth)/register">
                    <ThemedText style={styles.linkText}>Register</ThemedText>
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
    maxWidth: 900,
    minHeight: 520,
    borderRadius: 20,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }
      : {}),
  },

  // --- Side panel (desktop only) ---
  sidePanel: {
    width: 380,
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
    padding: 48,
    justifyContent: 'center',
    borderLeftWidth: 0,
  },

  // --- Mobile header ---
  header: {
    alignItems: 'center',
    marginBottom: 36,
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
    gap: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    marginTop: -8,
    marginBottom: 4,
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
  button: {
    backgroundColor: '#5B8DEF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
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
