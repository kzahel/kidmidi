import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const checker = fileURLToPath(
  new URL('../scripts/styles.mjs', import.meta.url),
);

test('style checks reject dead, misspelled and unscoped CSS and keep exact typings fresh', async () => {
  const directory = await mkdtemp(
    path.join(tmpdir(), 'kidmidi-style-contract-'),
  );
  try {
    await mkdir(path.join(directory, 'src', 'components'), { recursive: true });
    const css = path.join(directory, 'src', 'components', 'Card.module.css');
    const component = path.join(directory, 'src', 'components', 'Card.tsx');
    const run = (...args: string[]) =>
      spawnSync(process.execPath, [checker, ...args], {
        cwd: directory,
        encoding: 'utf8',
      });
    await writeFile(css, '.card { color: green; }');
    await writeFile(
      component,
      "import styles from './Card.module.css'; export const card = styles.card;",
    );
    assert.equal(run('--write').status, 0);
    assert.equal(run().status, 0);
    await writeFile(css, '.card { color: green; } .forgotten { color: red; }');
    let result = run();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unused class forgotten/);
    assert.match(result.stderr, /styles:write/);
    await writeFile(
      css,
      'button { color: red; } :not(.card) button { color: green; }',
    );
    result = run();
    assert.match(result.stderr, /unscoped selector button/);
    assert.match(result.stderr, /unscoped selector :not/);
    await writeFile(css, '.card { color: green; }');
    await writeFile(
      component,
      "import styles from './Card.module.css'; export const card = styles.typo;",
    );
    assert.match(run().stderr, /has no class typo/);
    await writeFile(
      component,
      "import styles from './Card.module.css'; const key = 'card'; export const card = styles[key];",
    );
    assert.match(run().stderr, /static class names/);
    await writeFile(
      component,
      "import styles from './Card.module.css'; const copy = styles; export const card = copy.card;",
    );
    assert.match(run().stderr, /cannot be aliased/);
    await writeFile(
      path.join(directory, 'src', 'global.css'),
      'body { color: red; }',
    );
    assert.match(run().stderr, /stylesheets must be CSS Modules/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
