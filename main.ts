// Foghorn Galley, an entry for make.fun's "Make the best cooking game" bounty (Node 22, standard
// library only). The game is game/: plain static files a desktop browser loads offline. This
// program hands it in: it copies game/ and screenshots/ to the output directory and writes
// dossier.json, the summary the judge reads, with the kit's library.
//
// Play it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repository = fileURLToPath(new URL('.', import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** The gate's own caps; only the text cap shapes the dossier's bytes. */
const GATE_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function handInFolder(name: string): void {
  mkdirSync(join(output, name), { recursive: true });
  cpSync(join(repository, name), join(output, name), { recursive: true });
}

mkdirSync(output, { recursive: true });
handInFolder('game');
handInFolder('screenshots');
writeFileSync(join(output, 'dossier.json'), buildDossier(output, GATE_CAPS));
