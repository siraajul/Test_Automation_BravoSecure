import { addAttachment } from '@wdio/allure-reporter';
import { androidCapabilities } from './src/config/capabilities';

// Ensure the Appium subprocess always sees a valid JAVA_HOME.
process.env.JAVA_HOME =
  process.env.JAVA_HOME ||
  '/Library/Java/JavaVirtualMachines/temurin-25.jdk/Contents/Home';

export const config: WebdriverIO.Config = {
  runner: 'local',

  // Single-device mobile specs (Appium). Multi-device comms/calls use
  // wdio.multiremote.conf.ts; web admin uses playwright.config.ts.
  specs: ['./test/mobile/**/*.ts'],
  // Named suites — run with `wdio run ... --suite <name>`.
  suites: {
    smoke: ['./test/mobile/smoke/**/*.ts'],
    auth: ['./test/mobile/auth/**/*.ts'],
    client: ['./test/mobile/**/*.client.e2e.ts'],
    cpo: ['./test/mobile/**/*.cpo.e2e.ts'],
    regression: ['./test/mobile/**/*.ts'],
  },

  maxInstances: 1,
  capabilities: [androidCapabilities],

  logLevel: 'info',
  bail: 0,
  waitforTimeout: 15000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 2,

  services: [
    ['appium', { args: { address: '127.0.0.1', port: 4723 }, command: 'appium' }],
  ],
  port: 4723,

  framework: 'mocha',
  reporters: [
    'spec',
    [
      'allure',
      {
        outputDir: 'allure-results',
        disableWebdriverStepsReporting: false,
        disableWebdriverScreenshotsReporting: false,
      },
    ],
  ],
  mochaOpts: {
    ui: 'bdd',
    // Very generous: a fresh client login can re-trigger the multi-minute
    // encrypted restore on every cold session start.
    timeout: 900000,
  },

  /**
   * On any test failure, attach a screenshot and the current page source to
   * the Allure report for fast triage.
   */
  afterTest: async function (_test, _context, result) {
    if (result.passed) return;
    try {
      const png = await browser.takeScreenshot();
      addAttachment('screenshot', Buffer.from(png, 'base64'), 'image/png');
      const source = await browser.getPageSource();
      addAttachment('page-source', source, 'application/xml');
    } catch {
      // best-effort triage data; ignore capture errors
    }
  },
};
