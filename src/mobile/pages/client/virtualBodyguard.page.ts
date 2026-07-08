import { BasePage } from '../base.page';
import { byTextContains, byDescContains } from '../../../helpers/selectors';

/**
 * Virtual Bodyguard "Virtual Dashboard" (PRO) — AI personal-safety monitoring.
 * NOTE: do not trigger the Panic Button in tests.
 */
class VirtualBodyguardPage extends BasePage {
  protected get rootLocator(): string {
    return byTextContains('VIRTUAL DASHBOARD');
  }

  get panicButton(): ChainablePromiseElement {
    return $(byDescContains('Panic Button'));
  }
  get contactOpsButton(): ChainablePromiseElement {
    return $(byDescContains('Contact Ops'));
  }
  get requestCpoButton(): ChainablePromiseElement {
    return $(byDescContains('Request CPO'));
  }
  get viewOnMapButton(): ChainablePromiseElement {
    return $(byDescContains('VIEW ON MAP'));
  }
}

export default new VirtualBodyguardPage();
