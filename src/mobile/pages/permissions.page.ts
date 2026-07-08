import { BasePage } from './base.page';
import { byDescContains, byText } from '../../helpers/selectors';

/**
 * Post-login "Allow access" onboarding (Location*, Contacts, Notifications,
 * Camera, Mic). Best-effort: taps "Allow all" if present, then accepts any
 * native Android permission dialogs. Skipped automatically once granted.
 */
class PermissionsPage extends BasePage {
  protected get rootLocator(): string {
    return byText('Allow access');
  }

  async grantIfPresent(): Promise<boolean> {
    if (!(await this.exists(this.rootLocator))) return false;

    // The onboarding screen drives one native permission dialog per tap of
    // "Continue" (Location is REQUIRED). Keep advancing + accepting until the
    // "Allow access" screen is gone, or we run out of patience.
    for (let step = 0; step < 8; step++) {
      if (!(await this.exists(this.rootLocator))) return true;

      const cont = $(byDescContains('Continue'));
      if (await cont.isExisting()) {
        await cont.click();
        await browser.pause(900);
      } else if (await this.exists(byDescContains('Allow all'))) {
        await this.tapByDesc('Allow all');
        await browser.pause(900);
      }
      await this.acceptNativeDialogs();
    }
    return !(await this.exists(this.rootLocator));
  }

  /** Click through any stacked native runtime-permission dialogs. */
  private async acceptNativeDialogs(maxDialogs = 6): Promise<void> {
    for (let i = 0; i < maxDialogs; i++) {
      // "Allow"/"While using the app"/"Only this time" variants.
      const allow = $(
        'android=new UiSelector().resourceIdMatches(".*permission_allow.*button")',
      );
      if (!(await allow.isExisting())) break;
      await allow.click();
      await browser.pause(600);
    }
  }
}

export default new PermissionsPage();
