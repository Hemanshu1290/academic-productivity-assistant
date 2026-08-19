import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AppNav } from "@/components/app-nav"
import { QuickCapture } from "@/components/quick-capture"
import { RightNowCard } from "@/components/right-now-card"
import { UpNextList } from "@/components/up-next-list"
import { getAllTasksWithSubtasks } from "@/app/actions/tasks"
import { rankTasks } from "@/lib/priority"
import type { Subtask } from "@/lib/db/schema"

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const { tasks, subtasks } = await getAllTasksWithSubtasks()

  const subtasksByTask = new Map<string, Subtask[]>()
  for (const s of subtasks) {
    const list = subtasksByTask.get(s.taskId) ?? []
    list.push(s)
    subtasksByTask.set(s.taskId, list)
  }

  const ranked = rankTasks(tasks, subtasksByTask, new Date())
  const [top, ...rest] = ranked
  const upNext = rest.slice(0, 8)

  const activeCount = tasks.filter((t) => t.status === "active").length
  const completedToday = tasks.filter(
    (t) => t.completedAt && t.completedAt.toDateString() === new Date().toDateString()
  ).length

  return (
    <div className="min-h-svh bg-background">
      <AppNav userName={session.user.name} />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            Hey {session.user.name.split(" ")[0]}, here&apos;s what&apos;s next
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCount} active task{activeCount === 1 ? "" : "s"} · {completedToday} completed today
          </p>
        </div>

        <QuickCapture />

        <section className="flex flex-col gap-4">
          <RightNowCard item={top ?? null} />
        </section>

        {upNext.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground">Up next</h2>
            <UpNextList items={upNext} />
          </section>
        )}
      </main>
    </div>
  )
}
