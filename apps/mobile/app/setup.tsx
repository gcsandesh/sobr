import { Screen, Txt, Card } from '../src/components/ui';

/** Shown until EXPO_PUBLIC_SUPABASE_* are configured. Keeps the app explorable. */
export default function Setup() {
  return (
    <Screen scroll>
      <Txt variant="title" className="mt-10 mb-2">
        Almost there
      </Txt>
      <Txt variant="bodyMuted" className="mb-6">
        sobr needs your own private backend before it can hold your data. This takes a couple of
        minutes and keeps everything yours.
      </Txt>
      <Card className="gap-3">
        <Txt variant="heading">1 · Create a Supabase project</Txt>
        <Txt variant="bodyMuted">It’s free. Then open the SQL editor.</Txt>
        <Txt variant="heading" className="mt-2">
          2 · Run the schema
        </Txt>
        <Txt variant="bodyMuted">
          Paste <Txt variant="body">packages/db/migrations/0000_init.sql</Txt> and run it.
        </Txt>
        <Txt variant="heading" className="mt-2">
          3 · Add your keys
        </Txt>
        <Txt variant="bodyMuted">
          Copy <Txt variant="body">.env.example</Txt> to <Txt variant="body">.env</Txt> and fill in
          your Supabase URL + anon key, then restart.
        </Txt>
      </Card>
    </Screen>
  );
}
