// Supabase Edge Function: send-push
// Triggered by Database Webhooks on INSERT (leads, messages) and UPDATE (availability_slots).
// Sends a real Web Push notification to every subscription belonging to the coach.
//
// Deploy this from the Supabase Dashboard: Edge Functions → New function → name it
// "send-push" → paste this code → Deploy. No CLI needed.
//
// Required secrets (Edge Functions → send-push → Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (e.g. "mailto:you@example.com")
//   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-provided by Supabase, no need to set them.

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY');
const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY');
const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@example.com';

webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const table = payload.table;
    const record = payload.record;
    const admin = createClient(supabaseUrl, serviceKey);

    let title = 'Happy Fit Physio';
    let body = '';
    let coachId = null;

    if (table === 'leads') {
      title = '📥 Νέο ενδιαφερόμενο';
      body = `${record.full_name} άφησε τα στοιχεία του.`;
      // Leads aren't linked to a specific coach yet — notify every coach profile.
      const { data: coaches } = await admin.from('profiles').select('id').eq('role', 'coach');
      for (const c of coaches || []) await sendToProfile(admin, c.id, title, body);
      return new Response('ok');
    }

    if (table === 'messages' && record.sender_role === 'client') {
      title = '💬 Νέο μήνυμα';
      body = record.body?.slice(0, 100) || '';
      const { data: clientRow } = await admin.from('clients').select('coach_id, full_name').eq('id', record.client_id).maybeSingle();
      if (clientRow) {
        body = `${clientRow.full_name}: ${body}`;
        coachId = clientRow.coach_id;
      }
    }

    if (table === 'availability_slots' && record.booked_by) {
      title = '🗓️ Κράτηση κλήσης';
      const { data: clientRow } = await admin.from('clients').select('coach_id, full_name').eq('id', record.booked_by).maybeSingle();
      if (clientRow) {
        body = `${clientRow.full_name} έκλεισε κλήση για ${new Date(record.start_at).toLocaleString('el-GR')}.`;
        coachId = clientRow.coach_id;
      }
    }

    if (coachId) await sendToProfile(admin, coachId, title, body);
    return new Response('ok');
  } catch (err) {
    return new Response(String(err?.message || err), { status: 500 });
  }
});

async function sendToProfile(admin, profileId, title, body) {
  const { data: subs } = await admin.from('push_subscriptions').select('*').eq('profile_id', profileId);
  for (const sub of subs || []) {
    const subscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };
    try {
      await webpush.sendNotification(subscription, JSON.stringify({ title, body, url: '/app.html' }));
    } catch (err) {
      // Expired/invalid subscription — clean it up.
      if (err.statusCode === 404 || err.statusCode === 410) {
        await admin.from('push_subscriptions').delete().eq('id', sub.id);
      }
    }
  }
}
