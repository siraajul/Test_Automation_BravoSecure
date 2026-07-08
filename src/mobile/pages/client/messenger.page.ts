import { BasePage } from '../base.page';
import { byText, byTextOrDesc } from '../../../helpers/selectors';
import { ClientNav } from './navigation';

export type MessengerTab = 'CHAT' | 'GROUPS' | 'CALL' | 'FILES' | 'NEWS';

/** Bravo Messenger sub-app (CHAT · GROUPS · CALL · FILES · NEWS). */
class MessengerPage extends BasePage {
  protected get rootLocator(): string {
    return byText('MESSENGER');
  }

  async open(): Promise<void> {
    await ClientNav.go('MESSENGER');
    await this.waitUntilActive();
  }

  subTab(tab: MessengerTab): ChainablePromiseElement {
    return $(byText(tab));
  }

  async openTab(tab: MessengerTab): Promise<void> {
    await this.tapByDesc(tab);
  }

  /** Open a conversation by its title (e.g. "SQA - ITSirajul"). */
  async openConversation(title: string): Promise<void> {
    await this.tapByDesc(title);
  }

  get encryptionBadge(): ChainablePromiseElement {
    return $(byTextOrDesc('AES-256'));
  }
}

export default new MessengerPage();
