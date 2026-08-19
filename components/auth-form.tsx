"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result =
      mode === "sign-up"
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (result.error) {
      setError(
        mode === "sign-up"
          ? "Could not create your account. Try a different email or a stronger password."
          : "Incorrect email or password."
      )
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Zap className="size-6" fill="currentColor" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-balance">
          {mode === "sign-up" ? "Start now, not later" : "Welcome back"}
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          {mode === "sign-up"
            ? "Create your account and never miss a deadline again."
            : "Sign in to see what needs your attention right now."}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <FieldGroup>
          {mode === "sign-up" && (
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ananya Sharma"
                required
                autoComplete="name"
              />
            </Field>
          )}
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            />
          </Field>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Spinner data-icon="inline-start" />}
            {mode === "sign-up" ? "Create account" : "Sign in"}
          </Button>
        </FieldGroup>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "sign-up" ? (
          <>
            Already have an account?{" "}
            <a href="/sign-in" className="font-medium text-foreground underline underline-offset-4">
              Sign in
            </a>
          </>
        ) : (
          <>
            New here?{" "}
            <a href="/sign-up" className="font-medium text-foreground underline underline-offset-4">
              Create an account
            </a>
          </>
        )}
      </p>
    </div>
  )
}
