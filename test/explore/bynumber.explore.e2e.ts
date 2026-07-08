import { writeFileSync } from 'node:fs';
import { AuthFlow } from '../../src/mobile/flows/auth.flow';
import MessengerPage from '../../src/mobile/pages/client/messenger.page';
import ChatPage from '../../src/mobile/pages/comms/chat.page';
import { byDescContains, byTextOrDesc } from '../../src/helpers/selectors';

function nodes(src: string): string[] {
  const out: string[] = [];
  for (const tag of src.match(/<[a-zA-Z][\w.]*\b[^>]*>/g) ?? []) {
    const cls = tag.match(/^<([\w.]+)/)?.[1] ?? '';
    if (!cls || cls === 'hierarchy') continue;
    const t = /text="([^"]*)"/.exec(tag)?.[1] ?? '';
    const d = /content-desc="([^"]*)"/.exec(tag)?.[1] ?? '';
    const click = /clickable="true"/.test(tag) ? 'CLICK' : '';
    if (t || d) out.push(`${click.padEnd(5)} t=${JSON.stringify(t).slice(0, 42).padEnd(42)} d=${JSON.stringify(d).slice(0, 36)} <${cls.split('.').pop()}>`);
  }
  return [...new Set(out)];
}
async function dump(label: string): Promise<void> {
  writeFileSync(`./.explore/bynum_${label}.txt`, nodes(await driver.getPageSource()).join('\n'), 'utf8');
  await driver.saveScreenshot(`./.explore/bynum_${label}.png`).catch(() => undefined);
  console.log(`DUMPED ${label}`);
}

const NUM = process.env.PEER_NUMBER ?? '+8801318402075'; // client2 ITSirajul

describe('EXPLORE · Message by Number', () => {
  it('opens the by-number entry and starts a chat', async () => {
    await AuthFlow.loginAs('client');
    await MessengerPage.open();
    await ChatPage.backToList();

    await $(byDescContains('Compose new message')).click();
    await browser.pause(1500);
    await $(byTextOrDesc('Message by Number')).click();
    await browser.pause(1500);
    await dump('entry');

    // Type the number into the only EditText, then dump to find the CTA.
    const input = $('//android.widget.EditText');
    await input.setValue(NUM).catch(() => undefined);
    await browser.pause(1200);
    await dump('typed');
  });
});
