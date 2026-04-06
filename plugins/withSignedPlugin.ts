import fs from "node:fs";
import path from "node:path";
import { type ConfigPlugin, withDangerousMod } from "@expo/config-plugins";

type SignedPluginOptions = {
	storeFile: string;
	storePassword: string;
	keyAlias: string;
	keyPassword: string;
};

const RELEASE_STORE_FILE_KEY = "APP_RELEASE_STORE_FILE";
const RELEASE_STORE_PASSWORD_KEY = "APP_RELEASE_STORE_PASSWORD";
const RELEASE_KEY_ALIAS_KEY = "APP_RELEASE_KEY_ALIAS";
const RELEASE_KEY_PASSWORD_KEY = "APP_RELEASE_KEY_PASSWORD";

function assertOptions(
	options?: SignedPluginOptions,
): asserts options is SignedPluginOptions {
	if (!options) {
		throw new Error("withSignedPlugin requires signing options.");
	}
	const missing = Object.entries(options)
		.filter(([, v]) => !v)
		.map(([k]) => k);
	if (missing.length > 0) {
		throw new Error(
			`withSignedPlugin missing required options: ${missing.join(", ")}.`,
		);
	}
}

function upsertGradleProperty(
	lines: string[],
	key: string,
	value: string,
): string[] {
	const eq = `${key}=`;
	const idx = lines.findIndex((l) => l.startsWith(eq));
	if (idx !== -1) {
		lines[idx] = `${eq}${value}`;
	} else {
		lines.push(`${eq}${value}`);
	}
	return lines;
}

function applySigningConfigToBuildGradle(src: string): string {
	const lines = src.split(/\r?\n/);
	const releaseBlock = [
		"        release {",
		`            if (project.hasProperty('${RELEASE_STORE_FILE_KEY}')) {`,
		`                storeFile file(findProperty('${RELEASE_STORE_FILE_KEY}'))`,
		`                storePassword findProperty('${RELEASE_STORE_PASSWORD_KEY}')`,
		`                keyAlias findProperty('${RELEASE_KEY_ALIAS_KEY}')`,
		`                keyPassword findProperty('${RELEASE_KEY_PASSWORD_KEY}')`,
		"            }",
		"        }",
	];

	const signingConfigsStart = lines.findIndex((line) =>
		line.includes("signingConfigs {"),
	);

	if (signingConfigsStart === -1) {
		return src;
	}

	let signingConfigsEnd = -1;
	let braceDepth = 0;

	for (let i = signingConfigsStart; i < lines.length; i++) {
		for (const char of lines[i]) {
			if (char === "{") braceDepth++;
			if (char === "}") braceDepth--;
		}

		if (i > signingConfigsStart && braceDepth === 0) {
			signingConfigsEnd = i;
			break;
		}
	}

	if (signingConfigsEnd === -1) {
		return src;
	}

	let releaseStart = -1;
	let releaseEnd = -1;
	braceDepth = 0;

	for (let i = signingConfigsStart + 1; i < signingConfigsEnd; i++) {
		const trimmed = lines[i].trim();

		if (releaseStart === -1 && trimmed.startsWith("release {")) {
			releaseStart = i;
			braceDepth = 0;
		}

		if (releaseStart !== -1) {
			for (const char of lines[i]) {
				if (char === "{") braceDepth++;
				if (char === "}") braceDepth--;
			}

			if (braceDepth === 0) {
				releaseEnd = i;
				break;
			}
		}
	}

	const nextLines = [...lines];

	if (releaseStart !== -1 && releaseEnd !== -1) {
		nextLines.splice(
			releaseStart,
			releaseEnd - releaseStart + 1,
			...releaseBlock,
		);
	} else {
		nextLines.splice(signingConfigsEnd, 0, ...releaseBlock);
	}

	const updated = nextLines.join("\n");

	return updated.replace(
		/(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?signingConfig\s+signingConfigs\.)debug/,
		"$1release",
	);
}

const withSignedPlugin: ConfigPlugin<SignedPluginOptions> = (
	config,
	options,
) => {
	assertOptions(options);

	config = withDangerousMod(config, [
		"android",
		async (modConfig) => {
			const projectRoot = modConfig.modRequest.projectRoot;
			const appDir = path.join(modConfig.modRequest.platformProjectRoot, "app");

			// 1. Copy keystore to android/app/
			const srcKeystore = path.isAbsolute(options.storeFile)
				? options.storeFile
				: path.resolve(projectRoot, options.storeFile);
			const destKeystore = path.join(appDir, path.basename(options.storeFile));

			if (!fs.existsSync(srcKeystore)) {
				throw new Error(`withSignedPlugin: keystore not found: ${srcKeystore}`);
			}
			fs.copyFileSync(srcKeystore, destKeystore);

			// 2. Write release signing properties to gradle.properties
			const gradlePropertiesPath = path.join(
				modConfig.modRequest.platformProjectRoot,
				"gradle.properties",
			);
			const gradlePropsLines = fs
				.readFileSync(gradlePropertiesPath, "utf-8")
				.split(/\r?\n/);
			const destFileName = path.basename(options.storeFile);
			upsertGradleProperty(
				gradlePropsLines,
				RELEASE_STORE_FILE_KEY,
				destFileName,
			);
			upsertGradleProperty(
				gradlePropsLines,
				RELEASE_STORE_PASSWORD_KEY,
				options.storePassword,
			);
			upsertGradleProperty(
				gradlePropsLines,
				RELEASE_KEY_ALIAS_KEY,
				options.keyAlias,
			);
			upsertGradleProperty(
				gradlePropsLines,
				RELEASE_KEY_PASSWORD_KEY,
				options.keyPassword,
			);
			fs.writeFileSync(
				gradlePropertiesPath,
				gradlePropsLines.join("\n"),
				"utf-8",
			);

			// 3. Patch android/app/build.gradle
			const buildGradlePath = path.join(appDir, "build.gradle");
			const buildGradleSrc = fs.readFileSync(buildGradlePath, "utf-8");
			const patched = applySigningConfigToBuildGradle(buildGradleSrc);
			fs.writeFileSync(buildGradlePath, patched, "utf-8");

			return modConfig;
		},
	]);

	return config;
};

export default withSignedPlugin;
