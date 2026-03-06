"use client";

/**
 * Renders HTML from Wynncraft API Markup.
 * API uses only <span>, font-* classes (font-ascii, font-common, font-five, font-wynnic, font-high_gavelian),
 * and inline styles: color, text-decoration, font-style, font-weight, margin-left (7.5px | 20px).
 * Fonts are loaded from cdn.wynncraft.com/nextgen/fonts (see globals.css).
 * Content is from our proxy; for user-generated content, sanitize (e.g. DOMPurify) first.
 */
export function AbilityMarkup({
  html,
  className,
  as: Tag = "span",
}: {
  html: string;
  className?: string;
  as?: "span" | "div" | "p";
}) {
  if (!html?.trim()) return null;
  return (
    <Tag
      className={`wynn-api-markup ${className ?? ""}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  );
}
