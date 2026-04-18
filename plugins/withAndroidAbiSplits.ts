import { type ConfigPlugin, withAppBuildGradle } from "expo/config-plugins";

const PLUGIN_TAG = "withAndroidAbiSplits";
const DEFAULT_ABI_FILTERS = ["armeabi-v7a", "arm64-v8a"] as const;
const GENERATED_START = "// @generated begin withAndroidAbiSplits";
const GENERATED_END = "// @generated end withAndroidAbiSplits";

type AndroidAbiSplitsOptions = {
	abis?: string[];
	universalApk?: boolean;
};

type ResolvedAndroidAbiSplitsOptions = {
	abis: string[];
	universalApk: boolean;
};

type BlockRange = {
	start: number;
	end: number;
	indent: string;
};

function resolveOptions(
	options?: AndroidAbiSplitsOptions,
): ResolvedAndroidAbiSplitsOptions {
	const abis = (options?.abis ?? [...DEFAULT_ABI_FILTERS])
		.map((abi) => abi.trim())
		.filter(Boolean)
		.filter((abi, index, all) => all.indexOf(abi) === index);

	if (abis.length === 0) {
		throw new Error(`${PLUGIN_TAG}: at least one ABI must be provided`);
	}

	return {
		abis,
		universalApk: options?.universalApk ?? true,
	};
}

function detectNewline(src: string): "\n" | "\r\n" {
	return src.includes("\r\n") ? "\r\n" : "\n";
}

function findAllIndexes(src: string, search: string): number[] {
	const indexes: number[] = [];
	let fromIndex = 0;

	while (fromIndex < src.length) {
		const index = src.indexOf(search, fromIndex);

		if (index === -1) {
			break;
		}

		indexes.push(index);
		fromIndex = index + search.length;
	}

	return indexes;
}

function findLineStart(src: string, index: number): number {
	const previousNewline = src.lastIndexOf("\n", index - 1);

	return previousNewline === -1 ? 0 : previousNewline + 1;
}

function findLineEnd(src: string, index: number): number {
	const nextNewline = src.indexOf("\n", index);

	return nextNewline === -1 ? src.length : nextNewline + 1;
}

function findBlockRange(
	src: string,
	blockName: string,
	searchStart = 0,
	searchEnd = src.length,
): BlockRange | null {
	const pattern = new RegExp(`(^[\\t ]*)${blockName}\\s*\\{`, "m");
	const slice = src.slice(searchStart, searchEnd);
	const match = pattern.exec(slice);

	if (!match || match.index == null) {
		return null;
	}

	const start = searchStart + match.index;
	const openBraceIndex = src.indexOf("{", start);

	if (openBraceIndex === -1 || openBraceIndex >= searchEnd) {
		return null;
	}

	let depth = 0;

	for (let index = openBraceIndex; index < searchEnd; index++) {
		const char = src[index];

		if (char === "{") {
			depth += 1;
		}

		if (char === "}") {
			depth -= 1;

			if (depth === 0) {
				return {
					start,
					end: index + 1,
					indent: match[1] ?? "",
				};
			}
		}
	}

	return null;
}

function buildManagedBlock(
	options: ResolvedAndroidAbiSplitsOptions,
	indent: string,
	newline: "\n" | "\r\n",
): string {
	const abiList = options.abis.map((abi) => `"${abi}"`).join(", ");
	const nestedIndent = `${indent}    `;
	const nestedNestedIndent = `${nestedIndent}    `;

	return [
		`${indent}${GENERATED_START}`,
		`${indent}splits {`,
		`${nestedIndent}abi {`,
		`${nestedNestedIndent}enable true`,
		`${nestedNestedIndent}reset()`,
		`${nestedNestedIndent}include ${abiList}`,
		`${nestedNestedIndent}universalApk ${String(options.universalApk)}`,
		`${nestedIndent}}`,
		`${indent}}`,
		`${indent}${GENERATED_END}`,
	].join(newline);
}

function upsertManagedBlock(
	src: string,
	options: ResolvedAndroidAbiSplitsOptions,
): string {
	const newline = detectNewline(src);
	const androidBlock = findBlockRange(src, "android");

	if (!androidBlock) {
		throw new Error(
			`${PLUGIN_TAG}: could not find android { block in app build.gradle`,
		);
	}

	const managedStartIndexes = findAllIndexes(src, GENERATED_START).filter(
		(index) => index >= androidBlock.start && index < androidBlock.end,
	);
	const managedEndIndexes = findAllIndexes(src, GENERATED_END).filter(
		(index) => index >= androidBlock.start && index < androidBlock.end,
	);
	const managedIndent = `${androidBlock.indent}    `;
	const managedBlock = buildManagedBlock(options, managedIndent, newline);

	if (managedStartIndexes.length > 0 || managedEndIndexes.length > 0) {
		if (managedStartIndexes.length !== 1 || managedEndIndexes.length !== 1) {
			throw new Error(
				`${PLUGIN_TAG}: found duplicate or incomplete generated markers`,
			);
		}

		const [managedStart] = managedStartIndexes;
		const [managedEnd] = managedEndIndexes;

		if (managedEnd < managedStart) {
			throw new Error(`${PLUGIN_TAG}: found invalid generated marker order`);
		}

		const replaceStart = findLineStart(src, managedStart);
		const replaceEnd = findLineEnd(src, managedEnd + GENERATED_END.length);

		return `${src.slice(0, replaceStart)}${managedBlock}${src.slice(replaceEnd)}`;
	}

	const androidContent = src.slice(androidBlock.start, androidBlock.end);
	const unmanagedSplits = findBlockRange(androidContent, "splits");

	if (unmanagedSplits) {
		const unmanagedStart = androidBlock.start + unmanagedSplits.start;
		const unmanagedEnd = androidBlock.start + unmanagedSplits.end;
		const replaceStart = findLineStart(src, unmanagedStart);
		const replaceEnd = findLineEnd(src, unmanagedEnd);

		return `${src.slice(0, replaceStart)}${managedBlock}${src.slice(replaceEnd)}`;
	}

	const openBraceIndex = src.indexOf("{", androidBlock.start);
	const insertAt = openBraceIndex + 1;
	const suffix = src.slice(insertAt);
	const needsTrailingNewline =
		!suffix.startsWith("\n") && !suffix.startsWith("\r\n");
	const trailingNewline = needsTrailingNewline ? newline : "";

	return `${src.slice(0, insertAt)}${newline}${managedBlock}${trailingNewline}${suffix}`;
}

const withAndroidAbiSplits: ConfigPlugin<AndroidAbiSplitsOptions> = (
	config,
	options,
) => {
	const resolvedOptions = resolveOptions(options);

	return withAppBuildGradle(config, (modConfig) => {
		if (modConfig.modResults.language !== "groovy") {
			throw new Error(`${PLUGIN_TAG} only supports Groovy build.gradle`);
		}

		modConfig.modResults.contents = upsertManagedBlock(
			modConfig.modResults.contents,
			resolvedOptions,
		);

		return modConfig;
	});
};

export default withAndroidAbiSplits;
