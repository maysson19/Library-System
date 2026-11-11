export interface CategoryMeta {
  icon: string;
  color: string;
}

const META: Record<string, CategoryMeta> = {
  Programming: { icon: '💻', color: '#6b4a58' },
  Web: { icon: '🌐', color: '#6b5518' },
  'Software Engineering': { icon: '🧩', color: '#34536b' },
  Databases: { icon: '🗄️', color: '#3f6153' },
};

const ORDER = ['Programming', 'Web', 'Software Engineering', 'Databases'];

// Unknown categories get a default icon (their name comes from I18nService.categoryName)
export function categoryMeta(name: string): CategoryMeta {
  return META[name] ?? { icon: '📘', color: '#44506a' };
}

export function sortCategories(names: string[]): string[] {
  return [...names].sort((a, b) => {
    const ia = ORDER.indexOf(a) < 0 ? 99 : ORDER.indexOf(a);
    const ib = ORDER.indexOf(b) < 0 ? 99 : ORDER.indexOf(b);
    return ia - ib || a.localeCompare(b);
  });
}
