import { AuthFlow } from '../../src/mobile/flows/auth.flow';
import RestoreBackupPage from '../../src/mobile/pages/restoreBackup.page';
import { ClientNav } from '../../src/mobile/pages/client/navigation';
import { env } from '../../src/config/env';
import { APP_PACKAGE } from '../../src/config/capabilities';

/**
 * Submit the backup password (from env BACKUP_PASSWORD) on a device parked at the
 * RESTORE screen and wait out the argon2id restore. setValue handles the special
 * chars adb's `input text` mangles. ONE attempt only (5 wrong = 1h cooldown).
 *
 *   ANDROID_DEVICE=<serial> npx wdio run ./wdio.conf.ts --spec ./test/setup/restore-now.e2e.ts
 */
function texts(src: string): string[] {
  return [...new Set([...src.matchAll(/text="([^"]{2,40})"/g)].map((m) => m[1]))].filter(
    (t) => /[A-Za-z@0-9]/.test(t) && !/^&#/.test(t),
  );
}

describe('SETUP · restore now', () => {
  it('submits the backup password and finishes restore', async () => {
    await driver.activateApp(APP_PACKAGE).catch(() => undefined);
    await browser.pause(2000);

    await RestoreBackupPage.restoreButton.waitForExist({ timeout: 30000 });
    await RestoreBackupPage.backupPasswordField.setValue(env.client.backupPassword as string);
    await RestoreBackupPage.restoreButton.click();
    console.log('RESTORE: submitted backup password, waiting for completion…');

    const done = await RestoreBackupPage.waitForComplete(600000);
    console.log('RESTORE: complete =', done);
    await browser.pause(2500);

    await ClientNav.go('PROFILE').catch(() => undefined);
    await browser.pause(2500);
    console.log('IDENTITY =>', JSON.stringify(texts(await driver.getPageSource()).slice(0, 24)));
    await driver.saveScreenshot('./.explore/client2_profile.png').catch(() => undefined);
  });
});
