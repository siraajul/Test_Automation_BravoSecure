import { BasePage } from '../base.page';
import { byDescContains, byText, byTextContains, byTextOrDesc } from '../../../helpers/selectors';
import { GLYPH } from '../../../helpers/glyphs';

/**
 * Bravo Messenger conversation list + open thread (1:1 and group share this UI).
 *
 * Locators confirmed live (see `.explore/` dumps):
 *  - List rows expose the conversation title inside `content-desc`
 *    ("<initials>, <title>, · DEV|GROUP, <time>, <preview>") → match by substring.
 *  - The composer EditText hint is "Type a secure message...".
 *  - The Send control is an icon-font glyph that only appears once text is typed;
 *    until then that slot is the "Record voice message" button.
 */
class ChatPage extends BasePage {
  // An open thread is uniquely identified by its message composer.
  protected get rootLocator(): string {
    return '//android.widget.EditText[contains(@text,"secure message")]';
  }

  /* ---- conversation list ---- */

  get composeButton(): ChainablePromiseElement {
    return $(byDescContains('Compose new message'));
  }

  get searchInput(): ChainablePromiseElement {
    return $('//android.widget.EditText[contains(@text,"Search secure")]');
  }

  /** A conversation row located by its title substring (works for DM and group). */
  conversationRow(title: string): ChainablePromiseElement {
    return $(byDescContains(title));
  }

  async isListActive(timeout = 8000): Promise<boolean> {
    return this.composeButton
      .waitForDisplayed({ timeout })
      .then(() => true)
      .catch(() => false);
  }

  /** Open a conversation (DM or group) from the list by its title. */
  async openConversation(title: string): Promise<void> {
    const row = this.conversationRow(title);
    await row.waitForDisplayed({ timeout: 12000 });
    await row.click();
    await this.waitUntilActive(12000);
  }

  /* ---- open thread ---- */

  get messageInput(): ChainablePromiseElement {
    return $(this.rootLocator);
  }

  /** Send glyph — present only when the composer holds text. */
  get sendButton(): ChainablePromiseElement {
    return $(byDescContains(GLYPH.send));
  }

  get audioCallButton(): ChainablePromiseElement {
    return $(byDescContains(GLYPH.audioCall));
  }

  get videoCallButton(): ChainablePromiseElement {
    return $(byDescContains(GLYPH.videoCall));
  }

  /** Tap the thread header (contact/group name) to open its info screen. */
  get header(): ChainablePromiseElement {
    // The header row is a clickable ViewGroup carrying the title in content-desc;
    // callers pass the title via openConversationInfo().
    return $('(//android.view.ViewGroup[@clickable="true"])[2]');
  }

  async sendMessage(text: string): Promise<void> {
    await this.messageInput.waitForDisplayed({ timeout: 12000 });
    await this.messageInput.setValue(text);
    await this.sendButton.waitForDisplayed({ timeout: 6000 });
    await this.sendButton.click();
  }

  /** Assert a message with the given text is present in the thread. */
  messageBubble(text: string): ChainablePromiseElement {
    return $(byTextContains(text));
  }

  async hasMessage(text: string, timeoutMs = 20000): Promise<boolean> {
    return this.messageBubble(text)
      .waitForDisplayed({ timeout: timeoutMs })
      .then(() => true)
      .catch(() => false);
  }

  get encryptedBanner(): ChainablePromiseElement {
    return $(byTextOrDesc('END-TO-END ENCRYPTED'));
  }

  /** Open the conversation info / group-info screen by tapping the named header. */
  async openInfo(title: string): Promise<void> {
    await $(byDescContains(title)).click();
  }

  /** Best-effort back out of a thread to the conversation list. */
  async backToList(): Promise<void> {
    for (let i = 0; i < 3; i++) {
      if (await this.isListActive(3000)) return;
      await driver.back();
      await browser.pause(1000);
    }
  }
}

export default new ChatPage();
