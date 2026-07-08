import { BasePage } from '../base.page';
import { byText, byDescContains } from '../../../helpers/selectors';
import { ClientNav } from './navigation';

/** Client Profile tab (account · security · billing · support). */
class ProfilePage extends BasePage {
  protected get rootLocator(): string {
    return byText('Edit Profile');
  }

  get biometricLockToggle(): ChainablePromiseElement {
    return $(byDescContains('Biometric Lock'));
  }
  get twoFactorAuth(): ChainablePromiseElement {
    return $(byDescContains('Two-Factor Auth'));
  }
  get agentPortal(): ChainablePromiseElement {
    return $(byDescContains('Agent Portal'));
  }
  get logOutButton(): ChainablePromiseElement {
    return $(byDescContains('Log Out'));
  }

  async open(): Promise<void> {
    await ClientNav.go('PROFILE');
    await this.waitUntilActive();
  }

  async logout(): Promise<void> {
    await this.open();
    await this.scrollToLogOut();
    await this.logOutButton.click();
  }

  private async scrollToLogOut(): Promise<void> {
    try {
      await $(
        'android=new UiScrollable(new UiSelector().scrollable(true))' +
          '.scrollIntoView(new UiSelector().descriptionContains("Log Out"))',
      );
    } catch {
      // already visible or not in a scroll container
    }
  }
}

export default new ProfilePage();
