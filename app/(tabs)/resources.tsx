import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RESOURCES } from '@/constants/resources_list';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  filterResources,
  getAudienceLabel,
  getCategoryFilters,
  toggleSavedResourceIds,
  type ResourceAudienceFilter,
  type ResourceSortOption,
} from '@/utils/resources';

const SAVED_RESOURCES_KEY_PREFIX = 'mindtrack_saved_resources_';

function formatCompactDate(epochMs: number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(epochMs));
}

export default function ResourcesScreen() {
  const { user } = useAuth();
  const textColor = useThemeColor({}, 'text');

  const [resourceQuery, setResourceQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAudience, setSelectedAudience] = useState<ResourceAudienceFilter>('All');
  const [resourceSort, setResourceSort] = useState<ResourceSortOption>('relevance');
  const [savedResourceIds, setSavedResourceIds] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const categoryFilters = useMemo(() => getCategoryFilters(RESOURCES), []);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'student') setSelectedAudience('Student');
    else if (user.role === 'employee') setSelectedAudience('University Staff');
    else setSelectedAudience('All');
  }, [user]);

  useEffect(() => {
    const email = user?.email;
    if (!email) return;

    let active = true;

    async function loadSaved() {
      try {
        const key = `${SAVED_RESOURCES_KEY_PREFIX}${email}`;
        const raw = await AsyncStorage.getItem(key);
        if (!active) return;
        const parsed = raw ? JSON.parse(raw) : [];
        setSavedResourceIds(Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []);
      } catch {
        // ignore storage errors
      }
    }

    loadSaved();

    return () => {
      active = false;
    };
  }, [user?.email]);

  const savedResourceSet = useMemo(() => new Set(savedResourceIds), [savedResourceIds]);

  async function persistSavedResources(nextIds: string[]) {
    if (!user?.email) return;
    try {
      const key = `${SAVED_RESOURCES_KEY_PREFIX}${user.email}`;
      await AsyncStorage.setItem(key, JSON.stringify(nextIds));
    } catch {
      // ignore storage errors
    }
  }

  async function handleToggleSaved(resourceId: string) {
    const next = toggleSavedResourceIds(savedResourceIds, resourceId);
    setSavedResourceIds(next);
    await persistSavedResources(next);
  }

  const filteredResources = useMemo(
    () =>
      filterResources(RESOURCES, {
        query: resourceQuery,
        resourceSort,
        savedResourceIds,
        selectedAudience,
        selectedCategory,
        showSavedOnly,
      }),
    [resourceQuery, resourceSort, savedResourceIds, selectedAudience, selectedCategory, showSavedOnly],
  );

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safe}>
          <View style={[styles.card, { borderColor: textColor + '10' }]}>
            <ThemedText style={styles.title}>Resources</ThemedText>
            <ThemedText style={[styles.helperText, { color: textColor + '99' }]}>
              Please log in to view support resources.
            </ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (user.role === 'therapist') {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safe}>
          <View style={[styles.card, { borderColor: textColor + '10' }]}>
            <ThemedText style={styles.title}>Resources</ThemedText>
            <ThemedText style={[styles.helperText, { color: textColor + '99' }]}>
              This section is for students and university staff.
            </ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const audienceFilters: ResourceAudienceFilter[] = ['All', 'Student', 'University Staff'];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.page}>
            <View style={styles.pageHeader}>
              <ThemedText style={styles.pageTitle}>Resources for Students & University Staff</ThemedText>
              <ThemedText style={[styles.pageHelper, { color: textColor + '99' }]}>
                Search support resources, then filter and sort to find what you need.
              </ThemedText>
            </View>

            <View style={styles.viewToggleRow}>
              <TouchableOpacity
                style={[
                  styles.viewToggleChip,
                  !showSavedOnly && styles.viewToggleChipActive,
                  { borderColor: !showSavedOnly ? '#5B8DEF' : textColor + '26' },
                ]}
                testID="resources-toggle-all"
                onPress={() => setShowSavedOnly(false)}
                activeOpacity={0.85}
              >
                <ThemedText style={[styles.viewToggleChipText, !showSavedOnly && styles.viewToggleChipTextActive]}>
                  All
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewToggleChip,
                  showSavedOnly && styles.viewToggleChipActive,
                  { borderColor: showSavedOnly ? '#5B8DEF' : textColor + '26' },
                ]}
                testID="resources-toggle-saved"
                onPress={() => setShowSavedOnly(true)}
                activeOpacity={0.85}
              >
                <ThemedText style={[styles.viewToggleChipText, showSavedOnly && styles.viewToggleChipTextActive]}>
                  Saved ({savedResourceIds.length})
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.searchBlock}>
              <ThemedText style={styles.searchLabel}>Search support resources</ThemedText>
              <TextInput
                value={resourceQuery}
                onChangeText={setResourceQuery}
                placeholder="e.g. anxiety, sleep, study planning"
                placeholderTextColor={textColor + '40'}
                testID="resources-search-input"
                style={[
                  styles.searchInput,
                  { color: textColor, backgroundColor: textColor + '06', borderColor: textColor + '20' },
                ]}
              />
            </View>

            <View style={styles.filtersBlock}>
              <ThemedText style={styles.filterLabel}>Audience</ThemedText>
              <View style={styles.resourceRow}>
                {audienceFilters.map((aud) => {
                  const active = selectedAudience === aud;
                  return (
                    <TouchableOpacity
                      key={aud}
                      style={[
                        styles.filterChip,
                        active && styles.filterChipActive,
                        { borderColor: active ? '#5B8DEF' : textColor + '26' },
                      ]}
                      testID={`resources-audience-${aud.toLowerCase().replace(/\s+/g, '-')}`}
                      onPress={() => setSelectedAudience(aud)}
                      activeOpacity={0.85}
                    >
                      <ThemedText style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {aud === 'All' ? 'All' : aud}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.filtersBlock}>
              <ThemedText style={styles.filterLabel}>Category</ThemedText>
              <View style={styles.resourceRow}>
                {categoryFilters.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.filterChip,
                        active && styles.filterChipActive,
                        { borderColor: active ? '#5B8DEF' : textColor + '26' },
                      ]}
                      testID={`resources-category-${cat.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.85}
                    >
                      <ThemedText style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {cat}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.filtersBlock}>
              <ThemedText style={styles.filterLabel}>Sort</ThemedText>
              <View style={styles.resourceRow}>
                {[
                  { value: 'relevance', label: 'Most relevant' },
                  { value: 'newest', label: 'Newest' },
                  { value: 'title', label: 'A–Z' },
                ].map((opt) => {
                  const active = resourceSort === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.filterChip,
                        active && styles.filterChipActive,
                        { borderColor: active ? '#5B8DEF' : textColor + '26' },
                      ]}
                      testID={`resources-sort-${opt.value}`}
                      onPress={() => setResourceSort(opt.value as typeof resourceSort)}
                      activeOpacity={0.85}
                    >
                      <ThemedText style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                        {opt.label}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <ThemedText style={styles.resultsText}>
              {filteredResources.length} resource{filteredResources.length === 1 ? '' : 's'} found
            </ThemedText>

            {filteredResources.length === 0 ? (
              <View style={[styles.resourceEmpty, { borderColor: textColor + '18' }]}>
                <ThemedText style={[styles.resourceEmptyText, { color: textColor + '99' }]}>
                  No resources match your search/filters.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.resourceList}>
                {filteredResources.map((r) => (
                  <View key={r.id} style={[styles.resourceItem, { borderColor: textColor + '10' }]}>
                    <View style={styles.resourceItemHeader}>
                      <ThemedText style={[styles.resourceTitle, { color: textColor }]}>{r.title}</ThemedText>
                      <View style={styles.resourceHeaderRight}>
                        <View
                          style={[
                            styles.resourceAudiencePill,
                            { backgroundColor: textColor + '08', borderColor: textColor + '20' },
                          ]}
                        >
                          <ThemedText style={[styles.resourceAudiencePillText, { color: textColor + 'cc' }]}>
                            {getAudienceLabel(r.audience)}
                          </ThemedText>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.saveButton,
                            savedResourceSet.has(r.id) && styles.saveButtonActive,
                            { borderColor: savedResourceSet.has(r.id) ? '#F59200' : textColor + '20' },
                          ]}
                          testID={`resources-save-${r.id}`}
                          onPress={() => handleToggleSaved(r.id)}
                          activeOpacity={0.85}
                          accessibilityRole="button"
                          accessibilityLabel={savedResourceSet.has(r.id) ? 'Remove from saved' : 'Save for later'}
                        >
                          <ThemedText style={[styles.saveButtonText, savedResourceSet.has(r.id) && { color: '#F59200' }]}>
                            {savedResourceSet.has(r.id) ? '★' : '☆'}
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <ThemedText style={[styles.resourceDesc, { color: textColor + 'cc' }]} numberOfLines={3}>
                      {r.description}
                    </ThemedText>

                    <View style={styles.resourceMetaRow}>
                      <View
                        style={[
                          styles.resourceCategoryPill,
                          { backgroundColor: '#5B8DEF14', borderColor: '#5B8DEF30' },
                        ]}
                      >
                        <ThemedText style={styles.resourceCategoryPillText}>{r.categories[0]}</ThemedText>
                      </View>
                      <ThemedText style={[styles.resourceUpdatedText, { color: textColor + '99' }]}>
                        Updated {formatCompactDate(r.updatedAt)}
                      </ThemedText>
                    </View>

                    {r.url ? (
                      <ExternalLink href={r.url as any}>
                        <ThemedText style={styles.resourceLinkText}>Open link</ThemedText>
                      </ExternalLink>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  page: {
    gap: 10,
  },
  pageHeader: {
    gap: 6,
    marginBottom: 6,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  pageHelper: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.75,
    lineHeight: 19,
  },
  viewToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  viewToggleChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  viewToggleChipActive: {
    backgroundColor: '#5B8DEF',
    borderColor: '#5B8DEF',
  },
  viewToggleChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5B8DEF',
  },
  viewToggleChipTextActive: {
    color: '#fff',
  },
  card: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  helperText: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
  },

  searchBlock: {
    gap: 8,
  },
  searchLabel: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.6,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },

  filtersBlock: {
    marginTop: 10,
    gap: 6,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.55,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  resourceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#5B8DEF',
    borderColor: '#5B8DEF',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B8DEF',
  },
  filterChipTextActive: {
    color: '#fff',
  },

  resultsText: {
    marginTop: 12,
    fontSize: 13,
    opacity: 0.65,
    fontWeight: '600',
  },

  resourceList: {
    gap: 12,
    marginTop: 10,
  },
  resourceItem: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  resourceItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  resourceHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resourceTitle: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  resourceAudiencePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  resourceAudiencePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  saveButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  saveButtonActive: {
    backgroundColor: '#F5920018',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#5B8DEF',
  },
  resourceDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  resourceMetaRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resourceCategoryPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  resourceCategoryPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5B8DEF',
  },
  resourceUpdatedText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
  resourceLinkText: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '800',
    color: '#5B8DEF',
  },

  resourceEmpty: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },
  resourceEmptyText: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.7,
  },
});
