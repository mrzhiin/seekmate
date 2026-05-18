import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { ImageSourcePropType, ImageURISource } from "react-native";
import NitroCookies from "react-native-nitro-cookies";
import {
	NitroImage,
	type NitroImageProps,
	type Image as NitroLoadedImage,
	useImage,
} from "react-native-nitro-image";

const IMAGE_CACHE_DIRECTORY_NAME = "images-cache";
const IMAGE_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const IMAGE_CACHE_MAX_SIZE = 200 * 1024 * 1024;
const TEMPORARY_FILE_MAX_AGE = 60 * 60 * 1000;
const IMAGE_CACHE_BUCKET_COUNT = 256;
const IMAGE_CACHE_CLEANUP_INTERVAL = 30 * 60 * 1000;
const IMAGE_CACHE_BUCKET_MAX_SIZE =
	(IMAGE_CACHE_MAX_SIZE / IMAGE_CACHE_BUCKET_COUNT) * 2;

type NormalizedUriImageSource = ImageURISource & {
	uri: string;
};

export type LoadedImage = NitroLoadedImage;

export type ImageProps = Omit<NitroImageProps, "image"> & {
	source?: ImageSourcePropType | string;
	onImageError?: (error: Error) => void;
	onImageLoad?: (image: NitroLoadedImage) => void;
};

const imageDownloadPromisesMap = new Map<string, Promise<string>>();
const imageCacheDirectory = new Directory(
	Paths.cache,
	IMAGE_CACHE_DIRECTORY_NAME,
);

let lastImageCacheCleanupTime = 0;
let imageCacheCleanupPromise: Promise<void> | undefined;
let nextImageCacheCleanupBucket = 0;

const normalizeSource = (source: ImageProps["source"]) => {
	if (typeof source === "string") {
		return { uri: source } satisfies NormalizedUriImageSource;
	}

	if (source && !Array.isArray(source) && typeof source === "object") {
		const uri = source.uri?.trim();
		if (uri) {
			return { ...source, uri } satisfies NormalizedUriImageSource;
		}
	}

	return source;
};

const isRemoteImageSource = (
	source: ReturnType<typeof normalizeSource>,
): source is NormalizedUriImageSource => {
	return (
		Boolean(source) &&
		!Array.isArray(source) &&
		typeof source === "object" &&
		typeof source.uri === "string" &&
		/^https?:\/\//i.test(source.uri)
	);
};

const createImageRequestKey = (source: NormalizedUriImageSource) => {
	const headers = Object.entries(source.headers ?? {}).sort(([a], [b]) =>
		a.localeCompare(b),
	);

	return JSON.stringify({ headers, uri: source.uri });
};

const createImageCacheFile = async (key: string, url: string) => {
	const hash = await Crypto.digestStringAsync(
		Crypto.CryptoDigestAlgorithm.SHA256,
		key,
	);

	let pathname: string;

	try {
		pathname = new URL(url).pathname;
	} catch {
		pathname = url.split(/[?#]/)[0] ?? "";
	}

	const extension = pathname.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? ".img";
	const directory = new Directory(imageCacheDirectory, hash.slice(0, 2));

	return {
		cacheFile: new File(directory, `${hash}${extension}`),
		temporaryFile: new File(directory, `${hash}.download`),
	};
};

const deleteFileIfExists = (file: File) => {
	try {
		if (file.exists) file.delete();
	} catch {
		// Cache cleanup must not affect image rendering.
	}
};

const cleanupImageCacheBucketIfNeeded = () => {
	const now = Date.now();
	if (imageCacheCleanupPromise) return;
	if (now - lastImageCacheCleanupTime < IMAGE_CACHE_CLEANUP_INTERVAL) return;

	lastImageCacheCleanupTime = now;
	const bucket = nextImageCacheCleanupBucket.toString(16).padStart(2, "0");
	nextImageCacheCleanupBucket =
		(nextImageCacheCleanupBucket + 1) % IMAGE_CACHE_BUCKET_COUNT;

	imageCacheCleanupPromise = cleanupImageCacheBucket(bucket).finally(() => {
		imageCacheCleanupPromise = undefined;
	});
};

const cleanupImageCacheBucket = async (bucket: string) => {
	const directory = new Directory(imageCacheDirectory, bucket);
	if (!directory.exists) return;

	const now = Date.now();
	const files: { file: File; size: number; modificationTime: number }[] = [];
	let totalSize = 0;

	for (const entry of directory.list()) {
		if (!(entry instanceof File) || !entry.exists) continue;

		const modificationTime = entry.modificationTime ?? 0;
		const age = now - modificationTime;
		const shouldDeleteTemporaryFile =
			entry.name.endsWith(".download") && age > TEMPORARY_FILE_MAX_AGE;
		const shouldDeleteCachedFile =
			!entry.name.endsWith(".download") && age > IMAGE_CACHE_MAX_AGE;

		if (shouldDeleteTemporaryFile || shouldDeleteCachedFile) {
			deleteFileIfExists(entry);
			continue;
		}

		totalSize += entry.size;
		files.push({ file: entry, size: entry.size, modificationTime });
	}

	if (totalSize > IMAGE_CACHE_BUCKET_MAX_SIZE) {
		files.sort((a, b) => a.modificationTime - b.modificationTime);

		for (const item of files) {
			if (totalSize <= IMAGE_CACHE_BUCKET_MAX_SIZE) break;

			deleteFileIfExists(item.file);
			totalSize -= item.size;
		}
	}

	if (directory.exists && directory.list().length === 0) {
		directory.delete();
	}
};

const downloadImageFile = async (
	source: NormalizedUriImageSource,
	key: string,
) => {
	const { cacheFile, temporaryFile } = await createImageCacheFile(
		key,
		source.uri,
	);

	if (!cacheFile.parentDirectory.exists) {
		cacheFile.parentDirectory.create({
			idempotent: true,
			intermediates: true,
		});
	}

	if (cacheFile.exists) {
		return cacheFile.uri;
	}

	try {
		let headers = { ...source.headers };
		const lowerCaseHeaders = Object.keys(headers).map((x) => x.toLowerCase());

		const hasCookieHeader = lowerCaseHeaders?.some(
			(name) => name.toLowerCase() === "cookie",
		);

		const hasUAHeader = lowerCaseHeaders?.some(
			(name) => name.toLowerCase() === "user-agent",
		);

		if (!hasCookieHeader) {
			const cookies = await NitroCookies.get(source.uri);
			const cookieHeader = Object.values(cookies)
				.filter((cookie) => cookie.name && cookie.value)
				.map((cookie) => `${cookie.name}=${cookie.value}`)
				.join("; ");

			if (cookieHeader) {
				headers = {
					...headers,
					Cookie: cookieHeader,
				};
			}
		}

		if (!hasUAHeader) {
			const webViewUserAgent = await Constants.getWebViewUserAgentAsync();

			if (webViewUserAgent) {
				headers = {
					...headers,
					"user-agent": webViewUserAgent,
				};
			}
		}

		await File.downloadFileAsync(source.uri, temporaryFile, {
			headers,
			idempotent: true,
		});

		if (!cacheFile.exists) {
			temporaryFile.move(cacheFile);
		} else {
			deleteFileIfExists(temporaryFile);
		}

		cleanupImageCacheBucketIfNeeded();

		return cacheFile.uri;
	} catch (error) {
		deleteFileIfExists(temporaryFile);
		throw error;
	}
};

const loadImageFile = (source: NormalizedUriImageSource, key: string) => {
	const existing = imageDownloadPromisesMap.get(key);
	if (existing) return existing;

	const promise = downloadImageFile(source, key).finally(() => {
		imageDownloadPromisesMap.delete(key);
	});

	imageDownloadPromisesMap.set(key, promise);

	return promise;
};

const useCachedImageSource = (source: ImageProps["source"]) => {
	const normalizedSource = useMemo(() => normalizeSource(source), [source]);
	const requestKey = useMemo(() => {
		return isRemoteImageSource(normalizedSource)
			? createImageRequestKey(normalizedSource)
			: undefined;
	}, [normalizedSource]);

	const normalizedSourceRef = useRef(normalizedSource);
	const [cachedSource, setCachedSource] = useState<{
		key: string;
		source: ReturnType<typeof normalizeSource>;
	}>();
	normalizedSourceRef.current = normalizedSource;

	useEffect(() => {
		let cancelled = false;
		setCachedSource(undefined);

		const source = normalizedSourceRef.current;
		if (!requestKey || !isRemoteImageSource(source)) {
			return;
		}
		const remoteSource = source;
		const remoteRequestKey = requestKey;

		const load = async () => {
			try {
				const fileUri = await loadImageFile(remoteSource, remoteRequestKey);

				if (!cancelled) {
					setCachedSource({
						key: remoteRequestKey,
						source: { uri: fileUri },
					});
				}
			} catch {
				if (!cancelled) {
					setCachedSource(undefined);
				}
			}
		};

		load();
		return () => {
			cancelled = true;
		};
	}, [requestKey]);

	if (!requestKey) {
		return normalizedSource;
	}

	return cachedSource && cachedSource.key === requestKey
		? cachedSource.source
		: undefined;
};

const LoadedNitroImage = ({
	imageSource,
	onError,
	onLoad,
	props,
}: {
	imageSource: NitroImageProps["image"];
	onError?: (error: Error) => void;
	onLoad?: (image: NitroLoadedImage) => void;
	props: Omit<ImageProps, "onImageError" | "onImageLoad" | "source">;
}) => {
	const { image, error } = useImage(imageSource);

	useEffect(() => {
		if (image) {
			onLoad?.(image);
		}
	}, [image, onLoad]);

	useEffect(() => {
		if (error) {
			onError?.(error);
		}
	}, [error, onError]);

	if (!image) {
		return null;
	}

	return <NitroImage {...props} image={image} />;
};

const ImageComponent = memo(
	({ onImageError, onImageLoad, source, ...props }: ImageProps) => {
		const resolvedSource = useCachedImageSource(source);

		const image = useMemo(() => {
			if (typeof resolvedSource === "number") {
				return resolvedSource;
			}

			if (
				!resolvedSource ||
				Array.isArray(resolvedSource) ||
				typeof resolvedSource !== "object" ||
				typeof resolvedSource.uri !== "string"
			) {
				return undefined;
			}

			if (/^https?:\/\//i.test(resolvedSource.uri)) {
				return { url: resolvedSource.uri };
			}

			return { filePath: resolvedSource.uri };
		}, [resolvedSource]);

		if (!image) {
			return null;
		}

		if (!onImageLoad && !onImageError) {
			return <NitroImage {...props} image={image} />;
		}

		return (
			<LoadedNitroImage
				imageSource={image}
				onError={onImageError}
				onLoad={onImageLoad}
				props={props}
			/>
		);
	},
);

const clearDiskCache = async () => {
	if (imageCacheDirectory.exists) {
		imageCacheDirectory.delete();
	}

	return true;
};

const clearMemoryCache = async () => {
	imageDownloadPromisesMap.clear();
	return true;
};

export const Image = Object.assign(ImageComponent, {
	clearDiskCache,
	clearMemoryCache,
});
