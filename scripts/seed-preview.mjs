// Seeds a preview (or staging) database from the scrubbed production snapshot the control plane
// publishes. Runs in the pre-deploy step after migrations. Production never seeds.
//
// Rules (design doc "Seeding a preview"):
// - Only when this is a preview environment (Render sets IS_PULL_REQUEST=true) or SWARM_SEED=always.
// - Only once per database: a marker table remembers which snapshot was loaded. Later commits to
//   the same change keep their data. The control plane's reseed_preview tool asks for a fresh load.
// - Needs SWARM_URL and SWARM_SEED_TOKEN, which the control plane places on the production service;
//   previews inherit them. Without them the script says so and exits 0 (an empty preview is still a
//   preview).
import { gunzipSync } from 'node:zlib';
import postgres from 'postgres';
import { load } from './lib/snapshot-load.mjs';

const isPreview = process.env.IS_PULL_REQUEST === 'true' || process.env.SWARM_SEED === 'always';
if (!isPreview) {
  console.log('seed-preview: not a preview environment, nothing to do');
  process.exit(0);
}
const url = process.env.DATABASE_URL;
const swarmUrl = process.env.SWARM_URL?.replace(/\/+$/, '');
const token = process.env.SWARM_SEED_TOKEN;
if (!url) {
  console.error('seed-preview: DATABASE_URL is not set');
  process.exit(1);
}
if (!swarmUrl || !token) {
  console.log('seed-preview: SWARM_URL / SWARM_SEED_TOKEN not set; preview starts empty');
  process.exit(0);
}
const headers = {
  authorization: `Bearer ${token}`,
  'x-swarm-environment': process.env.RENDER_SERVICE_NAME ?? 'preview',
};

const sql = postgres(url, { max: 1, prepare: false });
try {
  const info = await fetchJson(`${swarmUrl}/api/seed/info`);
  if (!info?.snapshot) {
    console.log('seed-preview: no scrubbed snapshot published yet; preview starts empty');
    process.exit(0);
  }
  await sql`create table if not exists _swarm_seed (snapshot_id text primary key, seeded_at timestamptz not null default now())`;
  const marks = await sql`select snapshot_id, seeded_at from _swarm_seed order by seeded_at desc limit 1`;
  const last = marks[0];
  const reseedAt = info.reseedRequestedAt ? new Date(info.reseedRequestedAt) : null;
  if (last && !(reseedAt && new Date(last.seeded_at) < reseedAt)) {
    console.log(`seed-preview: already seeded from ${last.snapshot_id}; keeping the data`);
    process.exit(0);
  }

  const res = await fetch(`${swarmUrl}/api/seed/snapshot`, { headers });
  if (!res.ok) throw new Error(`snapshot download failed: ${res.status}`);
  const text = gunzipSync(Buffer.from(await res.arrayBuffer())).toString('utf8');
  const lines = text
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
  const header = lines.find((l) => l.type === 'header');
  const result = await load(sql, lines);
  await sql`delete from _swarm_seed`;
  await sql`insert into _swarm_seed (snapshot_id) values (${info.snapshot.id})`;
  console.log(
    `seed-preview: loaded snapshot ${info.snapshot.id} from ${header?.at ?? '?'}: ` +
      Object.entries(result.loaded)
        .map(([t, n]) => `${t}=${n}`)
        .join(' ') +
      (result.missingTables.length ? ` (not in this schema: ${result.missingTables.join(', ')})` : ''),
  );
} finally {
  await sql.end();
}

async function fetchJson(u) {
  const res = await fetch(u, { headers });
  if (res.status === 401) throw new Error('seed token was not accepted');
  if (!res.ok) throw new Error(`${u} answered ${res.status}`);
  return res.json();
}
