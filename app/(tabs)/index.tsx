import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.logo}>Mind Track</ThemedText>
        <ThemedText style={styles.greeting}>
          Welcome, {user?.name}
        </ThemedText>
        <ThemedText style={styles.role}>
          Logged in as: {user?.role}
        </ThemedText>
        <ThemedText style={styles.email}>{user?.email}</ThemedText>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
        <ThemedText style={styles.logoutText}>Log Out</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: '#5B8DEF',
    letterSpacing: 1,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
  },
  role: {
    fontSize: 16,
    opacity: 0.7,
    textTransform: 'capitalize',
  },
  email: {
    fontSize: 14,
    opacity: 0.5,
  },
  logoutButton: {
    backgroundColor: '#FF4D4F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 40,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
