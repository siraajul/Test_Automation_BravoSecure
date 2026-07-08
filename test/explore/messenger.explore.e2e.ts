import { writeFileSync } from 'node:fs';
import { AuthFlow } from '../../src/mobile/flows/auth.flow';
import MessengerPage from '../../src/mobile/pages/client/messenger.page';
import { byDescContains, byText } from '../../src/helpers/selectors';

/**
 * LIVE EXPLORATION (not a real test) — dumps the Messenger CALL / GROUPS / thread
 * screens. The app reopens the LAST conversation, so we normalise to the chat
 * list first, then drive the bottom sub-nav (CHAT·GROUPS·CALL·FILES·NEWS).
 *   ANDROID_DEVICE=<pixel> npx wdio run ./wdio.conf.ts --spec ./test/explore/messenger.explore.e2e.ts
 */
function nodes(src: string): string[] {
  const out: string[] = [];
  for (const tag of src.match(/<[a-zA-Z][\w.]*\b[^>]*>/g) ?? []) {
    const cls = tag.match(/^<([\w.]+)/)?.[1] ?? '';
    if (!cls || cls === 'hierarchy') continue;
    const t = /text="([^"]*)"/.exec(tag)?.[1] ?? '';
    const d = /content-desc="([^"]*)"/.exec(tag)?.[1] ?? '';
    const id = /resource-id="([^"]*)"/.exec(tag)?.[1] ?? '';
    const click = /clickable="true"/.test(tag) ? 'CLICK' : '';
    if (t || d || id) {
      out.push(
        `${click.padEnd(5)} t=${JSON.stringify(t).slice(0, 44).padEnd(44)} d=${JSON.stringify(d).slice(0, 44).padEnd(44)} id=${id} <${cls.split('.').pop()}>`,
      );
    }
  }
  return [...new Set(out)];
}

async function dump(label: string): Promise<void> {
  const src = await driver.getPageSource();
  writeFileSync(`./.explore/explore_${label}.txt`, nodes(src).join('\n'), 'utf8');
  console.log(`DUMPED ${label}: ${nodes(src).length} nodes`);
  await driver.saveScreenshot(`./.explore/explore_${label}.png`).catch(() => undefined);
}

/** A chat thread shows a message EditText; the list does not. Back out to the list. */
async function ensureChatList(): Promise<void> {
  for (let i = 0; i < 3; i++) {
    const inThread = await $('//android.widget.EditText[contains(@text,"secure message")]').isExisting();
    const hasList = await $(byText('RECENT · 8')).isExisting().catch(() => false);
    if (!inThread || hasList) return;
    await driver.back();
    await browser.pause(1200);
  }
}

async function tapSubNav(tab: string): Promise<void> {
  // Bottom sub-nav entries expose content-desc "<glyph>, CHAT" etc.
  await $(byDescContains(`, ${tab}`)).click().catch(async () => {
    await $(byDescContains(tab)).click().catch(() => undefined);
  });
  await browser.pause(1500);
}

describe('EXPLORE · Messenger CALL/GROUPS/threads', () => {
  it('dumps call, groups, dm thread (typed), group thread', async () => {
    await AuthFlow.loginAs('client');
    await MessengerPage.open();
    await browser.pause(1500);
    await ensureChatList();
    await dump('v2_chatlist');

    // CALL tab
    await tapSubNav('CALL');
    await dump('v2_call');

    // GROUPS tab
    await tapSubNav('GROUPS');
    await dump('v2_groups');

    // Back to CHAT, open a 1:1 ("Sirajul Islam" = · DEV), type a message to reveal Send.
    await tapSubNav('CHAT');
    await browser.pause(800);
    await $(byDescContains('Sirajul Islam')).click().catch(() => undefined);
    await browser.pause(1800);
    await dump('v2_thread_dm');
    const input = $('//android.widget.EditText[contains(@text,"secure message")]');
    await input.setValue('explore-ping').catch(() => undefined);
    await browser.pause(1200);
    await dump('v2_thread_typed'); // Send button should now be visible

    // Open a GROUP ("Test Team") to capture member/admin controls (header → details).
    await ensureChatList();
    await $(byDescContains('Test Team')).click().catch(() => undefined);
    await browser.pause(1800);
    await dump('v2_thread_group');
    // Open the group header to reach the group-info / admin screen.
    await $(byDescContains('Test Team')).click().catch(() => undefined);
    await browser.pause(1800);
    await dump('v2_group_info');
  });
});
