import { BasePage } from './base.page';
import { byAccessibilityId, editTextAt } from '../../helpers/selectors';

/**
 * Sign-in form ("Welcome back / Sign in to your Bravo Secure account").
 * The email/password fields are unlabelled RN EditTexts, located by order:
 * [1] = email (password=false), [2] = password (password=true).
 */
class LoginPage extends BasePage {
  protected get rootLocator(): string {
    return byAccessibilityId('Sign in');
  }

  get emailField(): ChainablePromiseElement {
    return $(editTextAt(1));
  }
  get passwordField(): ChainablePromiseElement {
    return $(editTextAt(2));
  }
  get submitButton(): ChainablePromiseElement {
    return $(byAccessibilityId('Sign in'));
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.waitUntilActive();
    await this.emailField.setValue(email);
    await this.passwordField.setValue(password);
    await this.submitButton.click();
  }

  /** True while still on the sign-in form (used to assert auth success/failure). */
  async isOnLoginForm(): Promise<boolean> {
    return this.submitButton.isExisting();
  }
}

export default new LoginPage();
