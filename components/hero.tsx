import Link from "next/link"
import { Zap, Users, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-14">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
      </div>
      
      <div className="relative z-10 flex max-w-3xl flex-col items-center text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm text-muted-foreground">
          <CreditCard className="h-4 w-4" />
          <span>Cartões com qualidade</span>
          <span className="text-accent underline decoration-accent underline-offset-2">garantida</span>
        </div>
        
        {/* Title */}
        <h1 className="text-balance text-5xl font-thin tracking-tight text-foreground shadow-inner md:text-7xl" style={{ fontFamily: 'var(--font-pt-sans)' }}>
          REV SYSTEM
        </h1>
        
        {/* Subtitle */}
        <p className="mb-4 text-balance text-xl text-muted-foreground md:text-2xl">
          A plataforma mais confiável para{" "}
          <span className="font-semibold" style={{ color: '#ff0000' }}>cartões digitais</span>
        </p>
        
        {/* Description */}
        <p className="mb-8 max-w-xl text-pretty text-muted-foreground">
          Compre cartões de forma simples, segura e instantânea. Entrega em segundos, 
          suporte 24/7 e garantia total.
        </p>
        
        {/* Stats */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            <span>Entrega Instantânea</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            <span>+10.000 Clientes</span>
          </div>
        </div>
        
        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" className="min-w-36" asChild>
            <Link href="/register">Criar conta</Link>
          </Button>
          <Button variant="secondary" size="lg" className="min-w-36" asChild>
            <Link href="/login">Fazer login</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
