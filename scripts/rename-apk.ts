import fs from "node:fs";
import path from "node:path";
import * as v from "valibot";

const ApkFilter = v.object({
	filterType: v.union([v.string(), v.number()]),
	value: v.pipe(v.string(), v.nonEmpty()),
});

const ApkElement = v.object({
	outputFile: v.pipe(v.string(), v.nonEmpty()),
	versionName: v.pipe(v.string(), v.nonEmpty()),
	versionCode: v.union([v.pipe(v.string(), v.nonEmpty()), v.number()]),
	filters: v.optional(v.array(ApkFilter)),
});

const OutputMetadata = v.pipe(
	v.object({
		applicationId: v.optional(v.pipe(v.string(), v.nonEmpty())),
		packageName: v.optional(v.pipe(v.string(), v.nonEmpty())),
		versionName: v.optional(v.string()),
		versionCode: v.optional(v.union([v.string(), v.number()])),
		elements: v.optional(v.array(ApkElement)),
	}),
	v.check(
		(input) => Boolean(input.applicationId ?? input.packageName),
		"output-metadata.json must include applicationId or packageName",
	),
);

const PackageName = v.pipe(v.string(), v.nonEmpty());

type OutputMetadata = v.InferOutput<typeof OutputMetadata>;

const outputDir = path.resolve("android/app/build/outputs/apk/release");
const metadataPath = path.join(outputDir, "output-metadata.json");

if (!fs.existsSync(outputDir)) {
	throw new Error(`APK output directory not found: ${outputDir}`);
}

if (!fs.existsSync(metadataPath)) {
	throw new Error(`APK output metadata file not found: ${metadataPath}`);
}

const metadata: OutputMetadata = v.parse(
	OutputMetadata,
	JSON.parse(fs.readFileSync(metadataPath, "utf8")),
);
const packageName = v.parse(
	PackageName,
	metadata.applicationId ?? metadata.packageName,
);

for (const element of metadata.elements ?? []) {
	const sourceName = element.outputFile;
	if (!sourceName) {
		throw new Error("Missing outputFile in output-metadata.json element");
	}

	const versionName = element.versionName ?? metadata.versionName;
	const versionCode = String(element.versionCode ?? metadata.versionCode ?? "");
	if (!versionName || !versionCode) {
		throw new Error(`Missing versionName/versionCode for ${sourceName}`);
	}

	const abiFilter = (element.filters ?? []).find((filter) => {
		const filterType =
			typeof filter.filterType === "string"
				? filter.filterType.toUpperCase()
				: "";
		return filterType === "ABI" || filter.filterType === 3;
	});
	const abi = abiFilter?.value ?? "universal";

	const sourcePath = path.join(outputDir, sourceName);
	const targetName = `${packageName}-v${versionName}-${versionCode}-${abi}.apk`;
	const targetPath = path.join(outputDir, targetName);

	if (!fs.existsSync(sourcePath)) {
		throw new Error(`APK file not found: ${sourcePath}`);
	}

	fs.renameSync(sourcePath, targetPath);
	console.log(`${sourceName} -> ${targetName}`);
}
