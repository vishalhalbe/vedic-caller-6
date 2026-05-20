export type AuditEventType =
  | 'wallet_recharge' | 'wallet_withdrawal' | 'call_initiated'
  | 'call_ended' | 'payment_verified' | 'payout_requested'
  | 'profile_updated' | 'password_changed' | 'kyc_submitted' | 'call_refunded';

export async function createAuditLog(
  supabaseUrl: string,
  supabaseKey: string,
  event: {
    actor_id: string;
    actor_type: 'user' | 'astrologer' | 'admin' | 'system';
    event_type: AuditEventType;
    resource_type: string;
    resource_id: string;
    action: 'create' | 'read' | 'update' | 'delete';
    status: 'success' | 'failure';
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...event, timestamp: new Date().toISOString() }),
    });
  } catch {
    // Audit logging failure should never break the main operation
  }
}
