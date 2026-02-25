import React from 'react';
import { StyleSheet, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface DashboardCardProps {
  title?: string;
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  accent?: string;
}

export function DashboardCard({ title, children, onPress, style, accent }: DashboardCardProps) {
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');

  const cardStyle = [
    styles.card,
    {
      backgroundColor: bgColor,
      borderColor: textColor + '10',
    },
    accent ? { borderLeftWidth: 4, borderLeftColor: accent } : undefined,
    style,
  ];

  const content = (
    <>
      {title ? <ThemedText style={styles.title}>{title}</ThemedText> : null}
      {children}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{content}</View>;
}

interface QuickActionProps {
  icon: string;
  label: string;
  color: string;
  onPress?: () => void;
}

export function QuickAction({ icon, label, color, onPress }: QuickActionProps) {
  const textColor = useThemeColor({}, 'text');

  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '18' }]}>
        <ThemedText style={[styles.quickActionEmoji]}>{icon}</ThemedText>
      </View>
      <ThemedText style={[styles.quickActionLabel, { color: textColor + 'cc' }]} numberOfLines={2}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}

interface StatBadgeProps {
  value: string;
  label: string;
  color: string;
}

export function StatBadge({ value, label, color }: StatBadgeProps) {
  return (
    <View style={[styles.statBadge, { backgroundColor: color + '12' }]}>
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.55,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickAction: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  statBadge: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.6,
    fontWeight: '500',
  },
});
