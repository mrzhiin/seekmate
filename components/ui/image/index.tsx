import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";
import PQueue from "p-queue";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { ImageSourcePropType, ImageURISource } from "react-native";
import NitroCookies from "react-native-nitro-cookies";
import {
	NitroImage,
	type NitroImageProps,
	type Image as NitroLoadedImage,
	useImage,
} from "react-native-nitro-image";
import { useStore } from "zustand";
import { waitForSessionCleanup } from "@/lib/auth/sessionCommand";
import {
	IMAGE_CACHE_MAX_AGE,
	IMAGE_CACHE_WRITE_GRACE,
	selectImageCacheEvictions,
} from "@/lib/imageCachePolicy";
import { Sentry } from "@/lib/sentry";
import { userStore } from "@/store/userStore";

const IMAGE_CACHE_DIRECTORY_NAME = "images-cache";
const TEMPORARY_FILE_MAX_AGE = 60 * 60 * 1000;
const IMAGE_CACHE_CLEANUP_INTERVAL = 30 * 60 * 1000;
const IMAGE_DOWNLOAD_CONCURRENCY = 4;

type NormalizedUriImageSource = ImageURISource & {
	uri: string;
};

export type LoadedImage = NitroLoadedImage;

export type ImageErrorContext = Record<string, unknown>;

export type ImageError = Error & {
	imageContext?: ImageErrorContext;
};

export type ImageProps = Omit<NitroImageProps, "image"> & {
	source?: ImageSourcePropType | string;
	onImageError?: (error: Error) => void;
	onImageLoad?: (image: NitroLoadedImage) => void;
};

const imageDownloadPromisesMap = new Map<string, Promise<string>>();
const recentImageCacheReads = new Map<string, number>();
const imageDownloadQueue = new PQueue({
	concurrency: IMAGE_DOWNLOAD_CONCURRENCY,
});
const imageCacheDirectory = new Directory(
	Paths.cache,
	IMAGE_CACHE_DIRECTORY_NAME,
);

let lastImageCacheCleanupTime = 0;
let imageCacheCleanupPromise: Promise<void> | undefined;
let imageCacheCleanupTimer: ReturnType<typeof setTimeout> | undefined;

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

const createImageRequestKey = (
	source: NormalizedUriImageSource,
	userId: number | undefined,
) => {
	const headers = Object.entries(source.headers ?? {}).sort(([a], [b]) =>
		a.localeCompare(b),
	);

	return JSON.stringify({ headers, uri: source.uri, userId });
};

const createImageError = (
	error: unknown,
	context: ImageErrorContext,
): ImageError => {
	const imageError = (
		error instanceof Error ? error : new Error(String(error))
	) as ImageError;

	imageError.imageContext = {
		...imageError.imageContext,
		...context,
	};

	return imageError;
};

const getFileContext = (uri: string) => {
	try {
		const file = new File(uri);

		return {
			exists: file.exists,
			modificationTime: file.modificationTime,
			name: file.name,
			size: file.size,
			uri: file.uri,
		};
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : String(error),
			uri,
		};
	}
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

const cleanupImageCacheIfNeeded = (force = false) => {
	const now = Date.now();
	if (imageCacheCleanupPromise) return;
	if (!force && now - lastImageCacheCleanupTime < IMAGE_CACHE_CLEANUP_INTERVAL)
		return;

	lastImageCacheCleanupTime = now;
	imageCacheCleanupPromise = cleanupImageCache()
		.catch((error) => {
			Sentry.withScope((scope) => {
				scope.setTag("cache", "image");
				Sentry.captureException(error);
			});
			// Cache cleanup must not affect image rendering.
		})
		.finally(() => {
			imageCacheCleanupPromise = undefined;
		});
};

const cleanupImageCache = async () => {
	if (!imageCacheDirectory.exists) return;
	const now = Date.now();
	for (const [uri, readAt] of recentImageCacheReads) {
		if (now - readAt >= IMAGE_CACHE_WRITE_GRACE)
			recentImageCacheReads.delete(uri);
	}
	const files: {
		file: File;
		size: number;
		modificationTime: number;
		lastAccessTime?: number;
	}[] = [];
	for (const directory of imageCacheDirectory.list()) {
		if (!(directory instanceof Directory) || !directory.exists) continue;
		for (const entry of directory.list()) {
			if (!(entry instanceof File) || !entry.exists) continue;
			const modificationTime = entry.modificationTime ?? 0;
			if (entry.name.endsWith(".download")) {
				if (now - modificationTime >= TEMPORARY_FILE_MAX_AGE)
					deleteFileIfExists(entry);
			} else {
				files.push({
					file: entry,
					size: entry.size,
					modificationTime,
					lastAccessTime: recentImageCacheReads.get(entry.uri),
				});
			}
		}
		// Yield between buckets rather than blocking the UI for the entire scan.
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
	for (const entry of selectImageCacheEvictions(files, now)) {
		if (
			Date.now() - (recentImageCacheReads.get(entry.file.uri) ?? 0) >=
			IMAGE_CACHE_WRITE_GRACE
		)
			deleteFileIfExists(entry.file);
	}
};

imageDownloadQueue.addEventListener("idle", () => {
	cleanupImageCacheIfNeeded();
	if (imageCacheCleanupTimer) return;
	imageCacheCleanupTimer = setTimeout(() => {
		imageCacheCleanupTimer = undefined;
		cleanupImageCacheIfNeeded(true);
	}, IMAGE_CACHE_WRITE_GRACE);
});

const downloadImageFile = async (
	source: NormalizedUriImageSource,
	key: string,
	userId: number | undefined,
) => {
	await waitForSessionCleanup();
	if (userStore.getState().id !== userId)
		throw new Error("Image session changed");
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

	recentImageCacheReads.set(cacheFile.uri, Date.now());
	cleanupImageCacheIfNeeded();

	if (
		cacheFile.exists &&
		cacheFile.size > 0 &&
		Date.now() - (cacheFile.modificationTime ?? 0) < IMAGE_CACHE_MAX_AGE
	) {
		return cacheFile.uri;
	}

	deleteFileIfExists(cacheFile);
	deleteFileIfExists(temporaryFile);

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
			let webViewUserAgent: string | null = null;

			try {
				webViewUserAgent = await Constants.getWebViewUserAgentAsync();
			} catch {
				webViewUserAgent = null;
			}

			if (webViewUserAgent) {
				headers = {
					...headers,
					"user-agent": webViewUserAgent,
				};
			}
		}

		if (userStore.getState().id !== userId)
			throw new Error("Image session changed");
		await File.downloadFileAsync(source.uri, temporaryFile, {
			headers,
			idempotent: true,
		});

		if (!temporaryFile.exists || temporaryFile.size <= 0) {
			throw new Error("Downloaded temporary image file does not exist");
		}

		if (userStore.getState().id !== userId)
			throw new Error("Image session changed");
		await temporaryFile.move(cacheFile);

		if (!cacheFile.exists || cacheFile.size <= 0) {
			throw new Error("Downloaded image cache file does not exist");
		}

		return cacheFile.uri;
	} catch (error) {
		deleteFileIfExists(cacheFile);
		deleteFileIfExists(temporaryFile);
		throw error;
	}
};

const loadImageFile = (
	source: NormalizedUriImageSource,
	key: string,
	userId: number | undefined,
) => {
	const existing = imageDownloadPromisesMap.get(key);
	if (existing) return existing;

	const promise = imageDownloadQueue
		.add(() => downloadImageFile(source, key, userId))
		.finally(() => {
			imageDownloadPromisesMap.delete(key);
		});

	imageDownloadPromisesMap.set(key, promise);

	return promise;
};

const useCachedImageSource = (
	source: ImageProps["source"],
	onError?: (error: Error) => void,
) => {
	const userId = useStore(userStore, (s) => s.id);
	const normalizedSource = useMemo(() => normalizeSource(source), [source]);
	const onErrorRef = useRef(onError);
	onErrorRef.current = onError;
	const requestKey = useMemo(() => {
		return isRemoteImageSource(normalizedSource)
			? createImageRequestKey(normalizedSource, userId)
			: undefined;
	}, [normalizedSource, userId]);

	const normalizedSourceRef = useRef(normalizedSource);
	const [cachedSource, setCachedSource] = useState<{
		key: string;
		source: NitroImageProps["image"];
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
				const fileUri = await loadImageFile(
					remoteSource,
					remoteRequestKey,
					userId,
				);

				if (!cancelled) {
					setCachedSource({
						key: remoteRequestKey,
						source: { url: fileUri },
					});
				}
			} catch (error) {
				if (!cancelled) {
					onErrorRef.current?.(
						createImageError(error, {
							requestKey: remoteRequestKey,
							source: remoteSource,
							stage: "download",
						}),
					);
					setCachedSource(undefined);
				}
			}
		};

		load();
		return () => {
			cancelled = true;
		};
	}, [requestKey, userId]);

	if (!requestKey) {
		if (typeof normalizedSource === "number") {
			return normalizedSource;
		}

		if (
			!normalizedSource ||
			Array.isArray(normalizedSource) ||
			typeof normalizedSource !== "object" ||
			typeof normalizedSource.uri !== "string"
		) {
			return undefined;
		}

		if (/^(?:https?|file):\/\//i.test(normalizedSource.uri)) {
			return { url: normalizedSource.uri };
		}

		return { filePath: normalizedSource.uri };
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
			const imageSourceUrl =
				typeof imageSource === "object" &&
				!Array.isArray(imageSource) &&
				"url" in imageSource &&
				typeof imageSource.url === "string"
					? imageSource.url
					: undefined;
			const file = imageSourceUrl?.startsWith("file://")
				? getFileContext(imageSourceUrl)
				: undefined;

			onError?.(
				createImageError(error, {
					file,
					fileExists: file && "exists" in file ? file.exists : undefined,
					fileSize: file && "size" in file ? file.size : undefined,
					imageSource,
					imageSourceUrl,
					stage: "useImage",
				}),
			);
		}
	}, [error, imageSource, onError]);

	if (!image) {
		return null;
	}

	return <NitroImage {...props} image={image} />;
};

const ImageComponent = memo(
	({ onImageError, onImageLoad, source, ...props }: ImageProps) => {
		const image = useCachedImageSource(source, onImageError);

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
	imageDownloadQueue.pause();
	try {
		await imageDownloadQueue.onPendingZero();
		await imageCacheCleanupPromise;
		clearTimeout(imageCacheCleanupTimer);
		imageCacheCleanupTimer = undefined;
		recentImageCacheReads.clear();
		if (imageCacheDirectory.exists) imageCacheDirectory.delete();
		lastImageCacheCleanupTime = 0;
		return true;
	} finally {
		imageDownloadQueue.start();
	}
};

export const Image = Object.assign(ImageComponent, { clearDiskCache });
