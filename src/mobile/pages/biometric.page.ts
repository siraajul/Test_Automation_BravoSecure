import { BasePage } from './base.page';
import { byResourceId, byText } from '../../helpers/selectors';

const SYSTEMUI = 'com.android.systemui';

/**
 * Android BiometricPrompt gate ("Unlock Bravo Secure"). A real fingerprint
 * cannot be injected on a physical device, so we drive the "Use PIN" fallback
 * and enter the device PIN via keycodes (KEYCODE_0..9 == 7..16) — no insecure
 * `adb_shell` Appium feature required. Verified live on the Pixel 7a.
 */
class BiometricPage extends BasePage {
  protected get rootLocator(): string {
    return byResourceId(`${SYSTEMUI}:id/biometric_icon`);
  }

  get usePinButton(): ChainablePromiseElement {
    return $(byResourceId(`${SYSTEMUI}:id/button_use_credential`));
  }

  async isShowing(): Promise<boolean> {
    return (await $(byText('Unlock Bravo Secure')).isExisting()) || (await this.root.isExisting());
  }

  /**
   * Handle the biometric gate if present. Returns true if it was handled.
   */
  async unlockWithPin(pin: string): Promise<boolean> {
    if (!pin) throw new Error('DEVICE_PIN is not set in credentials.env');
    if (!(await this.isShowing())) return false;

    await this.usePinButton.waitForExist({ timeout: 10000 });
    await this.usePinButton.click();

    for (const ch of String(pin)) {
      await driver.pressKeyCode(7 + Number(ch)); // KEYCODE_0 == 7
    }
    await driver.pressKeyCode(66); // KEYCODE_ENTER
    return true;
  }
}

export default new BiometricPage();
