"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Mic, Camera, Send, Square, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { createTaskFromText, createTaskFromTranscript } from "@/app/actions/tasks"

type Mode = "idle" | "recording" | "transcribing" | "submitting" | "photo-processing"

export function QuickCapture() {
  const router = useRouter()
  const [text, setText] = useState("")
  const [mode, setMode] = useState<Mode>("idle")
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewTranscript, setReviewTranscript] = useState("")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const photoInputRef = useRef<HTMLInputElement>(null)

  const busy = mode !== "idle" && mode !== "recording"

  async function submitText(value: string) {
    if (!value.trim()) return
    setMode("submitting")
    try {
      await createTaskFromText(value.trim())
      toast.success("Task captured", { description: value.trim() })
      setText("")
      router.refresh()
    } catch (error) {
      console.error("[v0] create task error:", error)
      toast.error("Couldn't process that task. Try rephrasing it.")
    } finally {
      setMode("idle")
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        await handleTranscribe(blob)
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setMode("recording")
    } catch (error) {
      console.error("[v0] mic error:", error)
      toast.error("Couldn't access your microphone.")
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setMode("transcribing")
  }

  async function handleTranscribe(blob: Blob) {
    try {
      const formData = new FormData()
      formData.append("audio", blob, "recording.webm")
      const res = await fetch("/api/capture/voice", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Transcription failed")

      setReviewTranscript(data.transcript)
      setReviewOpen(true)
      setMode("idle")
    } catch (error) {
      console.error("[v0] transcribe error:", error)
      toast.error(error instanceof Error ? error.message : "Transcription failed.")
      setMode("idle")
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setMode("photo-processing")
    try {
      const formData = new FormData()
      formData.append("photo", file)
      const res = await fetch("/api/capture/photo", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Could not read that photo")

      const count = data.tasks?.length ?? 0
      toast.success(count === 1 ? "Task captured from photo" : `${count} tasks captured from photo`)
      router.refresh()
    } catch (error) {
      console.error("[v0] photo error:", error)
      toast.error(error instanceof Error ? error.message : "Could not read that photo.")
    } finally {
      setMode("idle")
    }
  }

  async function confirmTranscript() {
    setReviewOpen(false)
    await submitText(reviewTranscript)
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submitText(text)
          }}
          className="flex flex-col gap-3"
        >
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing &&
                e.keyCode !== 229
              ) {
                e.preventDefault()
                submitText(text)
              }
            }}
            placeholder="Type any task… &quot;kal tak physics assignment submit karna hai&quot;"
            rows={2}
            className="resize-none border-0 bg-transparent px-1 text-base shadow-none focus-visible:ring-0"
            disabled={busy}
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={busy}
                onClick={mode === "recording" ? stopRecording : startRecording}
                aria-label={mode === "recording" ? "Stop recording" : "Record a task"}
                className={cn(mode === "recording" && "border-primary text-primary")}
              >
                {mode === "recording" ? (
                  <Square className="size-4 fill-current" />
                ) : mode === "transcribing" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mic className="size-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={busy}
                onClick={() => photoInputRef.current?.click()}
                aria-label="Capture a photo"
              >
                {mode === "photo-processing" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
              </Button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoChange}
              />
              {mode === "recording" && (
                <span className="flex items-center gap-1.5 text-sm text-primary">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                  Listening…
                </span>
              )}
            </div>
            <Button type="submit" disabled={busy || !text.trim()} size="sm">
              {mode === "submitting" ? (
                <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
              ) : (
                <Send className="size-4" data-icon="inline-start" />
              )}
              Add task
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Here&apos;s what we heard</DialogTitle>
            <DialogDescription>Edit if needed, then confirm to create the task.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reviewTranscript}
            onChange={(e) => setReviewTranscript(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmTranscript}>Create task</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
