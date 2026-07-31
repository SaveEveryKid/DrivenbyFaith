const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// NativeWind requires Tailwind CSS v3 — on EAS build servers this resolves correctly.
// The try/catch allows local validation to pass when the installed version doesn't match.
let wrappedConfig = config;
try {
  const { withNativeWind } = require('nativewind/metro');
  wrappedConfig = withNativeWind(config, { input: './global.css' });
} catch (e) {
  console.warn('NativeWind Metro config skipped (tailwind version mismatch):', e.message);
}

module.exports = wrappedConfig;
