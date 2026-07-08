import { writeFileSync } from 'node:fs';
import { Comms } from '../../src/mobile/flows/comms.mr';
import { byDescContains } from '../../src/helpers/selectors';

/**
 * Explore an AVD's compose contact-picker (no login — navigate from current
 * state). Confirms the "CONTACTS ON BRAVO" rows are accessible + tappable.
 *   ANDROID_DEVICE=emulator-5556 npx wdio run ./wdio.conf.ts --spec ./test/explore/avdpicker.explore.e2e.ts
 */
function nodes(src: string): string[] {
  const out: string[] = [];
  for (const tag of src.match(/<[a-zA-Z][\w.]*\b[^>]*>/g) ?? []) {
    const cls = tag.match(/^<([\w.]+)/)?.[1] ?? '';
    if (!cls || cls === 'hierarchy') continue;
    const t = /text="([^"]*)"/.exec(tag)?.[1] ?? '';
    const d = /content-desc="([^"]*)"/.exec(tag)?.[1] ?? '';
    const click = /clickable="true"/.test(tag) ? 'CLICK' : '';
    if (t || d) out.push(`${click.padEnd(5)} t=${JSON.stringify(t).slice(0, 40).padEnd(40)} d=${JSON.stringify(d).slice(0, 40)} <${cls.split('.').pop()}>`);
  }
  return [...new Set(out)];
}

describe('EXPLORE · AVD compose picker', () => {
  it('opens compose and dumps the contact rows', async () => {
    await Comms.gotoChatList(browser as unknown as WebdriverIO.Browser);
    await $(byDescContains('Compose new message')).click();
    await browser.pause(2000);
    writeFileSync('./.explore/avd_picker.txt', nodes(await driver.getPageSource()).join('\n'), 'utf8');
    await driver.saveScreenshot('./.explore/avd_picker.png').catch(() => undefined);
    console.log('DUMPED avd_picker');
  });
});
