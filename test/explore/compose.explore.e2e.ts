import { writeFileSync } from 'node:fs';
import { AuthFlow } from '../../src/mobile/flows/auth.flow';
import MessengerPage from '../../src/mobile/pages/client/messenger.page';
import ChatPage from '../../src/mobile/pages/comms/chat.page';
import { byDescContains } from '../../src/helpers/selectors';

function nodes(src: string): string[] {
  const out: string[] = [];
  for (const tag of src.match(/<[a-zA-Z][\w.]*\b[^>]*>/g) ?? []) {
    const cls = tag.match(/^<([\w.]+)/)?.[1] ?? '';
    if (!cls || cls === 'hierarchy') continue;
    const t = /text="([^"]*)"/.exec(tag)?.[1] ?? '';
    const d = /content-desc="([^"]*)"/.exec(tag)?.[1] ?? '';
    const click = /clickable="true"/.test(tag) ? 'CLICK' : '';
    if (t || d) out.push(`${click.padEnd(5)} t=${JSON.stringify(t).slice(0, 40).padEnd(40)} d=${JSON.stringify(d).slice(0, 40)}`);
  }
  return [...new Set(out)];
}
async function dump(label: string): Promise<void> {
  writeFileSync(`./.explore/compose_${label}.txt`, nodes(await driver.getPageSource()).join('\n'), 'utf8');
  await driver.saveScreenshot(`./.explore/compose_${label}.png`).catch(() => undefined);
  console.log(`DUMPED ${label}`);
}

describe('EXPLORE · compose (pencil) flow', () => {
  it('opens the compose picker and dumps it', async () => {
    await AuthFlow.loginAs('client');
    await MessengerPage.open();
    await ChatPage.backToList();
    await dump('list');

    await $(byDescContains('Compose new message')).click();
    await browser.pause(2000);
    await dump('picker');

    // Tap a contact (ITSirajul) if the picker exposes it.
    const c = $(byDescContains('ITSirajul'));
    if (await c.isExisting()) {
      await c.click();
      await browser.pause(2000);
      await dump('after_pick');
    } else {
      console.log('ITSirajul not directly in picker');
    }
  });
});
