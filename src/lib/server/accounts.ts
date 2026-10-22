import 'server-only';
import { db } from '@/lib/server/appServer';
import { cancelSubscription } from '@/lib/server/razorpay';

/**
 * Removes a connected Instagram account and everything under it. AutoPay is
 * cancelled first so nobody keeps paying for an account that is gone.
 * Returns false if the AutoPay could not be cancelled (nothing is deleted).
 */
export async function removeAccount(accountId: string): Promise<boolean> {
  const sb = db();
  const { data } = await sb.from('ig_billing').select('rzp_subscription_id, rzp_status').eq('account_id', accountId).maybeSingle();
  const bill = data as { rzp_subscription_id: string | null; rzp_status: string | null } | null;
  const live = bill?.rzp_subscription_id && !['cancelled', 'completed', 'expired'].includes(bill.rzp_status ?? '');
  if (live && bill?.rzp_subscription_id) {
    try {
      await cancelSubscription(bill.rzp_subscription_id);
    } catch (e) {
      console.error('[removeAccount] cancel failed', accountId, e);
      return false;
    }
  }
  const { error } = await sb.from('ig_accounts').delete().eq('id', accountId);
  if (error) throw error;
  return true;
}
