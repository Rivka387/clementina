import { Home, TrendingUp, UsersRound, Settings2 } from 'lucide-react';

export type Tab = 'today' | 'progress' | 'together' | 'settings';
export const tabs = [
  { id: 'today', label: 'היום', icon: Home },
  { id: 'progress', label: 'התקדמות', icon: TrendingUp },
  { id: 'together', label: 'ביחד', icon: UsersRound },
  { id: 'settings', label: 'הגדרות', icon: Settings2 },
] as const;
export function getTab(): Tab {
  const t = window.location.hash.slice(1);
  return tabs.some((x) => x.id === t) ? (t as Tab) : 'today';
}
