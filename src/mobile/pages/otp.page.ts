import { BasePage } from './base.page';
import { byDescContains, byTextOrDesc, ANY_EDIT_TEXT } from '../../helpers/selectors';

/**
 * Login OTP / verification-code step.
 *
 * Staging accepts ANY 4–8 digit code (Twilio is stubbed), so we submit a fixed
 * one. Handles both common RN layouts: N separate digit boxes, or a single
 * field. A real (prod) env would source the code from an SMS/email inbox.
 *
 * ⚠ CONFIRM ON DEVICE: the rootLocator word ("code") and the verify-button
 * label are best-effort until dumped live (`bash scripts/dump.sh otp`).
 */
class OtpPage extends BasePage {
  protected get rootLocator(): string {
    // Verification screens almost always carry the word "code" / "verification".
    return byTextOrDesc('code');
  }

  /** True if the OTP screen is showing (word match OR a verify affordance). */
  async isShowing(timeout = 8000): Promise<boolean> {
    if (await this.isActive(timeout).catch(() => false)) return true;
    for (const label of ['Verify', 'Confirm', 'Continue']) {
      if (await this.exists(byDescContains(label))) return true;
    }
    return false;
  }

  /** Enter the code across however many boxes exist, then submit if there's a button. */
  async enterCode(code: string): Promise<void> {
    const boxes = await $$(ANY_EDIT_TEXT);
    const n = await boxes.length;
    if (n >= code.length) {
      // one digit per box
      for (let i = 0; i < code.length; i++) {
        await boxes[i].setValue(code[i]);
      }
    } else if (n >= 1) {
      // a single field for the whole code
      await boxes[0].setValue(code);
    }
    // Many OTP screens auto-advance on the last digit; click a button if present.
    for (const label of ['Verify', 'Confirm', 'Continue', 'Submit', 'Next']) {
      const btn = $(byDescContains(label));
      if (await btn.isExisting()) {
        await btn.click();
        break;
      }
    }
  }
}

export default new OtpPage();
