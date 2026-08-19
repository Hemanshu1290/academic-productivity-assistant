import { generateObject } from "ai"
import { z } from "zod"

const parsedImageTaskSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string().describe("A short, clear task title in English, max 8 words."),
        description: z.string().nullable(),
        category: z.enum(["study", "work", "personal", "health", "errand", "general"]),
        deadlineISO: z.string().nullable(),
        deadlineConfidence: z.enum(["exact", "inferred", "none"]),
        estimatedMinutes: z.number().int().min(5).max(600),
      })
    )
    .min(1)
    .describe("One entry per distinct assignment, exam, or task visible in the image."),
})

export type ParsedImageResult = z.infer<typeof parsedImageTaskSchema>

/**
 * Extracts one or more tasks from a photo — a handwritten assignment note,
 * a printed timetable, a whiteboard, or a screenshot of a message.
 */
export async function parseTaskFromImage(input: {
  imageUrl: string
  now: Date
  timeZone: string
}): Promise<ParsedImageResult> {
  const { imageUrl, now, timeZone } = input

  const { object } = await generateObject({
    model: "openai/gpt-5-mini",
    schema: parsedImageTaskSchema,
    system: `You are a task-extraction engine for an Indian productivity app. You will see a photo — a handwritten note, printed timetable, whiteboard, textbook page, or screenshot — that contains one or more tasks, assignments, or exams (text may be in English, Hindi, or Hinglish).

Current date/time: ${now.toISOString()} (${timeZone}).

Rules:
- Extract every distinct task/assignment/exam you can identify.
- Resolve relative or shorthand dates into absolute ISO datetimes based on the current date/time above.
- If a time isn't stated but a day is, assume 23:59 local time.
- If no deadline is visible or implied for an item, set deadlineISO to null and deadlineConfidence to "none".
- Keep titles in English and concise.`,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Extract the tasks from this image." },
          { type: "image", image: imageUrl },
        ],
      },
    ],
  })

  return object
}
