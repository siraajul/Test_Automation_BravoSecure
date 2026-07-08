import { APP_PACKAGE } from '../../../config/capabilities';
import { byDescContains, byText } from '../../../helpers/selectors';

export type ClientTab = 'HOME' | 'MESSENGER' | 'SECURE' | 'PROFILE';

/**
 * Client app bottom navigation (HOME · MESSENGER · SECURE · PROFILE).
 * Tab labels render as visible text; fall back to content-desc.
 */
export const ClientNav = {
  tab(label: ClientTab): ChainablePromiseElement {
    return $(byText(label));
  },

  async present(label: ClientTab): Promise<boolean> {
    return (await this.tab(label).isExisting()) || (await $(byDescContains(label)).isExisting());
  },

  async tapTab(label: ClientTab): Promise<void> {
    if (await this.tab(label).isExisting()) return this.tab(label).click();
    return $(byDescContains(label)).click();
  },

  async go(label: ClientTab): Promise<void> {
    // The top-level tab bar (HOME/MESSENGER/SECURE/PROFILE) is hidden inside
    // sub-apps (e.g. the Messenger CHAT/GROUPS/… stack). Back out to reveal it,
    // but never press back out of the app itself.
    for (let attempt = 0; attempt < 4; attempt++) {
      if (await this.present(label)) return this.tapTab(label);
      await driver.back();
      await browser.pause(1000);
      if ((await driver.getCurrentPackage()) !== APP_PACKAGE) {
        await driver.activateApp(APP_PACKAGE); // back left the app — return to it
        await browser.pause(1500);
        break;
      }
    }
    await browser
      .waitUntil(() => this.present(label), { timeout: 12000, interval: 600 })
      .catch(() => undefined);
    await this.tapTab(label);
  },
};
