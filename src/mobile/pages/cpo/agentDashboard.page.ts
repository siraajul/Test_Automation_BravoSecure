import { BasePage } from '../base.page';
import { byText, byDescContains } from '../../../helpers/selectors';

/**
 * CP Agent (operator) landing screen: "Agent Dashboard".
 * Menu: Job Requests · Attendance · Messenger · Intel Feed · Coverage Regions · Earnings.
 * NOTE: do not accept jobs or clock in/out in tests (registers real duty).
 */
class AgentDashboardPage extends BasePage {
  protected get rootLocator(): string {
    return byText('Agent Dashboard');
  }

  get jobRequests(): ChainablePromiseElement {
    return $(byDescContains('Job Requests'));
  }
  get attendance(): ChainablePromiseElement {
    return $(byDescContains('Attendance'));
  }
  get messenger(): ChainablePromiseElement {
    return $(byDescContains('Messenger'));
  }
  get intelFeed(): ChainablePromiseElement {
    return $(byDescContains('Intel Feed'));
  }
  get coverageRegions(): ChainablePromiseElement {
    return $(byDescContains('Coverage Regions'));
  }
  get earnings(): ChainablePromiseElement {
    return $(byDescContains('Earnings'));
  }

  /**
   * Ensure the dashboard is the active screen. The app may have restored a
   * deep sub-screen on launch, so navigate back until the dashboard appears.
   */
  async open(): Promise<void> {
    for (let i = 0; i < 4; i++) {
      if (await this.isActive(2500)) return;
      await driver.back();
      await browser.pause(800);
    }
    await this.waitUntilActive(15000);
  }

  /** Scroll a menu item into view (RN lazy-renders off-screen rows). */
  async scrollTo(desc: string): Promise<void> {
    try {
      await $(
        'android=new UiScrollable(new UiSelector().scrollable(true))' +
          `.scrollIntoView(new UiSelector().descriptionContains("${desc}"))`,
      );
    } catch {
      // single-screen layout or already visible
    }
  }

  /** Open a dashboard menu item by its label (scrolls it into view first). */
  async openMenuItem(label: string): Promise<void> {
    await this.open();
    await this.scrollTo(label);
    await $(byDescContains(label)).click();
  }

  async openJobRequests(): Promise<void> {
    await this.open();
    await this.jobRequests.click();
  }

  /**
   * Open the agent side drawer. The trigger is the top-right avatar, whose
   * content-desc is the agent's initials (account-specific), so we tap by
   * window-relative position instead of a brittle initials locator.
   */
  async openDrawer(): Promise<void> {
    await this.open();
    const { width, height } = await driver.getWindowSize();
    await driver.execute('mobile: clickGesture', {
      x: Math.round(width * 0.9),
      y: Math.round(height * 0.087),
    });
    await $(byDescContains('Log Out')).waitForDisplayed({ timeout: 8000 });
  }

  async logout(): Promise<void> {
    await this.openDrawer();
    await this.tapByDesc('Log Out');
  }
}

export default new AgentDashboardPage();
