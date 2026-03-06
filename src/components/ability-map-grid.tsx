"use client";

import { useRef, useState } from "react";
import { getAbilityNodeIconUrl, getConnectorIconUrl } from "@/lib/ability-icons";
import { AbilityMarkup } from "@/components/ability-markup";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  AbilityTreeResponse,
  AbilityMapEntry,
  AbilityMapAbilityEntry,
  AbilityMapConnectorEntry,
  AbilityTreeNode,
} from "@/types/ability";

const NODE_FALLBACK_COLOR = "bg-muted";

/** Icon size in px by node type: nodeRed, nodeBlue, etc. */
function getAbilityNodeSizePx(icon: AbilityMapAbilityEntry["meta"]["icon"]): number {
  const raw = icon?.value;
  const name =
    typeof raw === "object" && raw != null && "name" in raw
      ? String((raw as { name: string }).name).trim().toLowerCase().replace(/^abilitytree\./, "")
      : typeof raw === "string"
        ? String(raw).trim().toLowerCase().replace(/^abilitytree\./, "")
        : "";
  if (name === "nodered") return 65;
  if (name === "nodepurple") return 55;
  if (name === "nodeblue") return 64;
  if (name === "nodewhite") return 50;
  if (name === "nodeyellow") return 45;
  return 48; // default (was h-24 = 6rem = 96px in default theme; 48px is a sensible default)
}

/** Normalize connector meta.icon to a string (full map uses string; player map may differ). */
function getConnectorIconName(meta: AbilityMapConnectorEntry["meta"]): string {
  const raw = meta?.icon;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (raw && typeof raw === "object" && "name" in (raw as object))
    return String((raw as { name: string }).name).trim() || "connector_up_down";
  return "connector_up_down";
}

export interface AbilityMapGridProps {
  /** Full class map from getAbilityMap — defines layout and all nodes/connectors to render. */
  entries: AbilityMapEntry[];
  /** Tree from getAbilityTree — used only for node names and popover content. */
  tree: AbilityTreeResponse | null;
  /** Player character map — entries here are rendered as "active"; layout still comes from entries. */
  playerMapEntries: AbilityMapEntry[];
  /** Cell size in pixels. */
  cellPx?: number;
  /** Max height of the scrollable area. */
  maxHeight?: string;
  /** Whether ability nodes open a popover on click. */
  showAbilityPopover?: boolean;
  className?: string;
}

export function AbilityMapGrid({
  entries,
  tree,
  playerMapEntries,
  cellPx = 64,  
  maxHeight = "50vh",
  showAbilityPopover = true,
  className,
}: AbilityMapGridProps) {
  const [hoveredAbilityId, setHoveredAbilityId] = useState<string | null>(null);
  if (entries.length === 0) return null;

  const abilities = entries.filter((e): e is AbilityMapAbilityEntry => e.type === "ability");
  const connectors = entries.filter((e): e is AbilityMapConnectorEntry => e.type === "connector");
  const allCoords = entries.map((e) => e.coordinates);
  const minX = Math.min(...allCoords.map((c) => c.x));
  const minY = Math.min(...allCoords.map((c) => c.y));
  const maxX = Math.max(...allCoords.map((c) => c.x));
  const maxY = Math.max(...allCoords.map((c) => c.y));
  const cols = maxX - minX + 1;
  const rows = maxY - minY + 1;

  const activeAbilityIds = new Set(
    playerMapEntries
      .filter((e): e is AbilityMapAbilityEntry => e.type === "ability")
      .map((e) => e.meta.id)
  );
  const activeConnectorKeys = new Set(
    playerMapEntries
      .filter((e): e is AbilityMapConnectorEntry => e.type === "connector")
      .map((e) => `${e.coordinates.x},${e.coordinates.y}`)
  );
  /** Player's connector icon per cell — active layer may use a different icon (e.g. connector_up_down) than full map (e.g. connector_up_right_down). */
  const activeConnectorIconNames = new Map(
    playerMapEntries
      .filter((e): e is AbilityMapConnectorEntry => e.type === "connector")
      .map((e) => [`${e.coordinates.x},${e.coordinates.y}`, getConnectorIconName(e.meta)])
  );

  const getTreeName = (page: number, id: string): string | null => {
    if (!tree?.pages) return null;
    const pageNodes = tree.pages[String(page)];
    if (!pageNodes?.[id]) return null;
    const raw = pageNodes[id].name;
    if (typeof raw !== "string") return id;
    return raw.replace(/<[^>]+>/g, "").trim() || id;
  };

  const getTreeNode = (page: number, id: string): AbilityTreeNode | null => {
    if (!tree?.pages) return null;
    const pageNodes = tree.pages[String(page)];
    return pageNodes?.[id] ?? null;
  };

  return (
    <div
      className={`overflow-auto rounded-lg border bg-muted/20 p-4 ${className ?? ""}`}
      style={{ maxHeight, width: "100%" }}
    >
      <div
        className="relative mx-auto w-full"
        style={{ width: cellPx * cols }}
      >
        <div
          className="relative grid w-full"
          style={{
            zIndex: 1,
            gridTemplateColumns: `repeat(${cols}, minmax(0, ${cellPx}px))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, ${cellPx}px))`,
            gap: 0,
            rowGap: 0,
            columnGap: 0,
            width: cellPx * cols,
            minHeight: rows * cellPx,
          }}
        >
        {abilities.map((e, i) => {
          const col = e.coordinates.x - minX + 1;
          const row = e.coordinates.y - minY + 1;
          const treeName = getTreeName(e.meta.page, e.meta.id);
          const label = treeName ?? e.meta.id;
          const isActive = activeAbilityIds.has(e.meta.id);
          const showActiveIcon = isActive || hoveredAbilityId === e.meta.id;
          const defaultIconUrl = getAbilityNodeIconUrl(e.meta.icon, "default");
          const activeIconUrl = getAbilityNodeIconUrl(e.meta.icon, "active");
          const treeNode = getTreeNode(e.meta.page, e.meta.id);
          const iconSizePx = getAbilityNodeSizePx(e.meta.icon);
          const iconSizeStyle = {
            width: iconSizePx,
            height: iconSizePx,
            minWidth: iconSizePx,
            minHeight: iconSizePx,
          };
          const trigger = (
            <div
              className="relative flex flex-col items-center justify-center w-full h-full min-w-0 min-h-0 transition-opacity hover:opacity-90"
            >
              {defaultIconUrl || activeIconUrl ? (
                <>
                  {defaultIconUrl && (
                    <img
                      src={defaultIconUrl}
                      alt=""
                      className="block shrink-0 object-contain"
                      style={{ ...iconSizeStyle, imageRendering: "pixelated" }}
                    />
                  )}
                  {activeIconUrl && (
                    <img
                      src={activeIconUrl}
                      alt=""
                      className="absolute inset-0 m-auto block shrink-0 object-contain transition-opacity duration-200"
                      style={{
                        ...iconSizeStyle,
                        opacity: showActiveIcon ? 1 : 0,
                        imageRendering: "pixelated",
                      }}
                    />
                  )}
                </>
              ) : (
                <div
                  className={`flex shrink-0 items-center justify-center rounded-full border-2 border-background shadow ${NODE_FALLBACK_COLOR}`}
                  style={iconSizeStyle}
                >
                  <span className="text-[10px] font-medium text-black/80">
                    {e.meta.id.slice(0, 2)}
                  </span>
                </div>
              )}
            </div>
          );
          const cellContent = (
            <div
              className="flex flex-col items-center justify-center outline-none p-0 m-0 min-w-0 min-h-0 border-0 w-full h-full"
              style={!showAbilityPopover ? { gridColumn: col, gridRow: row } : undefined}
              onMouseEnter={() => {
                setHoveredAbilityId(e.meta.id);
              }}
              onMouseLeave={() => {
                setHoveredAbilityId(null);
              }}
            >
              {trigger}
            </div>
          );
          const wrappedCell = showAbilityPopover ? (
            <div
              key={`ability-${e.meta.id}-${i}`}
              className="min-w-0 min-h-0 w-full h-full"
              style={{ gridColumn: col, gridRow: row }}
            >
              <Popover
                open={hoveredAbilityId === e.meta.id}
              >
                <PopoverTrigger asChild>{cellContent}</PopoverTrigger>
              <PopoverContent
                className="w-auto max-w-sm"
                align="start"
              >
                {treeNode ? (
                  <div className="space-y-3">
                    <div className="font-medium">
                      <AbilityMarkup html={treeNode.name} as="div" />
                    </div>
                    {(treeNode.description ?? []).length > 0 && (
                      <div className="space-y-1 text-xs">
                        {(treeNode.description ?? []).map((line, j) =>
                          line === "</br>" || line === "<br>" ? (
                            <br key={j} />
                          ) : (
                            <div key={j}>
                              <AbilityMarkup html={line} as="span" />
                            </div>
                          )
                        )}
                      </div>
                    )}
                    {/* <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {treeNode.requirements.ABILITY_POINTS != null && (
                        <span>AP: {treeNode.requirements.ABILITY_POINTS}</span>
                      )}
                      {treeNode.requirements.NODE != null && (
                        <span>Node: {treeNode.requirements.NODE}</span>
                      )}
                      {treeNode.requirements.ARCHETYPE != null && (
                        <span>
                          {treeNode.requirements.ARCHETYPE.name} ×
                          {treeNode.requirements.ARCHETYPE.amount}
                        </span>
                      )}
                    </div>
                    {(treeNode.links?.filter(Boolean).length ?? 0) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Links: {treeNode.links!.filter(Boolean).join(", ")}
                      </p>
                    )}
                    {(treeNode.locks?.length ?? 0) > 0 && (
                      <p className="text-xs text-destructive">
                        Locks: {treeNode.locks!.join(", ")}
                      </p>
                    )} */}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-medium">{e.meta.id}</p>
                    <p className="text-xs text-muted-foreground">
                      No tree data for this ability (id: {e.meta.id}, page:{" "}
                      {e.meta.page}).
                    </p>
                  </div>
                )}
              </PopoverContent>
              </Popover>
            </div>
          ) : (
            <div
              key={`ability-${e.meta.id}-${i}`}
              className="min-w-0 min-h-0 p-0 m-0"
              style={{ gridColumn: col, gridRow: row }}
            >
              {cellContent}
            </div>
          );
          return wrappedCell;
        })}
        
        {connectors.map((e, i) => {
          const col = e.coordinates.x - minX + 1;
          const row = e.coordinates.y - minY + 1;
          const defaultIconName = getConnectorIconName(e.meta);
          const connectorKey = `${e.coordinates.x},${e.coordinates.y}`;
          const isActive = activeConnectorKeys.has(connectorKey);
          const activeIconName = activeConnectorIconNames.get(connectorKey) ?? defaultIconName;
          const defaultUrl = getConnectorIconUrl(defaultIconName, "default");
          const activeUrl = getConnectorIconUrl(activeIconName, "active");
          return (
            <div
              key={`connector-${e.coordinates.x}-${e.coordinates.y}-${i}`}
              className="relative flex items-center justify-center p-0 m-0 min-w-0 min-h-0"
              style={{ gridColumn: col, gridRow: row }}
            >
              <img
                src={defaultUrl}
                alt=""
                className="block h-full max-h-[55px] w-full max-w-[55px] shrink-0 object-contain"
                style={{ imageRendering: "pixelated" }}
              />
              {isActive && (
                <img
                  src={activeUrl}
                  alt=""
                  className="block absolute inset-0 m-auto h-full max-h-[55px] w-full max-w-[55px] shrink-0 object-contain z-10"
                  style={{ imageRendering: "pixelated" }}
                />
              )}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
