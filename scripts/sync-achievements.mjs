// Oyun bilgi dosyalarındaki başarım listesini Supabase `achievements` tablosu için SQL'e çevirir.
// `npm run sync:achievements` → çıktıyı Supabase SQL editöründe (ya da MCP execute_sql ile) çalıştır.
// Sadece ekler/günceller; içerikten silinen başarımları SİLMEZ (silmek oyuncuların açtığı rozetleri de siler).
import { readdir, readFile } from 'node:fs/promises';
import { parse } from 'yaml';

const dir = new URL('../src/content/games/', import.meta.url);
const files = (await readdir(dir)).filter((f) => f.endsWith('.md')).sort();
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

const rows = [];
for (const file of files) {
  const text = await readFile(new URL(file, dir), 'utf8');
  const data = parse(text.split(/^---\s*$/m)[1] ?? '') ?? {};
  if (data.draft) continue; // taslak oyunların başarımları yayına çıkınca eklenir
  const slug = file.replace(/\.md$/, '');
  for (const a of data.achievements ?? []) {
    rows.push(`  (${q(slug)}, ${q(a.id)}, ${q(a.tier ?? 'common')}, ${a.hidden ? 'true' : 'false'})`);
  }
}

if (rows.length === 0) {
  console.error('Yayında başarımı olan oyun yok.');
  process.exit(1);
}

console.log(`insert into public.achievements (game_id, id, tier, hidden) values
${rows.join(',\n')}
on conflict (game_id, id) do update set tier = excluded.tier, hidden = excluded.hidden;`);
