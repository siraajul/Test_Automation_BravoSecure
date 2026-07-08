import { AuthFlow } from '../../src/mobile/flows/auth.flow';
import AgentDashboardPage from '../../src/mobile/pages/cpo/agentDashboard.page';
import JobMarketplacePage from '../../src/mobile/pages/cpo/jobMarketplace.page';

const JF = process.env.E2E_JF ?? 'JF-D5F1DF97C6CC';

describe('E2E-C · CPO sees the published job', () => {
  it(`finds ${JF} in the Job Marketplace`, async () => {
    await AuthFlow.loginAs('cpo');
    await AgentDashboardPage.openJobRequests();
    await JobMarketplacePage.waitUntilActive(15000).catch(() => undefined);
    await browser.pause(2000);

    const src = await driver.getPageSource();
    const found = src.includes(JF);
    console.log(`CPO sees ${JF} =>`, found);
    if (!found) {
      const jfs = [...new Set([...src.matchAll(/JF-[0-9A-F]{12}/g)].map((m) => m[0]))];
      console.log('JOBS-IN-FEED =>', jfs.slice(0, 12));
    }
    await driver.saveScreenshot('./.explore/phaseC_cpo.png');
    await expect(found).toBe(true);
  });
});
