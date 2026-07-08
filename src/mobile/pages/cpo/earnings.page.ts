import { BasePage } from '../base.page';
import { byTextOrDesc } from '../../../helpers/selectors';

/** Agent Earnings (wallet balance in Bravo Credits + mission earnings). */
class EarningsPage extends BasePage {
  protected get rootLocator(): string {
    return byTextOrDesc('My Earnings');
  }

  get walletBalance(): ChainablePromiseElement {
    return $(byTextOrDesc('WALLET BALANCE'));
  }
}

export default new EarningsPage();
