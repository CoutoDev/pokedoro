import type { PokemonType } from "@/shared/types/pokemon"

/**
 * Badge colors per elemental type. Light backgrounds (electric, ice, ground…)
 * use ink text instead of card text to keep WCAG AA contrast.
 */
export const TYPE_BADGE: Record<PokemonType, string> = {
  normal: "bg-[#a8a77a] text-ink",
  fire: "bg-[#c8401c] text-card",
  water: "bg-[#3a6fd8] text-card",
  electric: "bg-[#f7d02c] text-ink",
  grass: "bg-[#4e8f2e] text-card",
  ice: "bg-[#96d9d6] text-ink",
  fighting: "bg-[#a52a23] text-card",
  poison: "bg-[#8a3c8a] text-card",
  ground: "bg-[#e2bf65] text-ink",
  flying: "bg-[#a98ff3] text-ink",
  psychic: "bg-[#c8305f] text-card",
  bug: "bg-[#a6b91a] text-ink",
  rock: "bg-[#b6a136] text-ink",
  ghost: "bg-[#5a4683] text-card",
  dragon: "bg-[#5326d6] text-card",
  steel: "bg-[#b7b7ce] text-ink",
  fairy: "bg-[#d685ad] text-ink",
  dark: "bg-[#5a4636] text-card",
}
