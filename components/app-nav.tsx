"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Zap, LayoutGrid, Calendar as CalendarIcon, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"

const links = [
  { href: "/dashboard", label: "Right now", icon: LayoutGrid },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
]

export function AppNav({ userName }: { userName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="size-4" fill="currentColor" />
            </span>
            <span className="text-base font-bold tracking-tight">StartNow</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((link) => {
              const active = pathname?.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <link.icon className="size-4" />
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">{userName}</span>
          <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
      <nav className="flex items-center gap-1 border-t border-border/60 px-4 py-1.5 sm:hidden">
        {links.map((link) => {
          const active = pathname?.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-secondary text-foreground" : "text-muted-foreground"
              )}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
