import Constants from "expo-constants";
import { File } from "expo-file-system";
import { startActivityAsync } from "expo-intent-launcher";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Pressable } from "react-native-gesture-handler";
import { ErrorFallback } from "@/components/errorFallback";
import { Spinner } from "@/components/spinner";
import { Image, type LoadedImage } from "@/components/ui/image";
import { config } from "../../config";
import type { ExtractFromPredicate, isImageNode } from "../types";

class InvalidImageUrlError extends Error {
	constructor() {
		super("Invalid image URL");
		this.name = "InvalidImageUrlError";
	}
}

let webViewUserAgentPromise: Promise<string | null> | undefined;

const normalizeImageUrl = (src: string) => {
	const value = src.trim();

	if (!value) return undefined;

	const baseUrl = /^[a-z][a-z\d+.-]*:/i.test(value)
		? undefined
		: config.siteUrl;

	let url: URL;
	try {
		url = new URL(value, baseUrl);
	} catch {
		return undefined;
	}

	if (url.protocol !== "http:" && url.protocol !== "https:") {
		return undefined;
	}

	return url.toString();
};

const useRendererImageRequestSource = (url?: string) => {
	const [userAgent, setUserAgent] = useState<string | null>();

	useEffect(() => {
		let cancelled = false;
		setUserAgent(undefined);
		if (!url) return;

		const load = async () => {
			webViewUserAgentPromise ??= Constants.getWebViewUserAgentAsync();
			const value = await webViewUserAgentPromise;

			if (!cancelled) {
				setUserAgent(value);
			}
		};

		load();

		return () => {
			cancelled = true;
		};
	}, [url]);

	return useMemo(() => {
		if (!url) {
			return {
				error: new InvalidImageUrlError(),
				source: undefined,
			};
		}

		if (userAgent === undefined) {
			return {
				error: undefined,
				source: undefined,
			};
		}

		return {
			error: undefined,
			source: {
				uri: url,
				headers: {
					Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
					Referer: config.siteUrl,
					...(userAgent ? { "User-Agent": userAgent } : {}),
				},
			},
		};
	}, [url, userAgent]);
};

const RendererImageView = memo(
	({
		source,
	}: {
		source: NonNullable<
			ReturnType<typeof useRendererImageRequestSource>["source"]
		>;
	}) => {
		const isSavingRef = useRef(false);
		const [image, setImage] = useState<LoadedImage>();
		const [error, setError] = useState<Error>();

		if (error) {
			return <ErrorFallback />;
		}

		const aspect = image ? (image.width ?? 1) / (image.height ?? 1) : undefined;

		return (
			<Pressable
				onLongPress={async () => {
					if (!image) return;
					if (isSavingRef.current) return;

					try {
						isSavingRef.current = true;

						const path = await image.saveToTemporaryFileAsync("png");
						const file = new File(`file://${path}`);

						if (file.exists && file.contentUri) {
							await startActivityAsync("android.intent.action.VIEW", {
								data: file.contentUri,
								flags: 1,
								type: "image/png",
							});
						}
					} finally {
						isSavingRef.current = false;
					}
				}}
			>
				{!image && <Spinner />}
				<Image
					onImageError={setError}
					onImageLoad={setImage}
					source={source}
					style={{
						opacity: image ? 1 : 0,
						width: image ? "100%" : 1,
						height: image ? undefined : 1,
						maxWidth: image?.width,
						aspectRatio: aspect,
					}}
				/>
			</Pressable>
		);
	},
);

export const ImageRenderer = memo(
	({ node }: { node: ExtractFromPredicate<isImageNode> }) => {
		const src = useMemo(() => normalizeImageUrl(node.src), [node.src]);
		const { source, error } = useRendererImageRequestSource(src);

		if (error) {
			return <ErrorFallback />;
		}

		if (!source) {
			return <Spinner />;
		}

		return <RendererImageView key={source.uri} source={source} />;
	},
);
