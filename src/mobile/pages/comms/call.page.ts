import { BasePage } from '../base.page';
import { byTextContains, byTextOrDesc } from '../../../helpers/selectors';

/**
 * WebRTC audio/video call UI (1:1 and group). Automation verifies call STATE
 * and controls only (ringing / connecting / connected / mute / end) — never the
 * actual media.
 *
 * Confirmed live from the outgoing-call screen:
 *  - States render as text: "CALLING…", "ENCRYPTED VOICE CALL · WEBRTC".
 *  - Controls render as a clickable ViewGroup wrapping a glyph + a text label
 *    (MUTE · SPEAKER · HOLD · CAMERA · ADD), plus a MINIMISE affordance.
 *  - The connected state shows a running mm:ss timer.
 *
 * NOTE: the incoming-call Accept/Decline screen and the End-call button are
 * finalised during the 2-device call run (a single device can't ring itself).
 */

/** Clickable container that wraps a node with the given visible text (label-based control). */
const controlByLabel = (label: string): string =>
  `//android.view.ViewGroup[.//*[@text="${label}"]]`;

class CallPage extends BasePage {
  // Any active/connecting call screen shows the WebRTC banner.
  protected get rootLocator(): string {
    return byTextOrDesc('WEBRTC');
  }

  /* ---- state ---- */

  get ringing(): ChainablePromiseElement {
    return $(byTextContains('CALLING'));
  }

  async isRinging(timeout = 15000): Promise<boolean> {
    return this.ringing
      .waitForDisplayed({ timeout })
      .then(() => true)
      .catch(() => false);
  }

  /**
   * A connected call shows "CONNECTED" / a running mm:ss timer and no longer
   * shows "CALLING…". We detect it as: controls present AND ringing gone.
   */
  async isConnected(timeout = 25000): Promise<boolean> {
    return browser
      .waitUntil(
        async () => {
          if (await $(byTextContains('CONNECTED')).isExisting()) return true;
          const stillRinging = await this.ringing.isExisting();
          const hasControls = await this.muteButton.isExisting();
          return !stillRinging && hasControls;
        },
        { timeout, interval: 1000 },
      )
      .then(() => true)
      .catch(() => false);
  }

  /* ---- controls (label-wrapped ViewGroups) ---- */

  get muteButton(): ChainablePromiseElement {
    return $(controlByLabel('MUTE'));
  }
  get speakerButton(): ChainablePromiseElement {
    return $(controlByLabel('SPEAKER'));
  }
  get cameraButton(): ChainablePromiseElement {
    return $(controlByLabel('CAMERA'));
  }
  get addButton(): ChainablePromiseElement {
    return $(controlByLabel('ADD'));
  }
  get minimiseButton(): ChainablePromiseElement {
    return $(byTextOrDesc('MINIMISE'));
  }

  /* ---- incoming call (receiver) — confirmed/adjusted in the 2-device run ---- */

  get acceptButton(): ChainablePromiseElement {
    return $(byTextOrDesc('Accept'));
  }
  get declineButton(): ChainablePromiseElement {
    return $(byTextOrDesc('Decline'));
  }

  /**
   * End the call. The end button is a red glyph with no label; until it is
   * locked from a live call we try the labelled "END" then fall back to the
   * last control in the call control row.
   */
  get endButton(): ChainablePromiseElement {
    return $(byTextOrDesc('END'));
  }

  async answer(): Promise<void> {
    await this.acceptButton.waitForDisplayed({ timeout: 20000 });
    await this.acceptButton.click();
  }

  async decline(): Promise<void> {
    await this.declineButton.click();
  }

  async end(): Promise<void> {
    await this.endButton.click().catch(() => undefined);
  }
}

export default new CallPage();
