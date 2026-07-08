import { byDescContains, byText } from '../../helpers/selectors';

export const DEFAULT_TIMEOUT = 15000;

/**
 * Base class for all Page Objects. Provides resilient waits and the common
 * RN locator strategies so individual pages stay declarative.
 */
export abstract class BasePage {
  /** A locator that uniquely identifies this screen, used by `isActive`. */
  protected abstract get rootLocator(): string;

  get root(): ChainablePromiseElement {
    return $(this.rootLocator);
  }

  async isActive(timeout = DEFAULT_TIMEOUT): Promise<boolean> {
    try {
      await this.root.waitForDisplayed({ timeout });
      return true;
    } catch {
      return false;
    }
  }

  async waitUntilActive(timeout = DEFAULT_TIMEOUT): Promise<void> {
    await this.root.waitForDisplayed({
      timeout,
      timeoutMsg: `${this.constructor.name} did not become active in ${timeout}ms`,
    });
  }

  /** Tap an element by content-desc substring (tolerant of trailing glyphs). */
  protected async tapByDesc(text: string, timeout = DEFAULT_TIMEOUT): Promise<void> {
    const el = $(byDescContains(text));
    await el.waitForDisplayed({ timeout });
    await el.click();
  }

  /** Tap an element by exact visible text. */
  protected async tapByText(text: string, timeout = DEFAULT_TIMEOUT): Promise<void> {
    const el = $(byText(text));
    await el.waitForDisplayed({ timeout });
    await el.click();
  }

  protected async exists(selector: string): Promise<boolean> {
    return $(selector).isExisting();
  }

  protected async setValue(selector: string, value: string): Promise<void> {
    const el = $(selector);
    await el.waitForDisplayed({ timeout: DEFAULT_TIMEOUT });
    await el.setValue(value);
  }
}
