import { BasePage } from './base.page';
import { byAccessibilityId, ANY_EDIT_TEXT } from '../../helpers/selectors';

/**
 * "RESTORE BACKUP" screen (argon2id-encrypted chat history).
 * WARNING: 5 wrong attempts triggers a 1-hour cooldown — only ever submit a
 * password we are confident about, and only when the screen is present.
 */
class RestoreBackupPage extends BasePage {
  protected get rootLocator(): string {
    return byAccessibilityId('RESTORE');
  }

  get backupPasswordField(): ChainablePromiseElement {
    return $(ANY_EDIT_TEXT);
  }
  get restoreButton(): ChainablePromiseElement {
    return $(byAccessibilityId('RESTORE'));
  }

  /**
   * Start the restore if the screen is present. Waits for the screen to render
   * (it appears a beat after login), fills the password, and taps RESTORE. Does
   * NOT block on the multi-minute restore completing — see `waitForComplete`.
   * Returns false (no-op) if the restore screen never appears.
   */
  async restore(backupPassword: string): Promise<boolean> {
    const appeared = await browser
      .waitUntil(() => this.restoreButton.isExisting(), { timeout: 15000, interval: 700 })
      .then(() => true)
      .catch(() => false);
    if (!appeared) return false;

    await this.backupPasswordField.setValue(backupPassword);
    await browser.pause(400);
    await this.restoreButton.click();
    return true;
  }

  /** "Restoring your messages…" can take minutes; this waits for the CTA. */
  get openMessengerButton(): ChainablePromiseElement {
    return $('android=new UiSelector().descriptionContains("OPEN MESSENGER")');
  }

  async waitForComplete(timeout = 300000): Promise<boolean> {
    try {
      await this.openMessengerButton.waitForExist({ timeout, interval: 2000 });
      await this.openMessengerButton.click();
      return true;
    } catch {
      return false;
    }
  }
}

export default new RestoreBackupPage();
