import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const WYNN_API_BASE =
	process.env.NEXT_PUBLIC_WYNN_API_BASE ?? "https://cdn.wynncraft.com";

/**
 * Build full URL for a Wynncraft CDN path (e.g. rank badge image).
 */
export function rankBadgeUrl(path: string): string {
	const clean = path.startsWith("/") ? path.slice(1) : path;
	return `${WYNN_API_BASE}/${clean}`;
}

const FIXED_LOCALE = "en-US";

/**
 * Format an ISO date string (e.g. 2026-03-05T04:01:47.340000Z) as "DD Month Year" (e.g. "05 March 2026").
 */
export function formatDateDDMonthYear(isoDate: string): string {
	const d = new Date(isoDate);
	if (Number.isNaN(d.getTime())) return isoDate;
	const month = d.toLocaleDateString(FIXED_LOCALE, { month: "long" });
	const day = d.getUTCDate();
	const year = d.getUTCFullYear();
	return `${day} ${month} ${year}`;
}

export function tierRoman(tier: number): string {
	return [
		"I",
		"II",
		"III",
		"IV",
		"V",
		"VI",
		"VII",
		"VIII",
		"IX",
		"X",
		"XI",
		"XII",
		"XIII",
		"XIV",
		"XV",
		"XVI",
		"XVII",
		"XVIII",
		"XIX",
		"XX",
	][tier - 1];
}

/**
 * Format an ISO date string as time elapsed from now (e.g. "2 days ago", "3 hours ago").
 */
export function formatTimeElapsed(isoDate: string): string {
	const d = new Date(isoDate);
	if (Number.isNaN(d.getTime())) return isoDate;
	const now = Date.now();
	const diffMs = now - d.getTime();
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHour = Math.floor(diffMin / 60);
	const diffDay = Math.floor(diffHour / 24);
	const diffWeek = Math.floor(diffDay / 7);
	const diffMonth = Math.floor(diffDay / 30);
	const diffYear = Math.floor(diffDay / 365);

	if (diffSec < 60) return "just now";
	if (diffMin < 60) return `${diffMin} min ago`;
	if (diffHour < 24) return `${diffHour} hr ago`;
	if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
	if (diffWeek < 4) return `${diffWeek} wk${diffWeek === 1 ? "" : "s"} ago`;
	if (diffMonth < 12) return `${diffMonth} mo ago`;
	return `${diffYear} yr ago`;
}
