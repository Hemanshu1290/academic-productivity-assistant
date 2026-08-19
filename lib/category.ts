export const CATEGORY_LABELS: Record<string, string> = {
  study: "Study",
  work: "Work",
  personal: "Personal",
  health: "Health",
  errand: "Errand",
  general: "General",
}

export function formatCategory(category: string): string {
  return CATEGORY_LABELS[category] ?? "General"
}

export function formatDeadline(date: Date | null): string {
  if (!date) return "No deadline"
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  const timeStr = date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
  const isToday = date.toDateString() === now.toDateString()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow = date.toDateString() === tomorrow.toDateString()

  if (diffMs < 0) {
    const overdueHours = Math.abs(diffHours)
    if (overdueHours < 24) return `Overdue by ${Math.round(overdueHours)}h`
    return `Overdue by ${Math.round(overdueHours / 24)}d`
  }

  if (isToday) return `Today, ${timeStr}`
  if (isTomorrow) return `Tomorrow, ${timeStr}`

  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + `, ${timeStr}`
}
