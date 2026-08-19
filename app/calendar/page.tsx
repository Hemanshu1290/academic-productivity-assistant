import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AppNav } from "@/components/app-nav"
import { CalendarView } from "@/components/calendar-view"
import { getAllTasksWithSubtasks } from "@/app/actions/tasks"

export default async function CalendarPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const { tasks, subtasks } = await getAllTasksWithSubtasks()

  return (
    <div className="min-h-svh bg-background">
      <AppNav userName={session.user.name} />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every task and scheduled work session, spread out so nothing piles up at the deadline.
          </p>
        </div>
        <CalendarView tasks={tasks} subtasks={subtasks} />
      </main>
    </div>
  )
}
