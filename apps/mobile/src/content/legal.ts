/**
 * Privacy policy + terms, as data so the in-app screens and any future web
 * page render the same text. Written to match what the code actually does;
 * if data handling changes (new processor, analytics, anything), update this
 * in the same commit. Review before each store submission (DEPLOY.md).
 */

export const LEGAL_UPDATED = '25 September 2026';
export const LEGAL_CONTACT_URL = 'https://github.com/gcsandesh/sobr/issues';

export type LegalSection = { heading: string; body: string[] };

export const PRIVACY: LegalSection[] = [
  {
    heading: 'The short version',
    body: [
      'sobr keeps what you log private to your account. We don’t sell it, we don’t use it for advertising, and we don’t run analytics on it. You can delete all of it at any time.',
    ],
  },
  {
    heading: 'What we store',
    body: [
      'Your email address and a password (stored hashed by our authentication provider, never readable by us).',
      'An optional display name.',
      'What you check in: each day’s status, anything you log for it, optional costs, optional notes, and photos you choose to attach.',
      'Your preferences: what counts as a win, daily limit, currency, time zone, and email settings.',
    ],
  },
  {
    heading: 'How it’s protected',
    body: [
      'Data is stored with Supabase (a hosted Postgres database). Every table uses row-level security, so your account can only ever read or change its own rows. Photos sit in a private storage bucket and are only shown through short-lived signed links.',
      'Data is encrypted in transit (HTTPS) and at rest by our hosting provider.',
    ],
  },
  {
    heading: 'Who else processes it',
    body: [
      'Supabase hosts the database, authentication and photo storage.',
      'Resend delivers the emails you opt into (sign-in and reset codes, the daily reminder, and the weekly summary). Those emails contain only your own numbers.',
      'No analytics, advertising or tracking SDKs are included in the app.',
    ],
  },
  {
    heading: 'Notifications',
    body: [
      'Check-in and motivation notifications are scheduled on your device. Their timing and content never leave your phone.',
    ],
  },
  {
    heading: 'Your choices',
    body: [
      'Turn emails off any time in Settings → Email.',
      'Delete your account in Settings → Account. This permanently erases your account, every logged day, notes and photos. There is no backup copy kept.',
    ],
  },
  {
    heading: 'Children',
    body: ['sobr is intended for adults (18+) and isn’t directed at children.'],
  },
  {
    heading: 'Changes and contact',
    body: [
      'If this policy changes, the date above changes with it, and meaningful changes will be shown in the app.',
      'Questions or requests: open an issue on the project page linked below.',
    ],
  },
];

export const TERMS: LegalSection[] = [
  {
    heading: 'Using sobr',
    body: [
      'sobr is a personal habit companion. By creating an account you agree to use it for yourself, keep your password safe, and not misuse the service (for example, trying to access other people’s data or overload it).',
      'You need to be 18 or older to use sobr.',
    ],
  },
  {
    heading: 'Not medical advice',
    body: [
      'sobr is not a medical device and doesn’t provide medical, psychological or addiction treatment. Numbers such as units are estimates. If you have concerns about your health, or you drink heavily and want to stop, talk to a qualified professional first, as stopping suddenly can be risky.',
      'If you’re in danger or crisis, contact local emergency services. The Support screen lists some starting points.',
    ],
  },
  {
    heading: 'Your content',
    body: [
      'What you log belongs to you. You give sobr only the permission needed to store it and show it back to you. You can delete it at any time.',
    ],
  },
  {
    heading: 'Availability',
    body: [
      'sobr is provided “as is”. We work to keep it running and your data safe, but can’t promise it will always be available or error-free, and aren’t liable for indirect losses from using it, to the extent the law allows.',
    ],
  },
  {
    heading: 'Changes',
    body: [
      'These terms may be updated; the date above will change when they are. Continuing to use sobr after a change means you accept the new terms. You can stop using sobr and delete your account at any time.',
    ],
  },
];
