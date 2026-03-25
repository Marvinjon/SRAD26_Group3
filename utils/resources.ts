import { type Resource, type ResourceAudience } from '@/constants/resources_list';

export type ResourceAudienceFilter = 'All' | 'Student' | 'University Staff';
export type ResourceSortOption = 'relevance' | 'newest' | 'title';

export interface ResourceFilterOptions {
  query: string;
  selectedCategory: string;
  selectedAudience: ResourceAudienceFilter;
  resourceSort: ResourceSortOption;
  savedResourceIds: string[];
  showSavedOnly: boolean;
}

export function getAudienceLabel(audience: ResourceAudience): string {
  if (audience === 'student') return 'Student';
  if (audience === 'employee') return 'University Staff';
  return 'Students & Staff';
}

export function getCategoryFilters(resources: Resource[]): string[] {
  const set = new Set<string>();
  for (const resource of resources) {
    for (const category of resource.categories) set.add(category);
  }
  return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
}

export function computeSearchScore(resource: Resource, terms: string[]): number {
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

  const phrase = terms.join(' ');
  if (phrase.length >= 3 && (title.includes(phrase) || description.includes(phrase))) score += 10;

  return score;
}

export function toggleSavedResourceIds(savedResourceIds: string[], resourceId: string): string[] {
  return savedResourceIds.includes(resourceId)
    ? savedResourceIds.filter((id) => id !== resourceId)
    : [...savedResourceIds, resourceId];
}

export function filterResources(resources: Resource[], options: ResourceFilterOptions): Resource[] {
  const {
    query,
    selectedCategory,
    selectedAudience,
    resourceSort,
    savedResourceIds,
    showSavedOnly,
  } = options;

  const normalizedQuery = query.trim().toLowerCase();
  const terms = normalizedQuery ? normalizedQuery.split(/\s+/).filter(Boolean) : [];
  const savedResourceSet = new Set(savedResourceIds);

  let list = showSavedOnly ? resources.filter((resource) => savedResourceSet.has(resource.id)) : resources.slice();

  if (selectedCategory !== 'All') {
    list = list.filter((resource) => resource.categories.includes(selectedCategory));
  }

  if (selectedAudience !== 'All') {
    list = list.filter((resource) => {
      if (selectedAudience === 'Student') return resource.audience === 'student' || resource.audience === 'both';
      if (selectedAudience === 'University Staff')
        return resource.audience === 'employee' || resource.audience === 'both';
      return true;
    });
  }

  if (terms.length === 0) {
    const sorted = list.slice();
    if (resourceSort === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title));
    else sorted.sort((a, b) => b.updatedAt - a.updatedAt);
    return sorted;
  }

  const scored = list
    .map((resource) => ({ resource, score: computeSearchScore(resource, terms) }))
    .filter((entry) => entry.score > 0);

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
    const diff = a.resource.title.localeCompare(b.resource.title);
    if (diff !== 0) return diff;
    return b.resource.updatedAt - a.resource.updatedAt;
  });

  return scored.map((entry) => entry.resource);
}
