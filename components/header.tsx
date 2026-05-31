"use client"

import Link from "next/link"
import { User } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-foreground">
            K
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">KNIGHT</span>
        </Link>
        
        <Button variant="secondary" size="sm" className="gap-2" asChild>
          <Link href="/login">
            <User className="h-4 w-4" />
            Entrar
          </Link>
        </Button>
      </div>
    </header>
  )
}
