"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { completeSubtask, completeTask } from "@/app/actions/tasks"

export function CompleteSubtaskButton({ subtaskId, label }: { subtaskId: string; label?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  return (
    <Button
      size="sm"
      disabled={loading}
      onClick={async () => {
        setLoading(true)
        try {
          await completeSubtask(subtaskId)
          toast.success("Nice work — marked done")
          router.refresh()
        } catch {
          toast.error("Couldn't update that. Try again.")
        } finally {
          setLoading(false)
        }
      }}
    >
      {loading ? <Loader2 className="size-4 animate-spin" data-icon="inline-start" /> : <Check className="size-4" data-icon="inline-start" />}
      {label ?? "Mark done"}
    </Button>
  )
}

export function CompleteTaskButton({ taskId }: { taskId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={loading}
      onClick={async () => {
        setLoading(true)
        try {
          await completeTask(taskId)
          toast.success("Task completed")
          router.refresh()
        } catch {
          toast.error("Couldn't update that. Try again.")
        } finally {
          setLoading(false)
        }
      }}
    >
      {loading ? <Loader2 className="size-4 animate-spin" data-icon="inline-start" /> : <Check className="size-4" data-icon="inline-start" />}
      Complete task
    </Button>
  )
}
