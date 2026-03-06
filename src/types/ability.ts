/**
 * Ability & Aspects module types from Wynncraft API v3.
 * Descriptions/HTML use the API Markup parser (span, font-* classes, etc.).
 * @see https://docs.wynncraft.com/docs/modules/ability.html
 */

export interface AbilityIconValue {
  id: string;
  name: string;
  customModelData: string;
}

export interface AbilityIcon {
  value: AbilityIconValue | string;
  format: string;
}

export interface AbilityArchetype {
  name: string;
  description: string;
  shortDescription: string;
  icon: AbilityIcon;
  slot: number;
}

export interface AbilityRequirements {
  ABILITY_POINTS?: number;
  NODE?: string;
  ARCHETYPE?: { name: string; amount: number };
}

export interface AbilityTreeNode {
  name: string;
  icon: AbilityIcon;
  slot: number;
  coordinates: { x: number; y: number };
  description: string[];
  requirements: AbilityRequirements;
  links: string[] | null;
  locks: string[] | null;
  page: number;
}

/** GET .../tree/:class - 1 hour TTL */
export interface AbilityTreeResponse {
  archetypes: Record<string, AbilityArchetype>;
  pages: Record<string, Record<string, AbilityTreeNode>>;
}

export interface AbilityMapNodeCoordinates {
  x: number;
  y: number;
}

/** Normal map: keyed by page number */
export interface AbilityMapAbilityMeta {
  icon: AbilityIcon;
  page: number;
  id: string;
}

export interface AbilityMapAbilityEntry {
  type: "ability";
  coordinates: AbilityMapNodeCoordinates;
  meta: AbilityMapAbilityMeta;
  family: string[];
}

export interface AbilityMapConnectorMeta {
  icon: string;
  page: number;
}

export interface AbilityMapConnectorEntry {
  type: "connector";
  coordinates: AbilityMapNodeCoordinates;
  meta: AbilityMapConnectorMeta;
  family: string[];
}

export type AbilityMapEntry =
  | AbilityMapAbilityEntry
  | AbilityMapConnectorEntry;

/** GET .../map/:class - normal map: record of page number -> entries */
export type AbilityMapResponse = Record<string, AbilityMapEntry[]>;

/** Player map: array of entries (API doc has typo "familiy") */
export interface AbilityMapPlayerEntry {
  type: "ability" | "connector";
  coordinates: AbilityMapNodeCoordinates;
  meta: AbilityMapAbilityMeta | AbilityMapConnectorMeta;
  family?: string[];
  familiy?: string[];
}

export type AbilityMapPlayerResponse = AbilityMapPlayerEntry[];
