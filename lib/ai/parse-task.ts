import { generateObject } from "ai"
import { z } from "zod"

const parsedTaskSchema = z.object({
  title: z
    .string()
    .describe("A short, clear task title in English, max 8 words. Translate from Hindi/Hinglish if needed."),
  description: z
    .string()
    .nullable()
    .describe("Any extra detail mentioned beyond the title, or null if none."),
  category: z
    .enum(["study", "work", "personal", "health", "errand", "general"])
    .describe("Best-fit category for the task."),
  deadlineISO: z
    .string()
    .nullable()
    .describe(
      "The resolved absolute deadline as an ISO 8601 datetime string in the user's local time, or null if no deadline was mentioned or implied."
    ),
  deadlineConfidence: z
    .enum(["exact", "inferred", "none"])
    .describe(
      "'exact' if a specific date/time was stated, 'inferred' if a relative phrase like 'kal' (tomorrow) or 'next week' was resolved, 'none' if no deadline was mentioned."
    ),
  estimatedMinutes: z
    .number()
    .int()
    .min(5)
    .max(600)
    .describe("A realistic estimate of total focused minutes needed to complete this task."),
})

export type ParsedTask = z.infer<typeof parsedTaskSchema>

/**
 * Parses free-form task input (English, Hindi, or Hinglish) into a structured task.
 * `now` and `timeZone` are passed explicitly so relative phrases like "kal raat"
 * (tomorrow night) or "next Monday" resolve against the user's actual clock.
 */
export async function parseTaskFromText(input: {
  rawText: string
  now: Date
  timeZone: string
}): Promise<ParsedTask> {
  const { rawText, now, timeZone } = input

  const { object } = await generateObject({
    model: "openai/gpt-5-mini",
    schema: parsedTaskSchema,
    system: `You are a task-parsing engine for an Indian productivity app. Users write in English, Hindi, or Hinglish (mixed). Extract a single actionable task from their input.

Current date/time: ${now.toISOString()} (${timeZone}).

Rules:
- Resolve relative dates ("kal" = tomorrow, "parso" = day after tomorrow, "aaj raat" = tonight, "agle hafte" = next week, "is weekend" = this weekend) into absolute ISO datetimes based on the current date/time given above.
- If a time of day isn't stated but a day is, assume 11:59 PM (23:59) local time for deadlines unless context implies otherwise (e.g. "subah" = morning implies ~09:00, "raat" = night implies ~21:00).
- If input mentions an exam, submission, or "due", treat that as the deadline.
- If truly no deadline is mentioned or implied, set deadlineISO to null and deadlineConfidence to "none".
- Keep the title in English and concise, even if input was in Hindi/Hinglish.`,
    prompt: rawText,
  })

  return object
}
