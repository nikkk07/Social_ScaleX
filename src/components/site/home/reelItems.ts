import { PORTFOLIO, RESULTS_AS_OF, growthChange, type PortfolioItem } from '@/lib/content';
import { formatDay } from '@/lib/dates';
import { lc } from '@/lib/text';

/** One client card in the results reel. Every value comes from PORTFOLIO. */
export interface ReelItem {
  id: string;
  client: string;
  handle: string;
  avatar: string;
  category: string;
  status: PortfolioItem['status'];
  value: string;
  label: string;
  growth: boolean;
  extra?: { value: string; label: string };
  date: string;
  /** Before → after from the client's first growth record, drawn as two bars. */
  bars?: { label: string; period: string; from: number; to: number; fromText: string; toText: string };
}

export function reelItems(): ReelItem[] {
  return PORTFOLIO.filter((p) => p.metrics.length > 0 || p.growth.length > 0).map((p) => {
    const g = p.growth[0];
    const lead = g && g.to / g.from >= 1.5 ? g : undefined;
    const head = lead
      ? { value: growthChange(lead), label: `${lead.fromText} → ${lead.toText} ${lc(lead.label)}`, growth: true }
      : { value: p.metrics[0]?.value ?? '', label: p.metrics[0]?.label ?? '', growth: false };
    const shown = head.growth ? lead?.toText.replace('+', '') : head.value.replace('+', '');
    const extra = p.metrics.find((m) => m.value.replace('+', '') !== shown);
    return {
      id: p.id,
      client: p.client,
      handle: p.handle,
      avatar: p.avatar,
      category: p.category,
      status: p.status,
      ...head,
      extra: extra ? { value: extra.value, label: extra.label } : undefined,
      bars: g ? { label: g.label, period: g.period, from: g.from, to: g.to, fromText: g.fromText, toText: g.toText } : undefined,
      date: p.status === 'Past' ? 'Figures at hand-over' : `Figures as of ${formatDay(p.asOf ?? RESULTS_AS_OF)}`,
    };
  });
}
