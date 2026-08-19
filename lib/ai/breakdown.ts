import { generateObject } from "ai"
import { z } from "zod"

const breakdownSchema = z.object({
  steps: z
    .array(
      z.object({
        title: z.string().describe("A concrete, actionable subtask, max 10 words."),
        estimatedMinutes: z.number().int().min(10).max(180),
      })
    )
    .min(2)
    .max(8)
    .describe("Ordered subtasks that together complete the parent task."),
})

export type Breakdown = z.infer<typeof breakdownSchema>

/**
 * Asks the model to break a task into 2-8 concrete subtasks. Falls back to a
 * deterministic split if the model call fails, so task creation never blocks
 * on AI availability.
 */
export async function breakdownTask(input: {
  title: string
  description?: string | null
  estimatedMinutes?: number | null
}): Promise<Breakdown> {
  try {
    const { object } = await generateObject({
      model: "openai/gpt-5-mini",
      schema: breakdownSchema,
      system: `You break tasks into a small number of concrete, sequential subtasks a person can actually sit down and do. Prefer 3-5 steps for normal tasks. Each step should be independently completable and clearly worded. Total estimated minutes across steps should roughly match the task's overall estimate if given.`,
      prompt: `Task: ${input.title}${input.description ? `\nDetails: ${input.description}` : ""}${
        input.estimatedMinutes ? `\nOverall estimate: ${input.estimatedMinutes} minutes` : ""
      }`,
    })
    return object
  } catch {
    return deterministicBreakdown(input.title, input.estimatedMinutes ?? 60)
  }
}

function deterministicBreakdown(title: string, totalMinutes: number): Breakdown {
  const stepCount = totalMinutes > 120 ? 4 : totalMinutes > 45 ? 3 : 2
  const per = Math.max(15, Math.round(totalMinutes / stepCount))
  const labels = ["Start", "Continue", "Wrap up", "Final review"]
  return {
    steps: Array.from({ length: stepCount }, (_, i) => ({
      title: `${labels[i] ?? "Continue"}: ${title}`,
      estimatedMinutes: per,
    })),
  }
}

/**
 * Anti-procrastination scheduling: spreads subtasks across the time between
 * now and the deadline instead of clustering them all right before it.
 * Reserves the final slot with buffer before the deadline so there's always
 * room to fix mistakes.
 */
export function scheduleSteps(input: {
  steps: { estimatedMinutes: number }[]
  now: Date
  deadline: Date | null
}): Date[] {
  const { steps, now, deadline } = input
  const count = steps.length

  if (!deadline || deadline.getTime() <= now.getTime()) {
    // No deadline (or already overdue): schedule sessions starting today,
    // one per day, so work still starts immediately.
    return steps.map((_, i) => addDays(now, i))
  }

  const totalWindowMs = deadline.getTime() - now.getTime()
  const bufferMs = Math.min(totalWindowMs * 0.15, 1000 * 60 * 60 * 24) // up to 1 day buffer
  const usableWindowMs = Math.max(totalWindowMs - bufferMs, totalWindowMs * 0.5)

  return steps.map((_, i) => {
    // Evenly spread across the usable window, front-loaded slightly so the
    // first session happens soon rather than "day 1 of N".
    const fraction = count === 1 ? 0 : i / count
    const target = new Date(now.getTime() + fraction * usableWindowMs)
    return target
  })
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}
