import React from 'react';
import renderer, { act, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ResourcesScreen from '@/app/(tabs)/resources';
import { RESOURCES } from '@/constants/resources_list';

const mockUseAuth = jest.fn();

jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@/hooks/use-theme-color', () => ({
  useThemeColor: () => '#1f2937',
}));

jest.mock('@/components/external-link', () => ({
  ExternalLink: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => <View {...props}>{children}</View>,
  };
});

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const defaultUser = {
  name: 'Test Student',
  email: 'student@ru.is',
  role: 'student' as const,
};

function textContent(children: ReactTestInstance['props']['children']): string {
  if (Array.isArray(children)) return children.map(textContent).join('');
  if (children == null) return '';
  return String(children);
}

function hasText(root: ReactTestInstance, expected: string): boolean {
  return (
    root.findAll(
      (node) => node.type === 'Text' && textContent(node.props.children) === expected,
    ).length > 0
  );
}

function getRenderedResourceTitles(root: ReactTestInstance): string[] {
  const knownTitles = new Set(RESOURCES.map((resource) => resource.title));

  return root
    .findAll((node) => node.type === 'Text' && knownTitles.has(textContent(node.props.children)))
    .map((node) => textContent(node.props.children));
}

async function renderScreen() {
  let tree: ReactTestRenderer;

  await act(async () => {
    tree = renderer.create(<ResourcesScreen />);
    await flushPromises();
  });

  return tree!;
}

async function press(root: ReactTestInstance, testID: string) {
  await act(async () => {
    root.findByProps({ testID }).props.onPress();
    await flushPromises();
  });
}

async function changeSearch(root: ReactTestInstance, value: string) {
  await act(async () => {
    root.findByProps({ testID: 'resources-search-input' }).props.onChangeText(value);
    await flushPromises();
  });
}

describe('ResourcesScreen', () => {
  beforeEach(async () => {
    mockUseAuth.mockReturnValue({ user: defaultUser });
    await AsyncStorage.clear();
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: defaultUser });
  });

  it('searches resources by keyword', async () => {
    const tree = await renderScreen();

    await changeSearch(tree.root, 'study planning');

    expect(getRenderedResourceTitles(tree.root).slice(0, 2)).toEqual([
      'Study Planning Toolkit',
      'Exam Stress Support',
    ]);
  });

  it('filters resources by audience and category', async () => {
    const tree = await renderScreen();

    await press(tree.root, 'resources-audience-university-staff');
    await press(tree.root, 'resources-category-physical-wellbeing');

    expect(hasText(tree.root, '3 resources found')).toBe(true);
    expect(hasText(tree.root, 'Sleep Habits for Students & Staff')).toBe(true);
    expect(hasText(tree.root, 'Stress Management Exercises')).toBe(true);
    expect(hasText(tree.root, 'Work-Life Balance for University Staff')).toBe(true);
    expect(hasText(tree.root, 'Study Planning Toolkit')).toBe(false);
  });

  it('sorts the filtered resource list alphabetically', async () => {
    const tree = await renderScreen();

    await press(tree.root, 'resources-audience-all');
    await press(tree.root, 'resources-category-mental-health');
    await press(tree.root, 'resources-sort-title');

    expect(getRenderedResourceTitles(tree.root)).toEqual([
      'Exam Stress Support',
      'Homesickness Resources',
      'Mindfulness & Grounding Guides',
      'Stress Management Exercises',
      'Work-Life Balance for University Staff',
    ]);
  });

  it('saves a resource for later and updates the saved count', async () => {
    const tree = await renderScreen();

    await press(tree.root, 'resources-save-exam-stress');

    expect(hasText(tree.root, 'Saved (1)')).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'mindtrack_saved_resources_student@ru.is',
      JSON.stringify(['exam-stress']),
    );
  });

  it('shows the saved list when the saved view is selected', async () => {
    await AsyncStorage.setItem(
      'mindtrack_saved_resources_student@ru.is',
      JSON.stringify(['exam-stress']),
    );

    const tree = await renderScreen();

    await press(tree.root, 'resources-toggle-saved');

    expect(hasText(tree.root, 'Saved (1)')).toBe(true);
    expect(hasText(tree.root, 'Exam Stress Support')).toBe(true);
    expect(hasText(tree.root, 'Mindfulness & Grounding Guides')).toBe(false);
  });
});
