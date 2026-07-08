import { Comms } from '../../../src/mobile/flows/comms.mr';

/**
 * E2E — a composed message actually RENDERS in the conversation thread (the
 * B-18 class: "decrypts but never renders"). Single already-authenticated
 * device (noReset persists the login) — no login UI.
 *
 *   ANDROID_DEVICE=emulator-5554 \
 *     npx wdio run ./wdio.conf.ts --spec ./test/mobile/e2e/message.render.e2e.ts
 */
const APP = 'com.bravosecure.app';
const MSG_INPUT = '//android.widget.EditText[contains(@text,"secure message")]';

/** Robustly open the Shirajul conversation — by NAME, backing out of any
 *  modal/tier upsell (positional row-clicks land on the wrong card). */
async function openShirajulChat(): Promise<void> {
  await driver.activateApp(APP);
  await driver.pause(1500);
  for (let i = 0; i < 8; i++) {
    if (await driver.$(MSG_INPUT).isExisting()) return; // already in a thread
    const chatRow = driver.$('android=new UiSelector().textContains("Shirajul")');
    if (await chatRow.isExisting()) {
      await chatRow.click();
      await driver.pause(1500);
      continue;
    }
    const messengerTab = driver.$('android=new UiSelector().descriptionContains("MESSENGER")');
    if (await messengerTab.isExisting()) {
      await messengerTab.click();
      await driver.pause(1500);
      continue;
    }
    const service = driver.$('android=new UiSelector().descriptionContains("Bravo Messenger")');
    if (await service.isExisting()) {
      await service.click();
      await driver.pause(1500);
      continue;
    }
    // unknown screen (tier/modal) → back out, re-foreground if we left the app
    await driver.back();
    await driver.pause(1000);
    if ((await driver.getCurrentPackage()) !== APP) {
      await driver.activateApp(APP);
      await driver.pause(1500);
    }
  }
  throw new Error('could not reach the Shirajul conversation');
}

describe('E2E · message renders in thread', () => {
  it('opens a conversation, sends a message, and sees it render on screen', async () => {
    const marker = `e2e-render ${Date.now()}`;

    await openShirajulChat();
    await Comms.sendMessage(driver, marker);

    const rendered = await Comms.expectMessage(driver, marker, 20000);
    await driver.saveScreenshot('./.explore/e2e_render.png').catch(() => undefined);

    expect(rendered).toBe(true);
  });
});
