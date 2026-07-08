import { AuthFlow } from '../../../src/mobile/flows/auth.flow';
import RestoreBackupPage from '../../../src/mobile/pages/restoreBackup.page';
import { ClientNav } from '../../../src/mobile/pages/client/navigation';
import { env } from '../../../src/config/env';

/**
 * Bring a device that is already signed-in-but-parked-at-restore up to a usable
 * state, then identify WHICH account it holds (the restore screen doesn't show
 * the email). One restore attempt only — never retry (5 wrong = 1h cooldown).
 *
 *   ANDROID_DEVICE=<serial> npx wdio run ./wdio.conf.ts --spec ./test/setup/bringup.e2e.ts
 */
function texts(src: string): string[] {
  return [
    ...new Set([...src.matchAll(/text="([^"]{2,40})"/g)].map((m) => m[1])),
  ].filter((t) => /[A-Za-z@0-9]/.test(t) && !/^&#/.test(t));
}

describe('SETUP · bring up device and identify account', () => {
  it('finishes restore and reports the profile identity', async () => {
    await AuthFlow.passBiometric().catch(() => undefined);

    // If parked at the restore screen, submit the backup password ONCE.
    const started = await RestoreBackupPage.restore(env.client.backupPassword ?? '').catch(
      () => false,
    );
    if (started) {
      console.log('RESTORE: submitted backup password, waiting for completion…');
      await RestoreBackupPage.waitForComplete(360000);
    } else {
      console.log('RESTORE: screen not present (already restored or different state)');
    }
    await browser.pause(2000);

    // Read identity from the PROFILE tab.
    await ClientNav.go('PROFILE').catch(() => undefined);
    await browser.pause(2500);
    const profile = texts(await driver.getPageSource());
    console.log('IDENTITY =>', JSON.stringify(profile.slice(0, 24)));
    await driver.saveScreenshot('./.explore/bringup_profile.png').catch(() => undefined);
  });
});
