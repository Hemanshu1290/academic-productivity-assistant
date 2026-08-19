"use client"

import { useMemo, useState } from "react"
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Subtask, Task } from "@/lib/db/schema"
import { formatCategory } from "@/lib/category"
import { CompleteSubtaskButton, CompleteTaskButton } from "@/components/task-item-actions"

type CalendarEntry = {
  date: Date
  task: Task
  subtask: Subtask | null
}

function buildEntries(tasks: Task[], subtasks: Subtask[]): CalendarEntry[] {
  const entries: CalendarEntry[] = []
  const subtasksByTask = new Map<string, Subtask[]>()
  for (const s of subtasks) {
    const list = subtasksByTask.get(s.taskId) ?? []
    list.push(s)
    subtasksByTask.set(s.taskId, list)
  }

  for (const task of tasks) {
    const taskSubtasks = subtasksByTask.get(task.id) ?? []
    if (taskSubtasks.length === 0) {
      if (task.deadlineAt) entries.push({ date: task.deadlineAt, task, subtask: null })
      continue
    }
    for (const sub of taskSubtasks) {
      if (sub.scheduledFor) entries.push({ date: sub.scheduledFor, task, subtask: sub })
    }
  }
  return entries
}

export function CalendarView({ tasks, subtasks }: { tasks: Task[]; subtasks: Subtask[] }) {
  const [view, setView] = useState<"list" | "week" | "month">("list")
  const [cursor, setCursor] = useState(new Date())

  const entries = useMemo(() => buildEntries(tasks, subtasks), [tasks, subtasks])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>

        {view !== "list" && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setCursor(view === "week" ? subWeeks(cursor, 1) : subMonths(cursor, 1))
              }
              aria-label="Previous"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-32 text-center text-sm font-medium">
              {view === "week"
                ? `${format(startOfWeek(cursor), "d MMM")} – ${format(endOfWeek(cursor), "d MMM")}`
                : format(cursor, "MMMM yyyy")}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setCursor(view === "week" ? addWeeks(cursor, 1) : addMonths(cursor, 1))
              }
              aria-label="Next"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {view === "list" && <ListView entries={entries} />}
      {view === "week" && <WeekView entries={entries} cursor={cursor} />}
      {view === "month" && <MonthView entries={entries} cursor={cursor} />}
    </div>
  )
}

function ListView({ entries }: { entries: CalendarEntry[] }) {
  const sorted = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime())
  const grouped = new Map<string, CalendarEntry[]>()
  for (const entry of sorted) {
    const key = format(entry.date, "EEEE, d MMM")
    const list = grouped.get(key) ?? []
    list.push(entry)
    grouped.set(key, list)
  }

  if (grouped.size === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No scheduled tasks yet. Add one from the dashboard.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {Array.from(grouped.entries()).map(([day, dayEntries]) => (
        <div key={day} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground">{day}</h3>
          <ul className="flex flex-col gap-2">
            {dayEntries.map((entry) => (
              <EntryRow key={entry.subtask?.id ?? entry.task.id} entry={entry} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function EntryRow({ entry }: { entry: CalendarEntry }) {
  const { task, subtask, date } = entry
  const done = subtask ? subtask.status === "completed" : task.status === "completed"
  return (
    <li
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5",
        done && "opacity-60"
      )}
    >
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", done && "line-through")}>
          {subtask ? subtask.title : task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {formatCategory(task.category)}
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs">
            <Clock className="size-3" />
            {format(date, "h:mm a")}
          </Badge>
        </div>
      </div>
      {!done &&
        (subtask ? (
          <CompleteSubtaskButton subtaskId={subtask.id} label="Done" />
        ) : (
          <CompleteTaskButton taskId={task.id} />
        ))}
    </li>
  )
}

function WeekView({ entries, cursor }: { entries: CalendarEntry[]; cursor: Date }) {
  const days = eachDayOfInterval({ start: startOfWeek(cursor), end: endOfWeek(cursor) })
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day) => {
        const dayEntries = entries.filter((e) => isSameDay(e.date, day))
        return (
          <div key={day.toISOString()} className="flex flex-col gap-2 rounded-xl border border-border p-2.5">
            <p
              className={cn(
                "text-xs font-semibold",
                isSameDay(day, new Date()) ? "text-primary" : "text-muted-foreground"
              )}
            >
              {format(day, "EEE d")}
            </p>
            <div className="flex flex-col gap-1.5">
              {dayEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground/60">—</p>
              ) : (
                dayEntries.map((entry) => (
                  <div
                    key={entry.subtask?.id ?? entry.task.id}
                    className="truncate rounded-lg bg-secondary px-2 py-1 text-xs"
                    title={entry.subtask ? entry.subtask.title : entry.task.title}
                  >
                    {entry.subtask ? entry.subtask.title : entry.task.title}
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MonthView({ entries, cursor }: { entries: CalendarEntry[]; cursor: Date }) {
  const start = startOfWeek(startOfMonth(cursor))
  const end = endOfWeek(endOfMonth(cursor))
  const days = eachDayOfInterval({ start, end })

  return (
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
      {days.map((day) => {
        const dayEntries = entries.filter((e) => isSameDay(e.date, day))
        const inMonth = isSameMonth(day, cursor)
        return (
          <div
            key={day.toISOString()}
            className={cn(
              "flex min-h-20 flex-col gap-1 rounded-lg border border-border p-1.5 sm:min-h-24",
              !inMonth && "opacity-40"
            )}
          >
            <p
              className={cn(
                "text-xs font-medium",
                isSameDay(day, new Date()) ? "text-primary" : "text-muted-foreground"
              )}
            >
              {format(day, "d")}
            </p>
            {dayEntries.slice(0, 2).map((entry) => (
              <div
                key={entry.subtask?.id ?? entry.task.id}
                className="truncate rounded bg-secondary px-1.5 py-0.5 text-[10px]"
                title={entry.subtask ? entry.subtask.title : entry.task.title}
              >
                {entry.subtask ? entry.subtask.title : entry.task.title}
              </div>
            ))}
            {dayEntries.length > 2 && (
              <span className="text-[10px] text-muted-foreground">+{dayEntries.length - 2} more</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
