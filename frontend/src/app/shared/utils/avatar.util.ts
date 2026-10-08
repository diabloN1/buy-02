export function getDeterministicAvatarUrl(seed?: string, name?: string): string {
  const cleanSeed = encodeURIComponent((seed || name || "user").trim().toLowerCase());
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${cleanSeed}`;
}

export function getUserInitials(name?: string): string {
  if (!name || !name.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}
