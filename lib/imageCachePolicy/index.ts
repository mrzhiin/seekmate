export const IMAGE_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
export const IMAGE_CACHE_MAX_SIZE = 256 * 1024 * 1024;
export const IMAGE_CACHE_WRITE_GRACE = 60 * 1000;

export type ImageCacheEntry = {
	size: number;
	modificationTime: number;
	lastAccessTime?: number;
};

export const selectImageCacheEvictions = <T extends ImageCacheEntry>(
	entries: T[],
	now: number,
) => {
	const expired = entries.filter(
		(entry) =>
			now - entry.modificationTime >= IMAGE_CACHE_MAX_AGE &&
			now - (entry.lastAccessTime ?? 0) >= IMAGE_CACHE_WRITE_GRACE,
	);
	const expiredSet = new Set(expired);
	const retained = entries.filter((entry) => !expiredSet.has(entry));
	let size = retained.reduce((total, entry) => total + entry.size, 0);

	// shortcut: The size budget permits one minute of decoding grace; use a reserved-byte quota if a hard cap is needed.
	for (const entry of retained.sort(
		(a, b) => a.modificationTime - b.modificationTime,
	)) {
		if (size <= IMAGE_CACHE_MAX_SIZE) break;
		if (
			now - Math.max(entry.modificationTime, entry.lastAccessTime ?? 0) <
			IMAGE_CACHE_WRITE_GRACE
		)
			continue;
		expired.push(entry);
		size -= entry.size;
	}
	return expired;
};
