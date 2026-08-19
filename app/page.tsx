import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Zap, Mic, Camera, Type, ArrowRight, Flame } from "lucide-react"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"

export default async function LandingPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect("/dashboard")

  return (
    <main className="min-h-svh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="size-4" fill="currentColor" />
          </span>
          <span className="text-base font-bold tracking-tight">StartNow</span>
        </div>
        <div className="flex items-center gap-2">
          <Button render={<Link href="/sign-in" />} variant="ghost" size="sm">
            Sign in
          </Button>
          <Button render={<Link href="/sign-up" />} size="sm">
            Get started
          </Button>
        </div>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
        <div className="mb-5 flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
          <Flame className="size-3.5 text-primary" fill="currentColor" />
          Built for people who plan to start &quot;kal se&quot;
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-6xl">
          Stop planning to start.
          <br />
          <span className="text-primary">Start now.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
          Speak, type, or snap a photo of any task in English, Hindi, or Hinglish. StartNow finds
          the real deadline, breaks it into steps, and tells you exactly what to do right now — so
          it never piles up the night before.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button render={<Link href="/sign-up" />} size="lg">
            Get started free
            <ArrowRight className="size-4" data-icon="inline-end" />
          </Button>
          <Button render={<Link href="/sign-in" />} size="lg" variant="outline">
            Sign in
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-4 pb-24 sm:grid-cols-3 sm:px-6">
        <FeatureCard
          icon={Type}
          title="Type it, any language"
          description={'"kal tak physics assignment submit karna hai" becomes a scheduled task with real subtasks — instantly.'}
        />
        <FeatureCard
          icon={Mic}
          title="Or just say it"
          description="Record a voice note in Hindi, English, or a mix of both. We transcribe and structure it for you."
        />
        <FeatureCard
          icon={Camera}
          title="Or snap a photo"
          description="Point your camera at a handwritten note, timetable, or whiteboard. We pull out every task and deadline."
        />
      </section>
    </main>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Type
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Icon className="size-5" />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground text-pretty">{description}</p>
    </div>
  )
}
