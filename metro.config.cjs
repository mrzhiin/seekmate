const { withUniwindConfig } = require("uniwind/metro");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

module.exports = withUniwindConfig(config, {
	cssEntryFile: "./global.css",
	dtsFile: "./types/uniwind-types.d.ts",
});
