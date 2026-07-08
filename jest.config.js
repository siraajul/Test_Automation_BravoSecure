const path = require('path');

// Single coupling point to the main app repo. Override with BRAVO_MAIN_REPO if
// the checkout lives elsewhere. We import messenger-core straight from source
// (its package `main` is src/index.ts), so no build step is needed.
const MAIN = process.env.BRAVO_MAIN_REPO || '/Users/sirajul/Desktop/Work/Bravo_Secure';

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test/crypto', '<rootDir>/test/api'],
  testMatch: ['**/*.core.test.ts', '**/*.api.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/crypto/support/setup.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    // '@bravo/messenger-core' → a crypto-only subset barrel (see coreBarrel.ts).
    // We deliberately do NOT map to the real src/index.ts because that barrel
    // re-exports src/transport/client.ts, which imports @react-native-async-storage
    // and socket.io-client — native/RN deps we don't want in a headless suite.
    '^@bravo/messenger-core$': '<rootDir>/test/crypto/support/coreBarrel.ts',
    // '@core/*' → the main repo's messenger-core source tree.
    '^@core/(.*)$': path.join(MAIN, 'packages', 'messenger-core', 'src', '$1'),
  },
  transform: {
    // diagnostics:false → transpile-only. Keeps type-only imports erased
    // correctly (unlike isolatedModules) without type-checking across repos.
    // allowJs → also transpile @noble/hashes (ESM-only) from node_modules.
    '^.+\\.[cm]?[jt]s$': ['ts-jest', { diagnostics: false, tsconfig: { allowJs: true } }],
  },
  // @noble/hashes v2 ships ESM only; everything else in node_modules is CJS and
  // stays untransformed. Un-ignore just that package so ts-jest can transpile it.
  transformIgnorePatterns: ['node_modules/(?!@noble/hashes)'],
};
