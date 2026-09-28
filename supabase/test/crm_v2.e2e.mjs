// ─────────────────────────────────────────────────────────────────────
// End-to-end checks for the CRM v2 database layer, through the REAL
// Supabase stack (GoTrue + PostgREST + RLS), exactly as the browser sees it.
//
//   npx supabase start && npx supabase db reset
//   SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_ANON_KEY=... \
//   SUPABASE_SERVICE_ROLE_KEY=... node supabase/test/crm_v2.e2e.mjs
//
// LOCAL ONLY. It creates and deletes users — never point it at production.
// ─────────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!ANON || !SERVICE) throw new Error('Set SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY');
if (!/127\.0\.0\.1|localhost/.test(URL)) throw new Error('Refusing to run against a non-local Supabase');

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(URL, SERVICE, opts);
const anon = createClient(URL, ANON, opts);

let passed = 0;
let failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; console.log(`PASS  ${name}`); }
  else { failed++; console.log(`FAIL  ${name}${extra !== undefined ? ' — ' + JSON.stringify(extra) : ''}`); }
}
const iso = (ms) => new Date(Date.now() + ms).toISOString();
const H = 3600e3;

async function mkUser(email, role, extra = {}) {
  const { data, error } = await admin.auth.admin.createUser({
    email, password: 'Passw0rd!Test', email_confirm: true,
    app_metadata: { crm_role: role, full_name: email.split('@')[0], ...extra },
  });
  if (error) throw error;
  const c = createClient(URL, ANON, opts);
  const { error: e2 } = await c.auth.signInWithPassword({ email, password: 'Passw0rd!Test' });
  if (e2) throw e2;
  return { id: data.user.id, c };
}

async function main() {
  // Clean slate for users created by earlier runs.
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  for (const u of list.users) if (u.email?.endsWith('@e2e.test')) await admin.auth.admin.deleteUser(u.id);
  await admin.from('leads').delete().like('brand_name', 'E2E %');

  // ── anon ──
  const su = await anon.auth.signUp({ email: 'stranger@e2e.test', password: 'Passw0rd!Test' });
  check('anon signUp is rejected', !!su.error, su.error?.message);
  const al = await anon.from('leads').select('id');
  check('anon cannot read leads', !!al.error || (al.data ?? []).length === 0);
  const ae = await anon.from('inbound_enquiries').insert({ kind: 'query', name: 'E2E visitor', email: 'v@e2e.test', message: 'hi' });
  check('anon can submit a website enquiry', !ae.error, ae.error);
  const aer = await anon.from('inbound_enquiries').select('id');
  check('anon cannot read enquiries', !!aer.error || (aer.data ?? []).length === 0);
  const arpc = await anon.rpc('crm_dashboard');
  check('anon cannot call CRM RPCs', !!arpc.error);

  // ── users ──
  const owner = await mkUser('owner@e2e.test', 'owner');
  const adm = await mkUser('admin@e2e.test', 'admin');
  const m1 = await mkUser('m1@e2e.test', 'member', { crm_phone: '9876500001' });
  const m2 = await mkUser('m2@e2e.test', 'member');
  const { data: p1 } = await admin.from('profiles').select('*').eq('id', m1.id).single();
  check('profile created from app_metadata', p1?.role === 'member' && p1?.phone === '+919876500001', p1);

  // Park any pre-existing unowned leads (seed data) so the pool is only ours.
  await admin.from('leads').update({ owner_id: owner.id }).is('owner_id', null).not('brand_name', 'like', 'E2E %');

  // Pool of unowned leads.
  const pool = [];
  for (let i = 1; i <= 6; i++) {
    const { data, error } = await adm.c.rpc('create_lead_with_contacts', { payload: {
      brand_name: `E2E Pool ${i}`, owner_id: null,
      contacts: [{ name: `Pool contact ${i}`, is_primary: true, sort_order: 0,
                   phones: [{ phone_e164: `+9198765432${10 + i}`, is_primary: true, sort_order: 0 }] }],
    } });
    if (error) throw error;
    pool.push(data);
  }
  const m1see0 = await m1.c.from('leads').select('id').like('brand_name', 'E2E %');
  check('member sees no unowned leads', (m1see0.data ?? []).length === 0, m1see0.data?.length);
  const admSee = await adm.c.from('leads').select('id').like('brand_name', 'E2E Pool%');
  check('admin sees all leads', (admSee.data ?? []).length === 6);

  // ── quota + top-up ──
  const q1 = await m1.c.rpc('set_member_quota', { p_member: m1.id, p_quota: 50 });
  check('member cannot set quotas', !!q1.error);
  const q2 = await adm.c.rpc('set_member_quota', { p_member: m1.id, p_quota: 3 });
  check('admin sets quota', !q2.error, q2.error);
  const t1 = await m1.c.rpc('top_up_leads');
  check('member daily top-up assigns up to quota', t1.data === 3, t1);
  const t2 = await m1.c.rpc('top_up_leads');
  check('second top-up the same day assigns nothing', t2.data === 0, t2);
  const t3 = await m2.c.rpc('top_up_leads', { p_member: m1.id });
  check('member cannot top-up someone else', !!t3.error);
  const mine = await m1.c.from('leads').select('id, brand_name, stage, owner_id').like('brand_name', 'E2E %');
  check('member now sees exactly their 3 leads', (mine.data ?? []).length === 3 && mine.data.every((l) => l.owner_id === m1.id));
  const m2see = await m2.c.from('leads').select('id').like('brand_name', 'E2E %');
  check('other member still sees none', (m2see.data ?? []).length === 0);
  const lead = mine.data[0];

  // ── protected columns ──
  const u1 = await m1.c.from('leads').update({ stage: 'won' }).eq('id', lead.id);
  check('member cannot set stage directly', !!u1.error);
  const u2 = await m1.c.from('leads').update({ owner_id: m2.id }).eq('id', lead.id);
  check('member cannot reassign', !!u2.error);
  const u3 = await m1.c.from('leads').update({ deleted_at: new Date().toISOString() }).eq('id', lead.id);
  check('member cannot archive', !!u3.error);
  const u4 = await m1.c.from('leads').update({ notes: 'E2E note', address: 'Delhi' }).eq('id', lead.id).select('notes');
  check('member can edit plain fields', !u4.error && u4.data?.[0]?.notes === 'E2E note', u4.error);
  const u5 = await m2.c.from('leads').update({ notes: 'hijack' }).eq('id', lead.id).select('id');
  check('other member cannot edit it', !u5.error && (u5.data ?? []).length === 0);
  const ic = await m1.c.from('call_logs').insert({ lead_id: lead.id, channel: 'call' });
  check('client cannot insert call logs directly', !!ic.error);
  const it = await m1.c.from('lead_tasks').insert({ lead_id: lead.id, type: 'callback', due_at: iso(H) });
  check('client cannot insert tasks directly', !!it.error);
  const pr = await m1.c.from('profiles').update({ role: 'owner' }).eq('id', m1.id);
  check('member cannot change own role', !!pr.error);
  const au = await m1.c.from('audit_log').select('id');
  check('member cannot read the audit log', (au.data ?? []).length === 0);

  // ── member creates own lead; duplicate checks ──
  const own = await m1.c.rpc('create_lead_with_contacts', { payload: {
    brand_name: 'E2E Own Brand', instagram_username: '@E2E.Own', owner_id: m2.id,
    contacts: [{ name: 'Owner Person', is_primary: true, sort_order: 0, phones: [{ phone_e164: '98765 11111', is_primary: true, sort_order: 0 }] }],
  } });
  check('member creates a lead', !own.error, own.error);
  const ownRow = await m1.c.from('leads').select('owner_id, instagram_username').eq('id', own.data).single();
  check('member-created lead is forced to self + handle normalised',
        ownRow.data?.owner_id === m1.id && ownRow.data?.instagram_username === 'e2e.own', ownRow.data);
  const dupH = await m2.c.rpc('create_lead_with_contacts', { payload: { brand_name: 'E2E Dup', instagram_username: 'e2e.own' } });
  check('duplicate handle is rejected', !!dupH.error);
  const fd = await m2.c.rpc('find_duplicates', { p_handle: 'instagram.com/e2e.own/', p_phones: ['9876511111'] });
  check('find_duplicates reports brand without granting access',
        (fd.data ?? []).length === 1 && fd.data[0].can_open === false && fd.data[0].brand_name === 'E2E Own Brand', fd);

  // ── call workflow ──
  const { data: phones } = await m1.c.from('lead_phones').select('id').eq('lead_id', lead.id);
  const phoneId = phones[0].id;
  const a1 = await m1.c.rpc('start_attempt', { p_lead: lead.id, p_phone: phoneId, p_channel: 'call' });
  check('start attempt', !a1.error, a1.error);
  const a1b = await m1.c.rpc('start_attempt', { p_lead: lead.id, p_phone: phoneId, p_channel: 'call' });
  check('double tap returns the same attempt', a1b.data === a1.data);
  const busy = await adm.c.rpc('start_attempt', { p_lead: lead.id, p_phone: phoneId, p_channel: 'call' });
  check('another agent sees "lead busy"', /lead_busy/.test(busy.error?.message ?? ''), busy.error?.message);
  const m2start = await m2.c.rpc('start_attempt', { p_lead: lead.id, p_phone: phoneId, p_channel: 'call' });
  check('member cannot start a call on someone else\'s lead', /lead_not_found/.test(m2start.error?.message ?? ''));
  const bad = await m1.c.rpc('log_outcome', { p_attempt: a1.data, payload: { result: 'connected' } });
  check('connected without outcome is rejected', /invalid_input:outcome/.test(bad.error?.message ?? ''));
  const o1 = await m1.c.rpc('log_outcome', { p_attempt: a1.data, payload: { result: 'no_answer' } });
  check('no answer → attempting', o1.data?.stage === 'attempting', o1);
  const again = await m1.c.rpc('log_outcome', { p_attempt: a1.data, payload: { result: 'busy' } });
  check('an attempt cannot be logged twice', !!again.error);
  const { data: tk } = await m1.c.from('lead_tasks').select('type, due_at, status').eq('lead_id', lead.id).eq('status', 'open');
  const retryDue = new Date(tk?.[0]?.due_at).getTime() - Date.now();
  check('retry task ≈ 2 h later', tk?.length === 1 && tk[0].type === 'retry_call' && retryDue > 1.9 * H && retryDue < 2.1 * H, tk);
  const { data: l1 } = await m1.c.from('leads').select('next_action_type, attempt_count').eq('id', lead.id).single();
  check('lead next action mirrors the task', l1.next_action_type === 'retry_call' && l1.attempt_count === 1, l1);

  for (let i = 0; i < 5; i++) {
    const a = await m1.c.rpc('start_attempt', { p_lead: lead.id, p_phone: phoneId, p_channel: 'call' });
    await m1.c.rpc('log_outcome', { p_attempt: a.data, payload: { result: i % 2 ? 'busy' : 'switched_off' } });
  }
  const { data: l2 } = await m1.c.from('leads').select('stage').eq('id', lead.id).single();
  check('6 misses → nurture', l2.stage === 'nurture', l2);
  const { data: nt } = await m1.c.from('lead_tasks').select('type').eq('lead_id', lead.id).eq('status', 'open');
  check('nurture leaves exactly one nurture task', nt.length === 1 && nt[0].type === 'nurture', nt);

  // Connected → interested → callback
  const a2 = await m1.c.rpc('start_attempt', { p_lead: lead.id, p_phone: phoneId, p_channel: 'call' });
  const o2 = await m1.c.rpc('log_outcome', { p_attempt: a2.data, payload: {
    result: 'connected', outcome: 'interested', next_step: 'callback', due_at: iso(3 * H), note: 'Call after lunch' } });
  check('interested + callback → callback stage', o2.data?.stage === 'callback', o2);
  const { data: tk2 } = await m1.c.from('lead_tasks').select('type').eq('lead_id', lead.id).eq('status', 'open');
  check('only the callback task is open', tk2.length === 1 && tk2[0].type === 'callback', tk2);

  // Callback → meeting
  const cbTask = (await m1.c.from('lead_tasks').select('id').eq('lead_id', lead.id).eq('status', 'open').single()).data;
  const a3 = await m1.c.rpc('start_attempt', { p_lead: lead.id, p_phone: phoneId, p_channel: 'call', p_task: cbTask.id });
  const o3 = await m1.c.rpc('log_outcome', { p_attempt: a3.data, payload: {
    result: 'connected', outcome: 'interested', next_step: 'meeting', due_at: iso(24 * H), meeting_mode: 'video', location: 'https://meet.example/x' } });
  check('callback → meeting', o3.data?.stage === 'meeting', o3);
  const { data: tk3 } = await m1.c.from('lead_tasks').select('id, type, status').eq('lead_id', lead.id);
  check('callback task closed by the call', tk3.find((t) => t.id === cbTask.id)?.status === 'done');
  const mt = tk3.find((t) => t.type === 'meeting' && t.status === 'open');

  // No-show once, then held → quote
  const ns = await m1.c.rpc('complete_meeting', { p_task: mt.id, payload: { result: 'no_show', due_at: iso(48 * H) } });
  check('no-show reschedules', !ns.error && ns.data?.stage === 'meeting', ns);
  const mt2 = (await m1.c.from('lead_tasks').select('id').eq('lead_id', lead.id).eq('type', 'meeting').eq('status', 'open').single()).data;
  const held = await m1.c.rpc('complete_meeting', { p_task: mt2.id, payload: {
    result: 'held_positive', quote: { amount: 45000, valid_until: iso(7 * 24 * H).slice(0, 10), services: 'Reels + Ads', link: 'https://drive.example/q1' } } });
  check('meeting held + quote → quotation', held.data?.stage === 'quotation', held);
  const badLink = await m1.c.rpc('create_quotation', { p_lead: lead.id, p_amount: 1000, p_valid_until: null, p_services: null, p_link: 'javascript:alert(1)' });
  check('quote link must be https', /invalid_input:link/.test(badLink.error?.message ?? ''));

  // Quote revision on a follow-up call, then accepted.
  const a4 = await m1.c.rpc('start_attempt', { p_lead: lead.id, p_phone: phoneId, p_channel: 'call' });
  const o4 = await m1.c.rpc('log_outcome', { p_attempt: a4.data, payload: {
    result: 'connected', outcome: 'quote_revision', quote: { amount: 40000 } } });
  check('revision → negotiation with v2', o4.data?.stage === 'negotiation', o4);
  const { data: qs } = await m1.c.from('quotations').select('id, version, status, amount_inr').eq('lead_id', lead.id).order('version');
  check('v1 revised, v2 sent', qs.length === 2 && qs[0].status === 'revised' && qs[1].status === 'sent' && Number(qs[1].amount_inr) === 40000, qs);
  const acc = await m1.c.rpc('decide_quotation', { p_quote: qs[1].id, p_decision: 'accepted' });
  check('accept quote', !acc.error, acc.error);
  const { data: won } = await m1.c.from('leads').select('stage, deal_value_inr, next_action_at').eq('id', lead.id).single();
  check('won with deal value and no open tasks', won.stage === 'won' && Number(won.deal_value_inr) === 40000 && won.next_action_at === null, won);
  const reopen = await m1.c.rpc('set_lead_stage', { p_lead: lead.id, p_stage: 'interested' });
  check('member cannot reopen a won lead', !!reopen.error);

  // Not interested (other agency) → lost + re-engage near contract end
  const lead2 = mine.data[1];
  const ph2 = (await m1.c.from('lead_phones').select('id').eq('lead_id', lead2.id)).data[0].id;
  const b1 = await m1.c.rpc('start_attempt', { p_lead: lead2.id, p_phone: ph2, p_channel: 'call' });
  const end = new Date(Date.now() + 60 * 24 * H).toISOString().slice(0, 10);
  const b1o = await m1.c.rpc('log_outcome', { p_attempt: b1.data, payload: {
    result: 'connected', outcome: 'not_interested', lost_reason: 'using_other_agency', competitor_name: 'Agency X', competitor_contract_end: end } });
  check('not interested → lost', b1o.data?.stage === 'lost', b1o);
  const { data: re } = await m1.c.from('lead_tasks').select('type, due_at').eq('lead_id', lead2.id).eq('status', 'open');
  const reDays = (new Date(re?.[0]?.due_at).getTime() - Date.now()) / (24 * H);
  check('re-engage task ~a week before contract end', re?.length === 1 && re[0].type === 're_engage' && reDays > 51 && reDays < 54, re);
  const { data: l2r } = await m1.c.from('leads').select('lost_reason, competitor_name').eq('id', lead2.id).single();
  check('lost reason + competitor stored', l2r.lost_reason === 'using_other_agency' && l2r.competitor_name === 'Agency X', l2r);

  // Do not call
  const lead3 = mine.data[2];
  const ph3 = (await m1.c.from('lead_phones').select('id').eq('lead_id', lead3.id)).data[0].id;
  const c1 = await m1.c.rpc('start_attempt', { p_lead: lead3.id, p_phone: ph3, p_channel: 'whatsapp' });
  const wa = await m1.c.rpc('log_outcome', { p_attempt: c1.data, payload: { result: 'no_answer' } });
  check('WhatsApp attempt rejects call results', /invalid_input:result/.test(wa.error?.message ?? ''));
  const wa2 = await m1.c.rpc('log_outcome', { p_attempt: c1.data, payload: { result: 'wa_replied', outcome: 'do_not_call' } });
  check('reply "do not contact" → dnc', wa2.data?.stage === 'dnc', wa2);
  const c2 = await m1.c.rpc('start_attempt', { p_lead: lead3.id, p_phone: ph3, p_channel: 'call' });
  check('dnc lead cannot be called', /lead_dnc/.test(c2.error?.message ?? ''));

  // Wrong number on the only phone → lost (invalid contact)
  const d1 = (await adm.c.rpc('create_lead_with_contacts', { payload: { brand_name: 'E2E Wrong', owner_id: m2.id,
    contacts: [{ name: 'X', is_primary: true, sort_order: 0, phones: [{ phone_e164: '+919876599999', is_primary: true, sort_order: 0 }] }] } })).data;
  const dph = (await m2.c.from('lead_phones').select('id').eq('lead_id', d1)).data[0].id;
  const d1a = await m2.c.rpc('start_attempt', { p_lead: d1, p_phone: dph, p_channel: 'call' });
  const d1o = await m2.c.rpc('log_outcome', { p_attempt: d1a.data, payload: { result: 'wrong_number' } });
  check('wrong number on the only phone → lost', d1o.data?.stage === 'lost', d1o);
  const { data: dl } = await m2.c.from('leads').select('lost_reason').eq('id', d1).single();
  check('…with reason invalid_contact', dl.lost_reason === 'invalid_contact');

  // Pending outcomes cap
  const ids = [];
  for (const p of pool.slice(3, 6)) {
    const ph = (await adm.c.from('lead_phones').select('id').eq('lead_id', p)).data[0].id;
    ids.push((await adm.c.rpc('start_attempt', { p_lead: p, p_phone: ph, p_channel: 'call' })).data);
  }
  const extra = await adm.c.rpc('start_attempt', { p_lead: own.data, p_phone: (await adm.c.from('lead_phones').select('id').eq('lead_id', own.data)).data[0].id, p_channel: 'call' });
  check('4th unlogged attempt is refused', /too_many_pending/.test(extra.error?.message ?? ''), extra.error?.message);
  const disc = await adm.c.rpc('discard_attempt', { p_attempt: ids[0] });
  check('discard own pending attempt', !disc.error, disc.error);

  // Import (admin only)
  const imp1 = await m1.c.rpc('import_leads', { p_rows: [{ brand_name: 'E2E Imp' }] });
  check('member cannot import', !!imp1.error);
  const imp2 = await adm.c.rpc('import_leads', { p_rows: [
    { brand_name: 'E2E Imp 1', phone: '9876522222', instagram: '@e2e.imp1' },
    { brand_name: 'E2E Imp 2', phone: '12' },
    { brand_name: '' },
    { brand_name: 'E2E Imp dup', instagram: 'e2e.own' },
  ] });
  check('import inserts valid rows and reports the rest', imp2.data?.inserted === 1 && imp2.data?.skipped?.length === 3, imp2);

  // Dashboard + insights
  const dash = await m1.c.rpc('crm_dashboard');
  check('dashboard works for members', !dash.error && typeof dash.data?.overdue === 'number', dash.error);
  const today = new Date().toISOString().slice(0, 10);
  const ins = await adm.c.rpc('crm_insights', { p_from: today, p_to: today, p_member: null });
  check('insights for admin', !ins.error && ins.data.calls >= 8 && Array.isArray(ins.data.members), ins.error ?? ins.data);
  const insM = await m1.c.rpc('crm_insights', { p_from: today, p_to: today, p_member: m2.id });
  check('member insights are scoped to self', !insM.error && insM.data.members === null);

  // Reassign by admin moves open tasks
  const rs = await adm.c.rpc('reassign_leads', { p_leads: [lead2.id], p_owner: m2.id });
  check('admin reassigns', rs.data === 1, rs);
  const { data: rt } = await adm.c.from('lead_tasks').select('assignee_id').eq('lead_id', lead2.id).eq('status', 'open');
  check('open tasks follow the new owner', rt.every((t) => t.assignee_id === m2.id), rt);

  // Deactivation cuts access immediately
  await admin.from('profiles').update({ is_active: false }).eq('id', m1.id);
  const gone = await m1.c.from('leads').select('id');
  check('deactivated member reads nothing', (gone.data ?? []).length === 0);
  const gone2 = await m1.c.rpc('crm_dashboard');
  check('deactivated member cannot call RPCs', !!gone2.error);

  // Timeline recorded
  const { data: acts } = await adm.c.from('lead_activities').select('kind').eq('lead_id', lead.id);
  const kinds = new Set(acts.map((a) => a.kind));
  check('timeline has stage changes, tasks, outcomes, quotes',
        ['stage_changed', 'task_scheduled', 'outcome_logged', 'quote_sent', 'quote_decided', 'meeting_outcome', 'assigned'].every((k) => kinds.has(k)), [...kinds]);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
