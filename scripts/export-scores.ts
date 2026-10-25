import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { musicXml } from '../src/music';
import { rainSong } from '../src/rain';

const destination = fileURLToPath(
  new URL('../public/scores/raege-raegetroepfli.musicxml', import.meta.url),
);
const score = `${musicXml(rainSong.phrases.flat(), rainSong)}\n`;
if (process.argv.includes('--check')) {
  if (readFileSync(destination, 'utf8') !== score) {
    throw new Error(
      'The downloadable score is stale. Run npm run scores:export.',
    );
  }
} else {
  writeFileSync(destination, score);
}
