import { AuthFlow } from '../../src/mobile/flows/auth.flow';
import AgentDashboardPage from '../../src/mobile/pages/cpo/agentDashboard.page';
import JobMarketplacePage from '../../src/mobile/pages/cpo/jobMarketplace.page';
import { byTextOrDesc } from '../../src/helpers/selectors';

const JF = process.env.E2E_JF ?? 'JF-D5F1DF97C6CC';

function texts(src: string): string[] {
  return [...new Set(
    [...src.matchAll(/(?:text|content-desc)="([^"]{2,48})"/g)].map((m) => m[1]),
  )].filter((t) => /[A-Za-z0-9]/.test(t));
}

describe('E2E-D · CPO applies to the job', () => {
  it(`applies to ${JF} (dress pledge + confirm)`, async () => {
    await AuthFlow.loginAs('cpo');
    await AgentDashboardPage.openJobRequests();
    await JobMarketplacePage.waitUntilActive(15000).catch(() => undefined);
    await $(
      `android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().textContains("${JF}"))`,
    ).catch(() => undefined);
    await JobMarketplacePage.jobCard(JF).click();
    await browser.pause(1200);

    await $(byTextOrDesc('Apply for Job')).click();
    await browser.pause(1500);
    // Pledge compliance with the Ops dress brief, then confirm.
    await $(byTextOrDesc("I'll wear exactly what Ops specified")).click().catch(() => undefined);
    await browser.pause(500);
    await $(byTextOrDesc('Confirm & Apply')).click();
    await browser.pause(3000);

    console.log('AFTER-CONFIRM-APPLY =>', texts(await driver.getPageSource()).slice(0, 28));
    await driver.saveScreenshot('./.explore/phaseD_4_applied.png');
  });
});
