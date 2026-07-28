/** PokeAPI species names are lowercase (e.g. "pikachu"); capitalize for display. */
export function capitalizeName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1)
}
