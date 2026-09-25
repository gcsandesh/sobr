/**
 * Supabase "Send Email" auth hook — sends sign-in emails through Resend instead
 * of Supabase's built-in mailer, so the OTP email is ours to design.
 *
 * This is the supported way to take over auth email: Supabase calls this hook
 * with the already-generated code (`email_data.token`) rather than sending its
 * own mail, so we never touch auth internals and the code stays verifiable via
 * the normal `supabase.auth.verifyOtp({ email, token, type: 'email' })` call
 * the app already makes.
 *
 * Deploy + wire up:
 *   npx supabase login
 *   npx supabase functions deploy send-email --project-ref uqozokfjfstsfuelgzcy --no-verify-jwt
 *   npx supabase secrets set RESEND_API_KEY=<key> SEND_EMAIL_HOOK_SECRET=<secret> \
 *     --project-ref uqozokfjfstsfuelgzcy
 * Then: Dashboard → Authentication → Hooks → "Send Email" → this function, and
 * copy the generated hook secret into SEND_EMAIL_HOOK_SECRET.
 *
 * `--no-verify-jwt` is required: the caller is Supabase Auth, which authenticates
 * with a Standard Webhooks signature (verified below) rather than a user JWT.
 */

import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

type EmailActionType =
  | 'signup'
  | 'magiclink'
  | 'recovery'
  | 'invite'
  | 'email_change'
  | 'email_change_current'
  | 'email_change_new'
  | 'reauthentication';

interface HookPayload {
  user: { email: string };
  email_data: {
    token: string;
    token_hash: string;
    email_action_type: EmailActionType;
    redirect_to?: string;
  };
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const HOOK_SECRET = Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? '';
const FROM = Deno.env.get('EMAIL_FROM') ?? 'sobr <onboarding@resend.dev>';

/** Cream/terracotta shell, matching the weekly-progress email in 0002_email.sql. */
function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#F5EAD8;">
<div style="max-width:520px;margin:0 auto;padding:32px 20px;font-family:Georgia,'Times New Roman',serif;color:#201E1D;">
  <div style="background:#FFFFFF;border-radius:16px;padding:28px;border:1px solid #E7DCC8;">
    <div style="font-size:22px;font-weight:bold;color:#C67139;margin-bottom:4px;">sobr</div>
    <div style="font-size:13px;color:#82796A;margin-bottom:20px;">Clear days, counted.</div>
    <div style="font-size:19px;margin-bottom:14px;">${title}</div>
    ${body}
  </div>
  <div style="text-align:center;font-size:12px;color:#82796A;padding:16px;">
    If you didn't ask for this email, you can ignore it — nothing happens without the code.
  </div>
</div></body></html>`;
}

function codeEmail(token: string, isNewUser: boolean): { subject: string; html: string } {
  const body = `
    <p style="font-size:15px;line-height:1.6;color:#4A443C;margin:0 0 18px;">
      ${isNewUser ? 'Welcome. Enter this code in the app to finish signing up:' : 'Enter this code in the app to sign in:'}
    </p>
    <div style="background:#FBF2E3;border-radius:12px;padding:18px;text-align:center;margin-bottom:18px;">
      <div style="font-size:34px;font-weight:bold;letter-spacing:10px;color:#B95C22;font-family:Helvetica,Arial,sans-serif;">${token}</div>
    </div>
    <p style="font-size:14px;line-height:1.6;color:#82796A;margin:0;">
      The code expires in an hour and can only be used once.
    </p>`;
  return { subject: `${token} is your sobr code`, html: shell('Your sign-in code', body) };
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!RESEND_API_KEY) return new Response('RESEND_API_KEY not set', { status: 500 });

  const raw = await req.text();

  // Verify this really came from Supabase Auth before emailing anyone.
  if (!HOOK_SECRET) return new Response('SEND_EMAIL_HOOK_SECRET not set', { status: 500 });
  let payload: HookPayload;
  try {
    const wh = new Webhook(HOOK_SECRET.replace('v1,whsec_', ''));
    payload = wh.verify(raw, Object.fromEntries(req.headers)) as HookPayload;
  } catch {
    return new Response(JSON.stringify({ error: 'invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { token, email_action_type } = payload.email_data;
  const { subject, html } = codeEmail(token, email_action_type === 'signup');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [payload.user.email], subject, html }),
  });

  if (!res.ok) {
    // Returning an error tells Supabase the send failed, so the client sees it
    // rather than silently waiting for mail that never arrives.
    const detail = await res.text();
    return new Response(JSON.stringify({ error: `resend: ${detail}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
});
