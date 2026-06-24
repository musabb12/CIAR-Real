type SortableProperty = {
  countryId?: string | null;
  country?: { name?: string; code?: string; id?: string } | null;
  city?: { name?: string } | null;
  title?: string;
  createdAt?: string;
};

export function countrySortKey(row: SortableProperty): string {
  return (
    row.country?.name?.trim() ||
    row.countryId?.trim() ||
    row.country?.code?.trim() ||
    row.country?.id?.trim() ||
    ''
  ).toLowerCase();
}

export function sortPropertiesByCountry<T extends SortableProperty>(rows: T[], locale = 'en'): T[] {
  return [...rows].sort((a, b) => {
    const byCountry = countrySortKey(a).localeCompare(countrySortKey(b), locale, { sensitivity: 'base' });
    if (byCountry !== 0) return byCountry;

    const cityA = (a.city?.name ?? '').toLowerCase();
    const cityB = (b.city?.name ?? '').toLowerCase();
    const byCity = cityA.localeCompare(cityB, locale, { sensitivity: 'base' });
    if (byCity !== 0) return byCity;

    const byTitle = (a.title ?? '').localeCompare(b.title ?? '', locale, { sensitivity: 'base' });
    if (byTitle !== 0) return byTitle;

    return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
  });
}
