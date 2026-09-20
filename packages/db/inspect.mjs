import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

const tables = await sql`
  select table_schema, table_name from information_schema.tables
  where table_schema in ('public') order by 1,2`;
console.log('TABLES:', tables.map((t) => t.table_name).join(', '));

for (const t of tables) {
  const cols = await sql`
    select column_name, data_type, is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public' and table_name = ${t.table_name}
    order by ordinal_position`;
  console.log(`\n${t.table_name}:`);
  for (const c of cols)
    console.log(`  ${c.column_name} ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : ''} ${c.column_default ?? ''}`);
}

const users = await sql`select id, email, created_at from auth.users order by created_at`;
console.log('\nAUTH USERS:', JSON.stringify(users, null, 2));

const exts = await sql`select extname from pg_extension order by 1`;
console.log('\nEXTENSIONS:', exts.map((e) => e.extname).join(', '));

const counts = await sql`
  select (select count(*) from daily_entries) as entries,
         (select count(*) from drinks) as drinks,
         (select count(*) from user_settings) as settings,
         (select count(*) from freeze_grants) as grants`;
console.log('\nCOUNTS:', JSON.stringify(counts[0]));

await sql.end();
