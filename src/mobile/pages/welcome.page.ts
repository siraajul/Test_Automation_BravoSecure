import { BasePage } from './base.page';
import { byAccessibilityId, byDescContains } from '../../helpers/selectors';

/** First screen for a logged-out user: "Welcome to Bravo". */
class WelcomePage extends BasePage {
  protected get rootLocator(): string {
    return byDescContains('Sign In');
  }

  get signInButton(): ChainablePromiseElement {
    return $(byAccessibilityId('Sign In'));
  }

  async goToSignIn(): Promise<void> {
    await this.waitUntilActive();
    await this.signInButton.click();
  }
}

export default new WelcomePage();
