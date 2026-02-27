"use client";

/**
 * Zustand store for Wynncraft Player module
 * Caches API responses and exposes fetch actions
 */

import { create } from "zustand";
import type {
  PlayerMainStats,
  PlayerMainStatsResponse,
  PlayerFullStats,
  PlayerCharacterListItem,
  PlayerCharacterData,
  PlayerCharacterAbilityMap,
  PlayerWhoami,
  OnlinePlayerList,
} from "@/types/player";
import {
  getPlayerMainStats as apiMainStats,
  getPlayerFullStats as apiFullStats,
  getPlayerCharacterList as apiCharacterList,
  getPlayerCharacterData as apiCharacterData,
  getPlayerCharacterAbilityMap as apiAbilityMap,
  getPlayerWhoami as apiWhoami,
  getOnlinePlayerList as apiOnlineList,
  assertPlayerMainStats,
} from "@/api/player";

interface PlayerState {
  // Main / full stats
  mainStats: PlayerMainStats | null;
  mainStatsResponse: PlayerMainStatsResponse | null;
  fullStats: PlayerFullStats | null;
  currentIdentifier: string | null;
  mainError: string | null;
  fullError: string | null;

  // Character list & data
  characterList: Record<string, PlayerCharacterListItem> | null;
  characterData: Record<string, PlayerCharacterData>;
  characterListError: string | null;
  characterDataError: string | null;

  // Ability map (key = characterUuid)
  abilityMaps: Record<string, PlayerCharacterAbilityMap>;
  abilityMapError: string | null;

  // Whoami & online
  whoami: PlayerWhoami | null;
  whoamiError: string | null;
  onlineList: OnlinePlayerList | null;
  onlineListError: string | null;

  // Loading flags
  loadingMain: boolean;
  loadingFull: boolean;
  loadingCharacterList: boolean;
  loadingCharacterData: boolean;
  loadingAbilityMap: boolean;
  loadingWhoami: boolean;
  loadingOnline: boolean;
}

interface PlayerActions {
  fetchMainStats: (identifier: string) => Promise<PlayerMainStatsResponse>;
  fetchFullStats: (identifier: string) => Promise<PlayerFullStats>;
  fetchCharacterList: (identifier: string) => Promise<Record<string, PlayerCharacterListItem>>;
  fetchCharacterData: (
    identifier: string,
    characterUuid: string
  ) => Promise<PlayerCharacterData>;
  fetchAbilityMap: (
    identifier: string,
    characterUuid: string
  ) => Promise<PlayerCharacterAbilityMap>;
  fetchWhoami: () => Promise<PlayerWhoami>;
  fetchOnlineList: () => Promise<OnlinePlayerList>;

  setCurrentPlayer: (identifier: string | null) => void;
  clearPlayer: () => void;
  clearErrors: () => void;
}

const initialState: PlayerState = {
  mainStats: null,
  mainStatsResponse: null,
  fullStats: null,
  currentIdentifier: null,
  mainError: null,
  fullError: null,
  characterList: null,
  characterData: {},
  characterListError: null,
  characterDataError: null,
  abilityMaps: {},
  abilityMapError: null,
  whoami: null,
  whoamiError: null,
  onlineList: null,
  onlineListError: null,
  loadingMain: false,
  loadingFull: false,
  loadingCharacterList: false,
  loadingCharacterData: false,
  loadingAbilityMap: false,
  loadingWhoami: false,
  loadingOnline: false,
};

export const usePlayerStore = create<PlayerState & PlayerActions>((set, get) => ({
  ...initialState,

  fetchMainStats: async (identifier: string) => {
    set({ loadingMain: true, mainError: null });
    try {
      const data = await apiMainStats(identifier);
      const isSingle =
        data != null &&
        typeof data === "object" &&
        "username" in data &&
        typeof (data as PlayerMainStats).username === "string";
      set({
        mainStatsResponse: data,
        mainStats: isSingle ? (data as PlayerMainStats) : null,
        currentIdentifier: identifier,
        loadingMain: false,
      });
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ mainError: msg, loadingMain: false });
      throw e;
    }
  },

  fetchFullStats: async (identifier: string) => {
    set({ loadingFull: true, fullError: null });
    try {
      const data = await apiFullStats(identifier);
      set({
        fullStats: data,
        currentIdentifier: identifier,
        loadingFull: false,
      });
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ fullError: msg, loadingFull: false });
      throw e;
    }
  },

  fetchCharacterList: async (identifier: string) => {
    set({ loadingCharacterList: true, characterListError: null });
    try {
      const data = await apiCharacterList(identifier);
      set({
        characterList: data,
        loadingCharacterList: false,
      });
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ characterListError: msg, loadingCharacterList: false });
      throw e;
    }
  },

  fetchCharacterData: async (identifier: string, characterUuid: string) => {
    set({ loadingCharacterData: true, characterDataError: null });
    try {
      const data = await apiCharacterData(identifier, characterUuid);
      set((s) => ({
        characterData: { ...s.characterData, [characterUuid]: data },
        loadingCharacterData: false,
      }));
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ characterDataError: msg, loadingCharacterData: false });
      throw e;
    }
  },

  fetchAbilityMap: async (identifier: string, characterUuid: string) => {
    set({ loadingAbilityMap: true, abilityMapError: null });
    try {
      const data = await apiAbilityMap(identifier, characterUuid);
      set((s) => ({
        abilityMaps: { ...s.abilityMaps, [characterUuid]: data },
        loadingAbilityMap: false,
      }));
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ abilityMapError: msg, loadingAbilityMap: false });
      throw e;
    }
  },

  fetchWhoami: async () => {
    set({ loadingWhoami: true, whoamiError: null });
    try {
      const data = await apiWhoami();
      set({ whoami: data, loadingWhoami: false });
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ whoamiError: msg, loadingWhoami: false });
      throw e;
    }
  },

  fetchOnlineList: async () => {
    set({ loadingOnline: true, onlineListError: null });
    try {
      const data = await apiOnlineList();
      set({ onlineList: data, loadingOnline: false });
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ onlineListError: msg, loadingOnline: false });
      throw e;
    }
  },

  setCurrentPlayer: (identifier: string | null) => {
    set({ currentIdentifier: identifier });
  },

  clearPlayer: () => {
    set({
      mainStats: null,
      mainStatsResponse: null,
      fullStats: null,
      currentIdentifier: null,
      characterList: null,
      characterData: {},
      abilityMaps: {},
      mainError: null,
      fullError: null,
      characterListError: null,
      characterDataError: null,
      abilityMapError: null,
    });
  },

  clearErrors: () => {
    set({
      mainError: null,
      fullError: null,
      characterListError: null,
      characterDataError: null,
      abilityMapError: null,
      whoamiError: null,
      onlineListError: null,
    });
  },
}));

/** Selector: get main stats or null (use after checking for multi-selector) */
export function usePlayerMainStats(): PlayerMainStats | null {
  return usePlayerStore.getState().mainStats ?? null;
}

/** Re-export for convenience */
export { assertPlayerMainStats };
