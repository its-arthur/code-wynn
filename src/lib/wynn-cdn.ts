/**
 * Wynncraft CDN (nextgen) URL helpers for images, fonts, and assets.
 * Base: https://cdn.wynncraft.com/nextgen/
 */

const WYNN_NEXTGEN_BASE =
	process.env.NEXT_PUBLIC_WYNN_CDN_NEXTGEN ??
	"https://cdn.wynncraft.com/nextgen";

/**
 * Build a full URL for a path under nextgen (no leading slash).
 * @param pathSegments - path parts, joined with / (e.g. "leaderboard", "icons", "strength.webp")
 */
export function wynnNextgenUrl(...pathSegments: (string | number)[]): string {
	const path = pathSegments
		.map(String)
		.map((s) => s.replace(/^\/+|\/+$/g, ""))
		.filter(Boolean)
		.join("/");
	return path ? `${WYNN_NEXTGEN_BASE}/${path}` : WYNN_NEXTGEN_BASE;
}

/**
 * Build a full nextgen CDN URL from a raw path string (leading slash optional).
 * Use when the API already returns a path segment rather than individual parts.
 * @example wynnNextgenPath("articles/banners/foo.webp")
 */
export function wynnNextgenPath(path: string): string {
	return wynnNextgenUrl(path);
}

/** Class icon (artboards) e.g. mage.webp, warrior.webp */
export function wynnClassIconUrl(
	className: string,
	ext: "webp" | "png" = "webp",
): string {
	return wynnNextgenUrl(
		"classes",
		"icons",
		"artboards",
		`${className.toLowerCase()}.${ext}`,
	);
}

/** Class picture by class name e.g. mage.webp */
export function wynnClassPictureUrl(
	className: string,
	ext: "webp" | "png" = "webp",
): string {
	return wynnNextgenUrl(
		"classes",
		"picture",
		`${className.toLowerCase()}.${ext}`,
	);
}

/** Leaderboard / profession / skill list icon e.g. fishing.webp, strength.webp */
export function wynnLeaderboardIconUrl(
	name: string,
	ext: "webp" | "png" | "svg" = "webp",
): string {
	return wynnNextgenUrl("leaderboard", "icons", `${name}.${ext}`);
}

/** Skill book/stat icon e.g. strength_book.svg */
export function wynnSkillIconUrl(filename: string): string {
	const name =
		filename.endsWith(".svg") ||
		filename.endsWith(".webp") ||
		filename.endsWith(".png")
			? filename
			: `${filename}.webp`;
	return wynnNextgenUrl("skill", name);
}

/** Ability tree node icon (use ability-icons.ts for variant logic) */
export function wynnAbilityNodeUrl(filename: string): string {
	return wynnNextgenUrl("abilities", "2.1", "nodes", filename);
}

/** Ability connector icon */
export function wynnAbilityConnectorUrl(filename: string): string {
	return wynnNextgenUrl("abilities", "2.1", "connectors", "grid", filename);
}

/** Font file (woff) for API Markup */
export function wynnFontUrl(
	fontName: string,
	ext: "woff" | "woff2" = "woff",
): string {
	return wynnNextgenUrl("fonts", `${fontName}.${ext}`);
}

/** Item guide image e.g. spear.fire3.webp → https://cdn.wynncraft.com/nextgen/itemguide/3.3/spear.fire3.webp */
export function wynnItemGuideUrl(iconName: string): string {
	const name = iconName.endsWith(".webp") ? iconName : `${iconName}.webp`;
	return wynnNextgenUrl("itemguide", "3.3", name);
}

/** Tome icon e.g. guild → https://cdn.wynncraft.com/nextgen/itemguide/3.3/tome.guild.webp */
export function wynnTomeIconUrl(subtype: string): string {
	const slug =
		(subtype ?? "").trim().toLowerCase().replace(/\s+/g, "_") || "guild";
	return wynnItemGuideUrl(`tome.${slug}`);
}

/** Dungeon icon; name has spaces and hyphens replaced with underscore (e.g. "Dark Manor" → dung/Dark_Manor.webp) */
export function wynnDungeonIconUrl(
	name: string,
	ext: "webp" | "png" = "webp",
): string {
	const slug = (name ?? "")
		.trim()
		.replace(/\s+/g, "_")
		.replace(/-/g, "_")
		.toLowerCase();
	return wynnNextgenUrl("dung", `${slug || "unknown"}.${ext}`);
}

/** Raid icon; name can contain spaces (e.g. "Nest of the Grootslangs" → raids/Nest of the Grootslangs.webp) */
export function wynnRaidIconUrl(
	name: string,
	ext: "webp" | "png" = "webp",
): string {
	const slug = (name ?? "").trim() || "unknown";
	return wynnNextgenUrl("raids", `${slug}.${ext}`);
}
