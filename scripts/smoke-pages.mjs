import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium, expect } from '@playwright/test';

// Exercise the actual built bundle under its GitHub project Pages prefix.
const prefix = process.env.KIDMIDI_BASE_PATH ?? '/kidmidi/';
const origin = 'http://127.0.0.1:5175';
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '5175',
    '--strictPort',
  ],
  {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, KIDMIDI_BASE_PATH: prefix },
  },
);
let output = '';
server.stdout.on('data', (data) => {
  output += data;
});
server.stderr.on('data', (data) => {
  output += data;
});
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Preview exited: ${output}`);
    try {
      ready = (await fetch(`${origin}${prefix}`)).ok;
    } catch {
      /* Wait for startup. */
    }
    if (ready) break;
    await delay(100);
  }
  assert.ok(ready, `Preview did not start: ${output}`);
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(`${origin}${prefix}`);
  await page.getByRole('button', { name: 'Play a song', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Räge-Rägetröpfli', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Räge-Rägetröpfli', exact: true })
    .click();
  await expect(page.locator('[class*="__score__"]')).toContainText('tröpf');
  await page.locator('[class*="__options__"] summary').click();
  const photoUrl = await page
    .getByRole('link', { name: 'Book photo ↗' })
    .getAttribute('href');
  assert.equal(photoUrl, `${prefix}book/rain-source.jpg`);
  const photo = await page.request.get(new URL(photoUrl, origin).href);
  assert.ok(photo.ok());
  assert.match(photo.headers()['content-type'], /image\/jpeg/);
  const scoreUrl = await page
    .getByRole('link', { name: 'MusicXML ↓' })
    .getAttribute('href');
  assert.equal(scoreUrl, `${prefix}scores/raege-raegetroepfli.musicxml`);
  const score = await page.request.get(new URL(scoreUrl, origin).href);
  assert.ok(score.ok());
  assert.match(await score.text(), /<fifths>2<\/fifths>/);
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.getByRole('button', { name: 'Just explore', exact: true }).click();
  await expect(page.locator('[class*="__explore-score__"] svg')).toBeVisible();
  await page.getByRole('button', { name: 'Play C4', exact: true }).click();
  await expect(
    page.locator('[class*="__explore-score__"] [class*="__live-hit__"]'),
  ).toHaveCount(1);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  assert.deepEqual(errors, []);
  console.log(
    `Built Pages bundle, notation, illustration, MusicXML and Explore recording passed at ${prefix}`,
  );
} finally {
  await browser?.close();
  if (server.exitCode === null) {
    const exited = new Promise((resolve) => server.once('exit', resolve));
    server.kill('SIGTERM');
    await exited;
  }
}
