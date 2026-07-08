import { GLYPH } from '../../helpers/glyphs';
import { byDescContains, byResourceId, byText, byTextContains } from '../../helpers/selectors';
import { APP_PACKAGE } from '../../config/capabilities';
import { env } from '../../config/env';

const SYSTEMUI = 'com.android.systemui';

/**
 * Multiremote-aware comms actions. Under WDIO multiremote the page-object
 * singletons (which use the global `$`) hit every device at once, so these
 * helpers take an explicit driver instance (`client`, `client2`, `client3`) and
 * scope every command to it. Locators mirror the confirmed ones in the comms
 * page objects (see `.explore/` dumps + helpers/glyphs.ts).
 */
type Drv = WebdriverIO.Browser;

const MSG_INPUT = '//android.widget.EditText[contains(@text,"secure message")]';
const COMPOSE = byDescContains('Compose new message');

const exists = (d: Drv, sel: string): Promise<boolean> => d.$(sel).isExisting();

export const Comms = {
  async foreground(d: Drv): Promise<void> {
    await d.activateApp(APP_PACKAGE).catch(() => undefined);
    await d.pause(1200);
    await this.passBiometric(d);
  },

  /** Clear the Android biometric gate via the PIN fallback (Pixel only; AVDs have none). */
  async passBiometric(d: Drv): Promise<void> {
    const showing =
      (await d.$(byText('Unlock Bravo Secure')).isExisting()) ||
      (await d.$(byResourceId(`${SYSTEMUI}:id/biometric_icon`)).isExisting());
    if (!showing || !env.devicePin) return;
    const usePin = d.$(byResourceId(`${SYSTEMUI}:id/button_use_credential`));
    await usePin.waitForExist({ timeout: 8000 }).catch(() => undefined);
    if (await usePin.isExisting()) await usePin.click();
    for (const ch of String(env.devicePin)) await d.pressKeyCode(7 + Number(ch));
    await d.pressKeyCode(66);
    await d.pause(1500);
  },

  /** Land on the Messenger conversation list, wherever the app currently is. */
  async gotoChatList(d: Drv): Promise<void> {
    await this.foreground(d);
    for (let i = 0; i < 9; i++) {
      if (await exists(d, COMPOSE)) return; // on the chat list
      if (await exists(d, MSG_INPUT)) {
        await d.back(); // inside a thread → back out
        await d.pause(1000);
        continue;
      }
      // From an "OPEN MESSENGER" restore CTA or a home/service screen, tap in.
      const open = d.$(byDescContains('OPEN MESSENGER'));
      if (await open.isExisting()) {
        await open.click();
        await d.pause(1500);
        continue;
      }
      const messengerTab = d.$(byDescContains('MESSENGER'));
      if (await messengerTab.isExisting()) {
        await messengerTab.click();
        await d.pause(1500);
        continue;
      }
      const service = d.$(byDescContains('Bravo Messenger'));
      if (await service.isExisting()) {
        await service.click();
        await d.pause(1500);
        continue;
      }
      // Unknown screen (compose picker, by-number dialog, settings, sub-app) →
      // back out and retry; re-foreground if back left the app entirely.
      await d.back();
      await d.pause(900);
      if ((await d.getCurrentPackage()) !== APP_PACKAGE) {
        await d.activateApp(APP_PACKAGE).catch(() => undefined);
        await d.pause(1500);
        await this.passBiometric(d);
      }
    }
  },

  async openConversation(d: Drv, title: string): Promise<void> {
    const row = d.$(byDescContains(title));
    await row.waitForDisplayed({ timeout: 12000 });
    await row.click();
    await d.$(MSG_INPUT).waitForDisplayed({ timeout: 12000 });
  },

  /**
   * Start a FRESH 1:1 chat by Bravo number (Compose → Message by Number). This
   * negotiates a clean pairwise E2E session, avoiding the "recipient_mismatch"
   * sealed-sender errors that stale restored sessions produce after a reinstall.
   * Leaves the driver in the open thread (composer visible).
   */
  async startChatByNumber(d: Drv, number: string): Promise<void> {
    await this.gotoChatList(d);
    await d.$(COMPOSE).click();
    await d.pause(1200);
    await d.$('//*[contains(@text,"Message by Number") or contains(@content-desc,"Message by Number")]').click();
    await d.pause(1200);
    // The dialog's number field (hint "+971 50 123 4567"). RN modal inputs often
    // report isDisplayed=false while still accepting setValue, so gate on EXIST,
    // not displayed.
    const input = d.$('//android.widget.EditText');
    await input.waitForExist({ timeout: 12000 });
    await input.setValue(number);
    await d.pause(1000);
    // The "Message" CTA (exact content-desc) appears once a number is entered.
    const cta = d.$('//*[@content-desc="Message"]');
    await cta.waitForExist({ timeout: 6000 });
    await cta.click();
    await d.$(MSG_INPUT).waitForExist({ timeout: 12000 });
  },

  /**
   * Start (or open) a 1:1 chat via the Compose contact picker. The recipient
   * must be saved in this device's address book (its "CONTACTS ON BRAVO" row
   * carries the number in content-desc). Accessible + reliable — unlike the
   * "Message by Number" dialog whose RN input is invisible to UiAutomator2.
   * Leaves the driver in the open thread.
   */
  async startChatWithContact(d: Drv, number: string): Promise<void> {
    await this.gotoChatList(d);
    await d.$(COMPOSE).click();
    await d.pause(1500);
    const row = d.$(byDescContains(number));
    await row.waitForExist({ timeout: 8000 });
    await row.click();
    await d.$(MSG_INPUT).waitForExist({ timeout: 12000 });
    await d.pause(800);
  },

  /** Open the top (most-recent) conversation in the list — where an inbound message lands. */
  async openTopConversation(d: Drv): Promise<void> {
    await this.gotoChatList(d);
    // First clickable conversation row sits just below the "RECENT" header.
    const firstRow = d.$('(//android.view.ViewGroup[@clickable="true"])[3]');
    await firstRow.click();
    await d.$(MSG_INPUT).waitForExist({ timeout: 12000 });
  },

  async sendMessage(d: Drv, text: string): Promise<void> {
    const input = d.$(MSG_INPUT);
    await input.waitForDisplayed({ timeout: 12000 });
    await input.setValue(text);
    const send = d.$(byDescContains(GLYPH.send));
    await send.waitForDisplayed({ timeout: 6000 });
    await send.click();
  },

  async expectMessage(d: Drv, text: string, timeoutMs = 25000): Promise<boolean> {
    return d
      .$(byTextContains(text))
      .waitForDisplayed({ timeout: timeoutMs })
      .then(() => true)
      .catch(() => false);
  },

  /* ---- calls ---- */

  async startAudioCall(d: Drv): Promise<void> {
    const btn = d.$(byDescContains(GLYPH.audioCall));
    await btn.waitForDisplayed({ timeout: 10000 });
    await btn.click();
  },

  async startVideoCall(d: Drv): Promise<void> {
    const btn = d.$(byDescContains(GLYPH.videoCall));
    await btn.waitForDisplayed({ timeout: 10000 });
    await btn.click();
  },

  /** Caller sees "CALLING…" while ringing. */
  async isRinging(d: Drv, timeout = 15000): Promise<boolean> {
    return d
      .$(byTextContains('CALLING'))
      .waitForDisplayed({ timeout })
      .then(() => true)
      .catch(() => false);
  },

  /** Receiver: an incoming-call screen appears with an accept affordance. */
  async waitForIncoming(d: Drv, timeout = 20000): Promise<boolean> {
    return d
      .$('//*[contains(@text,"Accept") or contains(@content-desc,"Accept") or contains(@text,"INCOMING") or contains(@text,"WEBRTC")]')
      .waitForDisplayed({ timeout })
      .then(() => true)
      .catch(() => false);
  },
};
