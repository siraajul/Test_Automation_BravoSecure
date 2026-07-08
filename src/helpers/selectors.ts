/**
 * Locator helpers for the BravoSecure React Native UI.
 *
 * RN exposes buttons via `content-desc` (accessibility id), often with a
 * trailing icon glyph, so prefer `descriptionContains` over exact matches.
 * Text inputs have no id/accessibility id and are located by type + order.
 */

/** Accessibility id (content-desc) exact match. */
export const byAccessibilityId = (id: string): string => `~${id}`;

/** UiAutomator: content-desc contains (tolerant of trailing glyphs). */
export const byDescContains = (text: string): string =>
  `android=new UiSelector().descriptionContains("${text}")`;

/** UiAutomator: visible text exact match. */
export const byText = (text: string): string =>
  `android=new UiSelector().text("${text}")`;

/** UiAutomator: visible text contains. */
export const byTextContains = (text: string): string =>
  `android=new UiSelector().textContains("${text}")`;

/** Android resource-id. */
export const byResourceId = (id: string): string =>
  `android=new UiSelector().resourceId("${id}")`;

/** Match an element whose text OR content-desc contains the string (xpath OR). */
export const byTextOrDesc = (s: string): string =>
  `//*[contains(@text, "${s}") or contains(@content-desc, "${s}")]`;

/** Nth EditText on screen (1-based), for unlabelled RN inputs. */
export const editTextAt = (index: number): string =>
  `(//android.widget.EditText)[${index}]`;

export const ANY_EDIT_TEXT = '//android.widget.EditText';
