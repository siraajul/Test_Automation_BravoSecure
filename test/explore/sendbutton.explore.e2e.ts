import { writeFileSync } from 'node:fs';
import { AuthFlow } from '../../src/mobile/flows/auth.flow';
import MessengerPage from '../../src/mobile/pages/client/messenger.page';
import { byDescContains } from '../../src/helpers/selectors';

function nodes(src: string): string[] {
  const out: string[] = [];
  for (const tag of src.match(/<[a-zA-Z][\w.]*\b[^>]*>/g) ?? []) {
    const cls = tag.match(/^<([\w.]+)/)?.[1] ?? '';
    if (!cls || cls === 'hierarchy') continue;
    const t = /text="([^"]*)"/.exec(tag)?.[1] ?? '';
    const d = /content-desc="([^"]*)"/.exec(tag)?.[1] ?? '';
    const click = /clickable="true"/.test(tag) ? 'CLICK' : '';
    const bounds = /bounds="([^"]*)"/.exec(tag)?.[1] ?? '';
    if (t || d) out.push(`${click.padEnd(5)} t=${JSON.stringify(t).slice(0, 40).padEnd(40)} d=${JSON.stringify(d).slice(0, 24).padEnd(24)} ${bounds} <${cls.split('.').pop()}>`);
  }
  return [...new Set(out)];
}

describe('EXPLORE · Send button', () => {
  it('reveals the send control after typing in a 1:1 thread', async () => {
    await AuthFlow.loginAs('client');
    await MessengerPage.open();
    await browser.pause(1500);
    // Make sure we are on the chat list (not a lingering thread): back out if a thread input is showing.
    for (let i = 0; i < 3; i++) {
      const onList = await $(byDescContains('Compose new message')).isExisting().catch(() => false);
      if (onList) break;
      await driver.back();
      await browser.pause(1000);
    }
    // Open the Bravo System system conversation (safe target).
    await $(byDescContains('Bravo System')).click();
    await browser.pause(1800);
    writeFileSync('./.explore/send_empty.txt', nodes(await driver.getPageSource()).join('\n'), 'utf8');

    const input = $('//android.widget.EditText[contains(@text,"secure message")]');
    await input.setValue('draft-do-not-send');
    await browser.pause(1500);
    writeFileSync('./.explore/send_typed.txt', nodes(await driver.getPageSource()).join('\n'), 'utf8');
    await driver.saveScreenshot('./.explore/send_typed.png').catch(() => undefined);
    console.log('SEND PROBE DONE');
    // Clear the field so nothing is left drafted.
    await input.clearValue().catch(() => undefined);
  });
});
