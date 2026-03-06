/**
 * Wynncraft CDN URLs for ability tree node and connector icons.
 * @see https://cdn.wynncraft.com/nextgen/abilities/2.1/nodes/
 * @see https://cdn.wynncraft.com/nextgen/abilities/2.1/connectors/grid/
 */

import { wynnAbilityConnectorUrl, wynnAbilityNodeUrl } from "@/lib/wynn-cdn";

export type AbilityIconLike =
  | { value: { name?: string } | string; format?: string }
  | undefined
  | null;

/** "active" = {name}_active.png, "default" = {name}.png */
export type AbilityIconVariant = "active" | "default";

function getIconName(icon: AbilityIconLike): string | null {
  if (!icon?.value) return null;
  const name =
    typeof icon.value === "object" && icon.value != null && "name" in icon.value
      ? String((icon.value as { name: string }).name)
      : null;
  return name?.trim() ?? null;
}

/**
 * Returns the icon URL for a node icon, or null if not available.
 * @param variant - "active" → {name}_active.png, "default" → {name}.png
 */
export function getAbilityNodeIconUrl(
  icon: AbilityIconLike,
  variant: AbilityIconVariant = "default"
): string | null {
  const name = getIconName(icon);
  if (!name) return null;
  const filename = variant === "active" ? `${name}_active.png` : `${name}.png`;
  return wynnAbilityNodeUrl(filename);
}

/**
 * Returns the icon URL for a connector (e.g. connector_up_down, connector_right_left).
 * @param iconName - meta.icon string from map connector entry
 * @param variant - "active" → {iconName}_active.png, "default" → {iconName}.png
 */
export function getConnectorIconUrl(
  iconName: string,
  variant: AbilityIconVariant = "default"
): string {
  const name = (iconName ?? "").trim() || "connector_up_down";
  const filename = variant === "active" ? `${name}_active.png` : `${name}.png`;
  return wynnAbilityConnectorUrl(filename);
}
