import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { experimental_transcribe as transcribe } from "ai"
import { put, del } from "@vercel/blob"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("audio") as File | null
  if (!file) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 })
  }

  const blob = await put(`voice/${session.user.id}/${crypto.randomUUID()}.webm`, file, {
    access: "private",
  })

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await transcribe({
      model: "openai/whisper-1",
      audio: buffer,
    })

    if (!result.text || result.text.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not hear anything in that recording. Try again." },
        { status: 422 }
      )
    }

    return NextResponse.json({ transcript: result.text })
  } catch (error) {
    console.error("[v0] transcription error:", error)
    return NextResponse.json({ error: "Transcription failed. Please try again." }, { status: 500 })
  } finally {
    // We only needed the audio long enough to transcribe it.
    await del(blob.url).catch(() => {})
  }
}
