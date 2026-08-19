import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { put, del } from "@vercel/blob"
import { auth } from "@/lib/auth"
import { createTasksFromImage } from "@/app/actions/tasks"

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("photo") as File | null
  if (!file) {
    return NextResponse.json({ error: "No photo provided" }, { status: 400 })
  }

  const ext = file.type.split("/")[1] || "jpg"
  const blob = await put(`photo/${session.user.id}/${crypto.randomUUID()}.${ext}`, file, {
    access: "public",
  })

  try {
    const tasksCreated = await createTasksFromImage(blob.url)
    return NextResponse.json({ tasks: tasksCreated })
  } catch (error) {
    console.error("[v0] photo parse error:", error)
    return NextResponse.json(
      { error: "Could not read any tasks from that photo. Try a clearer shot." },
      { status: 422 }
    )
  } finally {
    await del(blob.url).catch(() => {})
  }
}
