/**
 * Expo config plugin for react-native-liquid-glassmorphism.
 *
 * The native module — the `LiquidGlassmorphismView` Fabric component, its iOS
 * pod, and its Android Gradle module — is linked automatically by Expo
 * autolinking during `expo prebuild`, so no manual native configuration is
 * required to use `<LiquidGlassView>`. Add it to your app config to opt in:
 *
 *   // app.json
 *   { "expo": { "plugins": ["react-native-liquid-glassmorphism"] } }
 *
 * The effect degrades at runtime by OS version (iOS 26 `UIGlassEffect`;
 * Android API 33+ AGSL, with graceful fallbacks below), so there are no
 * minimum-SDK, permission, or Info.plist changes to apply here.
 *
 * This plugin is therefore a well-behaved pass-through and the single place to
 * add native configuration should the library ever need it.
 *
 * @param {import('@expo/config-plugins').ExpoConfig} config
 * @returns {import('@expo/config-plugins').ExpoConfig}
 */
function withLiquidGlassmorphism(config) {
  return config;
}

module.exports = withLiquidGlassmorphism;
