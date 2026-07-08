import type { Page } from '@playwright/test';

/**
 * Admin "Bravo Ops Console" login — verified at ADMIN_URL.
 * Two-step, phone-based with OTP (2FA):
 *   1. Phone (E.164) + Password → CONTINUE
 *   2. "OTP sent to <phone>" → One-time code → SIGN IN
 *
 * ⚠ The OTP is sent by SMS to the admin phone. For automation it must be
 *   supplied at runtime (an SMS/API fetch, a fixed test code, or manual entry).
 */
export class AdminLoginPage {
  constructor(private readonly page: Page) {}

  goto(url: string) {
    return this.page.goto(url);
  }

  /** Step 1: submit phone + password to trigger the OTP. */
  async submitCredentials(phone: string, password: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Phone (E.164)' }).fill(phone);
    await this.page.getByRole('textbox', { name: 'Password' }).fill(password);
    await this.page.getByRole('button', { name: 'CONTINUE' }).click();
    await this.page.getByText(/OTP sent/i).waitFor();
  }

  /** Step 2: enter the one-time code and finish sign-in. */
  async submitOtp(code: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'One-time code' }).fill(code);
    await this.page.getByRole('button', { name: 'SIGN IN' }).click();
  }

  /** Full login. `otp` must be provided by the caller (SMS/API/manual). */
  async login(phone: string, password: string, otp: string): Promise<void> {
    await this.submitCredentials(phone, password);
    await this.submitOtp(otp);
  }
}
