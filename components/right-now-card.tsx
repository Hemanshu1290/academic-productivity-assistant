import { Flame, Clock, ListChecks } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import type { ActionableItem } from "@/lib/priority"
import { formatCategory, formatDeadline } from "@/lib/category"
import { CompleteSubtaskButton, CompleteTaskButton } from "@/components/task-item-actions"

export function RightNowCard({ item }: { item: ActionableItem | null }) {
  if (!item) {
    return (
      <Empty className="rounded-2xl border border-border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Flame />
          </EmptyMedia>
          <EmptyTitle>Nothing urgent right now</EmptyTitle>
          <EmptyDescription>
            Add a task above — voice, text, or a photo of your assignment sheet.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const { task, subtask, reason } = item
  const overdue = task.deadlineAt ? task.deadlineAt.getTime() < Date.now() : false

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-primary">
        <Flame className="size-4" fill="currentColor" />
        Do this right now
      </div>

      <h2 className="mt-3 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
        {subtask ? subtask.title : task.title}
      </h2>

      {subtask && (
        <p className="mt-1 text-sm text-muted-foreground">
          Part of <span className="font-medium text-foreground">{task.title}</span>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{formatCategory(task.category)}</Badge>
        <Badge variant={overdue ? "destructive" : "outline"} className="gap-1">
          <Clock className="size-3" />
          {formatDeadline(task.deadlineAt)}
        </Badge>
        {subtask && (
          <Badge variant="outline" className="gap-1">
            <ListChecks className="size-3" />~{subtask.estimatedMinutes} min
          </Badge>
        )}
      </div>

      <p className="mt-4 text-sm text-muted-foreground text-pretty">{reason}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {subtask ? (
          <CompleteSubtaskButton subtaskId={subtask.id} label="Mark this step done" />
        ) : (
          <CompleteTaskButton taskId={task.id} />
        )}
      </div>
    </div>
  )
}
