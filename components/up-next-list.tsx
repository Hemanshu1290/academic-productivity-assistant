import { Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ActionableItem } from "@/lib/priority"
import { formatCategory, formatDeadline } from "@/lib/category"
import { CompleteSubtaskButton, CompleteTaskButton } from "@/components/task-item-actions"

export function UpNextList({ items }: { items: ActionableItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nothing else queued up. You&apos;re clear.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const { task, subtask } = item
        const overdue = task.deadlineAt ? task.deadlineAt.getTime() < Date.now() : false
        return (
          <li
            key={subtask ? subtask.id : task.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{subtask ? subtask.title : task.title}</p>
              {subtask && <p className="truncate text-xs text-muted-foreground">{task.title}</p>}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="text-xs">
                  {formatCategory(task.category)}
                </Badge>
                <Badge variant={overdue ? "destructive" : "outline"} className="gap-1 text-xs">
                  <Clock className="size-3" />
                  {formatDeadline(task.deadlineAt)}
                </Badge>
              </div>
            </div>
            {subtask ? (
              <CompleteSubtaskButton subtaskId={subtask.id} label="Done" />
            ) : (
              <CompleteTaskButton taskId={task.id} />
            )}
          </li>
        )
      })}
    </ul>
  )
}
