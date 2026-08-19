"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { subtasks, tasks, type Task } from "@/lib/db/schema"
import { parseTaskFromText } from "@/lib/ai/parse-task"
import { parseTaskFromImage } from "@/lib/ai/parse-task-from-image"
import { breakdownTask, scheduleSteps } from "@/lib/ai/breakdown"

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

async function createTaskWithBreakdown(
  userId: string,
  parsed: {
    title: string
    description: string | null
    category: string
    deadlineISO: string | null
    deadlineConfidence: "exact" | "inferred" | "none"
    estimatedMinutes: number
  },
  sourceType: "text" | "voice" | "photo",
  sourceRaw: string | null
): Promise<Task> {
  const now = new Date()
  const deadline = parsed.deadlineISO ? new Date(parsed.deadlineISO) : null
  const taskId = crypto.randomUUID()

  const [task] = await db
    .insert(tasks)
    .values({
      id: taskId,
      userId,
      title: parsed.title,
      description: parsed.description,
      category: parsed.category,
      deadlineAt: deadline,
      deadlineConfidence: parsed.deadlineConfidence,
      estimatedMinutes: parsed.estimatedMinutes,
      sourceType,
      sourceRaw,
    })
    .returning()

  const breakdown = await breakdownTask({
    title: parsed.title,
    description: parsed.description,
    estimatedMinutes: parsed.estimatedMinutes,
  })
  const scheduledDates = scheduleSteps({ steps: breakdown.steps, now, deadline })

  if (breakdown.steps.length > 0) {
    await db.insert(subtasks).values(
      breakdown.steps.map((step, i) => ({
        id: crypto.randomUUID(),
        userId,
        taskId,
        title: step.title,
        orderIndex: i,
        estimatedMinutes: step.estimatedMinutes,
        scheduledFor: scheduledDates[i],
      }))
    )
  }

  return task
}

export async function createTaskFromText(rawText: string) {
  const userId = await getUserId()
  const parsed = await parseTaskFromText({
    rawText,
    now: new Date(),
    timeZone: "Asia/Kolkata",
  })
  const task = await createTaskWithBreakdown(userId, parsed, "text", rawText)
  revalidatePath("/dashboard")
  revalidatePath("/calendar")
  return task
}

export async function createTaskFromTranscript(transcript: string) {
  const userId = await getUserId()
  const parsed = await parseTaskFromText({
    rawText: transcript,
    now: new Date(),
    timeZone: "Asia/Kolkata",
  })
  const task = await createTaskWithBreakdown(userId, parsed, "voice", transcript)
  revalidatePath("/dashboard")
  revalidatePath("/calendar")
  return task
}

export async function createTasksFromImage(imageUrl: string) {
  const userId = await getUserId()
  const result = await parseTaskFromImage({
    imageUrl,
    now: new Date(),
    timeZone: "Asia/Kolkata",
  })

  const created: Task[] = []
  for (const parsed of result.tasks) {
    const task = await createTaskWithBreakdown(userId, parsed, "photo", null)
    created.push(task)
  }

  revalidatePath("/dashboard")
  revalidatePath("/calendar")
  return created
}

export async function getActiveTasks() {
  const userId = await getUserId()
  return db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.status, "active")))
}

export async function getAllTasksWithSubtasks() {
  const userId = await getUserId()
  const userTasks = await db.select().from(tasks).where(eq(tasks.userId, userId))
  const userSubtasks = await db.select().from(subtasks).where(eq(subtasks.userId, userId))
  return { tasks: userTasks, subtasks: userSubtasks }
}

export async function completeSubtask(subtaskId: string) {
  const userId = await getUserId()
  await db
    .update(subtasks)
    .set({ status: "completed", completedAt: new Date() })
    .where(and(eq(subtasks.id, subtaskId), eq(subtasks.userId, userId)))

  const [sub] = await db
    .select()
    .from(subtasks)
    .where(and(eq(subtasks.id, subtaskId), eq(subtasks.userId, userId)))

  if (sub) {
    const remaining = await db
      .select()
      .from(subtasks)
      .where(and(eq(subtasks.taskId, sub.taskId), eq(subtasks.userId, userId)))

    const allDone = remaining.every((s) => s.status === "completed")
    if (allDone) {
      await db
        .update(tasks)
        .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(tasks.id, sub.taskId), eq(tasks.userId, userId)))
    }
  }

  revalidatePath("/dashboard")
  revalidatePath("/calendar")
}

export async function reopenSubtask(subtaskId: string) {
  const userId = await getUserId()
  await db
    .update(subtasks)
    .set({ status: "pending", completedAt: null })
    .where(and(eq(subtasks.id, subtaskId), eq(subtasks.userId, userId)))

  const [sub] = await db
    .select()
    .from(subtasks)
    .where(and(eq(subtasks.id, subtaskId), eq(subtasks.userId, userId)))

  if (sub) {
    await db
      .update(tasks)
      .set({ status: "active", completedAt: null, updatedAt: new Date() })
      .where(and(eq(tasks.id, sub.taskId), eq(tasks.userId, userId)))
  }

  revalidatePath("/dashboard")
  revalidatePath("/calendar")
}

export async function completeTask(taskId: string) {
  const userId = await getUserId()
  await db
    .update(tasks)
    .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
  await db
    .update(subtasks)
    .set({ status: "completed", completedAt: new Date() })
    .where(and(eq(subtasks.taskId, taskId), eq(subtasks.userId, userId)))

  revalidatePath("/dashboard")
  revalidatePath("/calendar")
}

export async function deleteTask(taskId: string) {
  const userId = await getUserId()
  await db.delete(subtasks).where(and(eq(subtasks.taskId, taskId), eq(subtasks.userId, userId)))
  await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
  revalidatePath("/dashboard")
  revalidatePath("/calendar")
}
