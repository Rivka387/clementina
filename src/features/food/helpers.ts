import type { FoodEntry, FoodKind } from '../../domain';

export const kinds: { value: FoodKind; label: string }[] = [
  { value: 'breakfast', label: 'ארוחת בוקר' },
  { value: 'lunch', label: 'ארוחת צהריים' },
  { value: 'dinner', label: 'ארוחת ערב' },
  { value: 'snack', label: 'נשנוש' },
  { value: 'drink', label: 'שתייה אחרת' },
];

export function kindLabel(kind: FoodKind) {
  return kinds.find((item) => item.value === kind)?.label ?? kind;
}

export function foodDetails(entry: FoodEntry) {
  return [
    entry.amount.trim(),
    entry.calories == null ? '' : `${entry.calories} קלוריות`,
    entry.note.trim(),
  ]
    .filter(Boolean)
    .join(' · ');
}

export function localTime() {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date());
}

export function kindAt(time: string): FoodKind {
  const hour = Number(time.slice(0, 2));
  return hour < 11 ? 'breakfast' : hour < 16 ? 'lunch' : hour < 21 ? 'dinner' : 'snack';
}
