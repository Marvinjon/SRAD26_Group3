import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RESOURCES, type Resource, type ResourceAudience } from '@/constants/resources_list';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';

function formatCompactDate(epochMs: number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(epochMs));
}

function getAudienceLabel(audience: ResourceAudience): string {
  if (audience === 'student') return 'Student';
  if (audience === 'employee') return 'University Staff';
  return 'Students & Staff';
}

function computeSearchScore(resource: Resource, terms: string[]): number {
  if (terms.length === 0) return 0;

  const title = resource.title.toLowerCase();
  const description = resource.description.toLowerCase();
  const categories = resource.categories.join(' ').toLowerCase();
  const tags = resource.tags.join(' ').toLowerCase();

  let score = 0;
  for (const term of terms) {
    if (!term) continue;

    if (title.includes(term)) score += 7;
    if (tags.includes(term)) score += 4;
    if (categories.includes(term)) score += 3;
    if (description.includes(term)) score += 2;
  }

  // Extra boost when the whole query matches a chunk.
  const phrase = terms.join(' ');
  if (phrase.length >= 3 && (title.includes(phrase) || description.includes(phrase))) score += 10;

  return score;
}

export default function ResourcesScreen() {
  const { user } = useAuth();
  const textColor = useThemeColor({}, 'text');

  const [resourceQuery, setResourceQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAudience, setSelectedAudience] = useState<'All' | 'Student' | 'University Staff'>('All');
  const [resourceSort, setResourceSort] = useState<'relevance' | 'newest' | 'title'>('relevance');

  const categoryFilters = useMemo(() => {
    const set = new Set<string>();
    for (const r of RESOURCES) {
      for (const c of r.categories) set.add(c);
    }
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'student') setSelectedAudience('Student');
    else if (user.role === 'employee') setSelectedAudience('University Staff');
    else setSelectedAudience('All');
  }, [user]);

  const filteredResources = useMemo(() => {
    const normalizedQuery = resourceQuery.trim().toLowerCase();
    const terms = normalizedQuery ? normalizedQuery.split(/\s+/).filter(Boolean) : [];

    let list = RESOURCES.slice();

    if (selectedCategory !== 'All') {
      list = list.filter((r) => r.categories.includes(selectedCategory));
    }

    if (selectedAudience !== 'All') {
      list = list.filter((r) => {
        if (selectedAudience === 'Student') return r.audience === 'student' || r.audience === 'both';
        if (selectedAudience === 'University Staff')
          return r.audience === 'employee' || r.audience === 'both';
        return true;
      });
    }

    if (terms.length === 0) {
      const sorted = list.slice();
      if (resourceSort === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title));
      else sorted.sort((a, b) => b.updatedAt - a.updatedAt); // relevance -> newest fallback
      return sorted;
    }

    const scored = list
      .map((resource) => ({ resource, score: computeSearchScore(resource, terms) }))
      .filter((x) => x.score > 0);

    scored.sort((a, b) => {
      if (resourceSort === 'relevance') {
        const diff = b.score - a.score;
        if (diff !== 0) return diff;
        return b.resource.updatedAt - a.resource.updatedAt;
      }
      if (resourceSort === 'newest') {
        const diff = b.resource.updatedAt - a.resource.updatedAt;
        if (diff !== 0) return diff;
        return a.resource.title.localeCompare(b.resource.title);
      }
      // title
      const diff = a.resource.title.localeCompare(b.resource.title);
      if (diff !== 0) return diff;
      return b.resource.updatedAt - a.resource.updatedAt;
    });

    return scored.map((x) => x.resource);
  }, [resourceQuery, resourceSort, selectedAudience, selectedCategory]);

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

  const audienceFilters: Array<'All' | 'Student' | 'University Staff'> = ['All', 'Student', 'University Staff'];

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

            <View style={styles.searchBlock}>
              <ThemedText style={styles.searchLabel}>Search support resources</ThemedText>
              <TextInput
                value={resourceQuery}
                onChangeText={setResourceQuery}
                placeholder="e.g. anxiety, sleep, study planning"
                placeholderTextColor={textColor + '40'}
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

