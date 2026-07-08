import { env } from './env';

export const APP_PACKAGE = 'com.bravosecure.app';
export const APP_ACTIVITY = 'com.bravosecure.app.MainActivity';

/**
 * UiAutomator2 capabilities for the BravoSecure app on the wireless Pixel 7a.
 * `noReset` keeps the app authenticated between runs so we don't re-trigger the
 * full restore-backup flow every time.
 */
export const androidCapabilities = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': 'Pixel 7a',
  'appium:udid': env.androidDevice,
  'appium:appPackage': APP_PACKAGE,
  'appium:appActivity': APP_ACTIVITY,
  'appium:noReset': true,
  'appium:newCommandTimeout': 300,
  'appium:adbExecTimeout': 60000,
  'appium:autoGrantPermissions': false,
  'appium:disableWindowAnimation': true,
  // CRITICAL: the app animates constantly (live clock, map, pulsing badges), so
  // UiAutomator2's "wait for idle" never settles and every command pays the full
  // idle timeout (~10–20s). Disabling it makes element lookups return instantly.
  'appium:settings': {
    waitForIdleTimeout: 0,
    waitForSelectorTimeout: 0,
    actionAcknowledgmentTimeout: 0,
    ignoreUnimportantViews: true,
  },
};
