// A small, explainable lead score (0–100). No black box: every point comes
// with a reason the salesperson can read in the tooltip.
import type { LeadStage } from '@/lib/database.types';

export interface ScoreInput {
  stage: LeadStage;
  attempt_count: number;
  last_connected_at: string | null;
  last_attempt_at: string | null;
  stage_changed_at: string;
  created_at: string;
  deal_value_inr: number | null;
  next_action_at: string | null;
}

export interface Score {
  value: number;
  band: 'hot' | 'warm' | 'cold';
  reasons: string[];
}

const STAGE_POINTS: Partial<Record<LeadStage, number>> = {
  new: 20, attempting: 15, connected: 30, interested: 50, callback: 55, meeting: 65,
  quotation: 70, negotiation: 75, nurture: 10,
};

const DAY = 86_400_000;

export function scoreLead(l: ScoreInput, now = Date.now()): Score | null {
  if (l.stage === 'won' || l.stage === 'lost' || l.stage === 'dnc') return null;
  const reasons: string[] = [];
  let v = STAGE_POINTS[l.stage] ?? 20;
  reasons.push(`Stage: +${v}`);

  if (l.last_connected_at) {
    const d = (now - new Date(l.last_connected_at).getTime()) / DAY;
    if (d <= 3) { v += 15; reasons.push('Spoke in the last 3 days: +15'); }
    else if (d <= 14) { v += 8; reasons.push('Spoke in the last 2 weeks: +8'); }
  }
  const missesSinceConnect = l.last_connected_at && l.last_attempt_at &&
    new Date(l.last_attempt_at) > new Date(l.last_connected_at) ? 1 : 0;
  if (!l.last_connected_at && l.attempt_count >= 3) {
    const p = Math.min(20, (l.attempt_count - 2) * 5);
    v -= p; reasons.push(`${l.attempt_count} attempts without reaching them: −${p}`);
  } else if (missesSinceConnect) {
    v -= 5; reasons.push('Missed the latest call: −5');
  }
  const stuck = (now - new Date(l.stage_changed_at).getTime()) / DAY;
  if (stuck > 14 && l.stage !== 'nurture') {
    const p = Math.min(20, Math.round((stuck - 14) / 2));
    v -= p; reasons.push(`${Math.round(stuck)} days in this stage: −${p}`);
  }
  if (l.deal_value_inr && l.deal_value_inr > 0) { v += 5; reasons.push('Has a quoted value: +5'); }
  if (l.next_action_at && new Date(l.next_action_at).getTime() < now - DAY) {
    v -= 10; reasons.push('Follow-up overdue by more than a day: −10');
  }
  v = Math.max(0, Math.min(100, Math.round(v)));
  return { value: v, band: v >= 60 ? 'hot' : v >= 35 ? 'warm' : 'cold', reasons };
}
