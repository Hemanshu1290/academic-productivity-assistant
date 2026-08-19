import type { Subtask, Task } from "@/lib/db/schema"

export type ActionableItem = {
  task: Task
  subtask: Subtask | null
  score: number
  reason: string
}

const MS_PER_HOUR = 1000 * 60 * 60

/**
 * Scores a task (or its next pending subtask) by urgency so the dashboard can
 * surface "what to do right now". Higher score = do it sooner.
 *
 * Signals:
 * - Time remaining until deadline (closer = more urgent, overdue = max urgency)
 * - Whether a session was already scheduled for today/now (anti-procrastination nudge)
 * - Task category weight (study/work slightly favored over general/errand as tie-break)
 */
export function scoreItem(
  task: Task,
  nextSubtask: Subtask | null,
  now: Date
): ActionableItem {
  let score = 0
  let reason = "No deadline yet — good time to make progress"

  if (task.deadlineAt) {
    const hoursLeft = (task.deadlineAt.getTime() - now.getTime()) / MS_PER_HOUR
    if (hoursLeft <= 0) {
      score += 1000 + Math.min(-hoursLeft, 500) // overdue: highest priority, worse the longer overdue
      reason = "Overdue — do this first"
    } else if (hoursLeft <= 3) {
      score += 900
      reason = "Due in the next few hours"
    } else if (hoursLeft <= 24) {
      score += 700
      reason = "Due today"
    } else if (hoursLeft <= 72) {
      score += 450
      reason = "Due in the next few days"
    } else {
      score += Math.max(50, 300 - hoursLeft / 4)
      reason = "Upcoming deadline"
    }
  }

  if (nextSubtask?.scheduledFor) {
    const scheduledHoursAway = (nextSubtask.scheduledFor.getTime() - now.getTime()) / MS_PER_HOUR
    if (scheduledHoursAway <= 0) {
      score += 150
      reason = "Scheduled session ready now"
    } else if (scheduledHoursAway <= 24) {
      score += 60
    }
  }

  const categoryWeight: Record<string, number> = {
    study: 8,
    work: 6,
    health: 5,
    personal: 3,
    errand: 3,
    general: 0,
  }
  score += categoryWeight[task.category] ?? 0

  return { task, subtask: nextSubtask, score, reason }
}

/**
 * Ranks all active tasks (with their next pending subtask, if any) and
 * returns them sorted by urgency, most urgent first.
 */
export function rankTasks(
  tasks: Task[],
  subtasksByTask: Map<string, Subtask[]>,
  now: Date
): ActionableItem[] {
  const items = tasks
    .filter((t) => t.status === "active")
    .map((task) => {
      const subtasks = subtasksByTask.get(task.id) ?? []
      const nextSubtask =
        subtasks
          .filter((s) => s.status === "pending")
          .sort((a, b) => a.orderIndex - b.orderIndex)[0] ?? null
      return scoreItem(task, nextSubtask, now)
    })

  return items.sort((a, b) => b.score - a.score)
}
