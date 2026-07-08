import { BasePage } from '../base.page';
import { byDescContains, byTextContains } from '../../../helpers/selectors';
import { ClientNav } from './navigation';

/** Client landing screen: "BRAVO COMMAND" dashboard. */
class HomePage extends BasePage {
  protected get rootLocator(): string {
    return byTextContains('COMMAND');
  }

  get emergencySosButton(): ChainablePromiseElement {
    return $(byDescContains('EMERGENCY'));
  }
  get messengerService(): ChainablePromiseElement {
    return $(byDescContains('Bravo Messenger'));
  }
  get secureService(): ChainablePromiseElement {
    return $(byDescContains('Bravo Secure'));
  }
  get virtualBodyguardService(): ChainablePromiseElement {
    return $(byDescContains('Virtual Bodyguard'));
  }

  async open(): Promise<void> {
    await ClientNav.go('HOME');
    await this.waitUntilActive();
  }

  async openVirtualBodyguard(): Promise<void> {
    await this.virtualBodyguardService.click();
  }
}

export default new HomePage();
