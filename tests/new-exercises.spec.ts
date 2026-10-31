import { expect, test } from '@playwright/test';
import { lessons, worlds } from '../src/curriculum';
import { noteName, octave } from '../src/music';

for (const id of [
  'five-up',
  'five-down',
  'scale-up',
  'scale-down',
  'repeats',
  'neighbours',
  'mixed-steps',
  'broken-chords',
  'moving-fifths',
]) {
  const lesson = lessons.find((item) => item.id === id)!;
  test(`${lesson.name} fits and completes with visible names and three-star feedback`, async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto('/');
    await page.getByRole('button', { name: 'Note hunt', exact: true }).click();
    await page
      .getByRole('button', {
        name: lesson.world === 'scales' ? 'Scales' : 'Patterns',
        exact: true,
      })
      .click();
    const button = page.getByRole('button', {
      name: `${worlds.find((world) => world.id === lesson.world)!.name}: ${lesson.name}`,
      exact: true,
    });
    for (let i = 0; i < 10 && !(await button.isVisible()); i++)
      await page.getByRole('button', { name: 'Next lesson page' }).click();
    await button.click();
    const card = page.getByRole('region', {
      name: 'Play this pattern',
      exact: true,
    });
    const score = card.getByRole('img', { name: /^Sheet music:/ });
    for (const [layout, viewport] of [
      ['desktop', { width: 1280, height: 800 }],
      ['phone', { width: 390, height: 844 }],
      ['small-phone', { width: 320, height: 568 }],
      ['landscape', { width: 844, height: 390 }],
    ] as const) {
      await page.setViewportSize(viewport);
      await page.clock.runFor(50);
      await expect(score.locator('svg')).toBeVisible();
      await expect
        .poll(() =>
          card.evaluate((element) => {
            const bounds = element.getBoundingClientRect();
            return (
              document.documentElement.scrollHeight <= innerHeight &&
              document.documentElement.scrollWidth <= innerWidth &&
              [
                ...element.querySelectorAll(
                  'svg,[aria-label$="pattern notes found"] > span',
                ),
              ].every((child) => {
                const rect = child.getBoundingClientRect();
                return (
                  rect.left >= bounds.left &&
                  rect.right <= bounds.right &&
                  rect.top >= bounds.top &&
                  rect.bottom <= bounds.bottom
                );
              })
            );
          }),
        )
        .toBe(true);
      await page.screenshot({ path: `test-results/new-${id}-${layout}.png` });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const length = lesson.patterns![0].length;
    for (
      let shape = 0;
      shape < lesson.patterns!.length * lesson.assessment.repetitions;
      shape++
    ) {
      await expect(
        page.getByLabel(`0 of ${length} pattern notes found`, { exact: true }),
      ).toBeVisible();
      await expect(score.locator('svg')).toBeVisible();
      const label = await score.getAttribute('aria-label');
      const notes = label!
        .match(/Sheet music: ([\d, ]+)/)![1]
        .split(',')
        .map(Number);
      expect(notes).toHaveLength(length);
      for (let index = 0; index < notes.length; index++) {
        const midi = notes[index];
        await page
          .getByRole('button', {
            name: `Play ${noteName(midi)}${octave(midi)}`,
            exact: true,
          })
          .click();
        await expect(
          page.getByLabel(`${index + 1} of ${length} pattern notes found`, {
            exact: true,
          }),
        ).toBeVisible();
      }
      await page.clock.fastForward(1601);
      await page.clock.runFor(50);
    }
    await expect(
      page.getByLabel('This run: 3 of 3 stars', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Lesson complete' }),
    ).toContainText('No mistakes · 💎 +1');
  });
}
