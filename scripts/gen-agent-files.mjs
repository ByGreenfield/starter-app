// Generates CLAUDE.md and AGENTS.md from agent-instructions.md so Claude Code and Codex read the
// same rules. Run with `pnpm gen:agents`; CI fails if the generated files are stale (`--check`).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const source = readFileSync(new URL('../agent-instructions.md', import.meta.url), 'utf8');
const banner = (target) =>
  `<!-- Generated from agent-instructions.md by scripts/gen-agent-files.mjs. Edit the source, then run pnpm gen:agents. (${target}) -->\n\n`;

// create-next-app's `next dev` appends a managed block to AGENTS.md; keep it if present.
function preservedBlock(path) {
  if (!existsSync(path)) return '';
  const current = readFileSync(path, 'utf8');
  const m = /<!-- BEGIN:nextjs-agent-rules -->[\s\S]*?<!-- END:nextjs-agent-rules -->/.exec(current);
  return m ? `\n${m[0]}\n` : '';
}

const targets = {
  'CLAUDE.md': banner('CLAUDE.md') + source,
  'AGENTS.md': banner('AGENTS.md') + source + preservedBlock(new URL('../AGENTS.md', import.meta.url)),
};

const check = process.argv.includes('--check');
let stale = false;
for (const [name, content] of Object.entries(targets)) {
  const path = new URL(`../${name}`, import.meta.url);
  const current = existsSync(path) ? readFileSync(path, 'utf8') : '';
  if (current !== content) {
    stale = true;
    if (!check) writeFileSync(path, content);
  }
}
if (check && stale) {
  console.error('CLAUDE.md / AGENTS.md are out of date. Run: pnpm gen:agents');
  process.exit(1);
}
console.log(check ? 'agent files up to date' : 'agent files generated');
