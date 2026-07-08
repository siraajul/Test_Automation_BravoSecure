/**
 * BravoSecure icon-font codepoints (Private Use Area).
 *
 * The React Native Messenger renders most action buttons as an icon-font glyph
 * with NO text label — the glyph char IS the element's `content-desc`. These
 * were captured live from the page source (see `.explore/` dumps). Locate such
 * buttons with `byDescContains(GLYPH.xxx)`.
 *
 * If the app's icon font is ever re-versioned these may shift — re-dump and
 * update here in one place rather than scattering magic codepoints across pages.
 */
export const GLYPH = {
  // Chat thread header (top-right of an open conversation)
  audioCall: String.fromCodePoint(986608), // U+F0DF0 — start voice call
  videoCall: String.fromCodePoint(986076), // U+F0BDC — start video call
  back: String.fromCodePoint(983361), //       U+F0201 — back arrow

  // Message composer row (bottom of a thread)
  attach: String.fromCodePoint(984089), //     U+F0A59 — attachment
  emoji: String.fromCodePoint(983538), //      U+F08F2 — emoji
  camera: String.fromCodePoint(984347), //     U+F0B5B — camera
  send: String.fromCodePoint(984202), //       U+F0ACA — send (replaces voice button once text is typed)
} as const;

export type GlyphName = keyof typeof GLYPH;
