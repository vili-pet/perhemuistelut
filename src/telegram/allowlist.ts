export function parseAllowedUserIds(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export function isAllowedUserId(
  userId: string | number | undefined,
  allowedIds: readonly string[],
): boolean {
  if (userId == null || allowedIds.length === 0) return false
  return allowedIds.includes(String(userId))
}

export function clientAllowedUserIds(): string[] {
  return parseAllowedUserIds(import.meta.env.VITE_TELEGRAM_ALLOWED_USER_ID)
}
